using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Shipper;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Hubs;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;

namespace GlocalCart.API.Services.Implementations
{
    public class ShipperService : IShipperService
    {
        private const string FallbackShopAddress = "72 Le Loi, Phuong Ben Thanh, Quan 1, TP Ho Chi Minh, Viet Nam";
        private const int MaxAvailableEndpointDistanceMeters = 10_000;
        private static readonly TimeSpan ShipperLocationFreshness = TimeSpan.FromMinutes(15);
        private static readonly GeoPoint FallbackShopCoordinate = new(10.7743, 106.7017);
        private readonly record struct GeoPoint(double Latitude, double Longitude);

        private readonly AppDbContext _db;
        private readonly INotificationService _notif;
        private readonly IHubContext<DeliveryHub> _deliveryHub;

        public ShipperService(AppDbContext db, INotificationService notif, IHubContext<DeliveryHub> deliveryHub)
        {
            _db = db;
            _notif = notif;
            _deliveryHub = deliveryHub;
        }

        public async Task<PagedResult<ShipperShipmentDto>> GetAvailableShipmentsAsync(int shipperId, int page, int pageSize)
        {
            var shipperLocation = await GetFreshShipperLocationAsync(shipperId);
            if (shipperLocation == null)
            {
                return EmptyShipmentPage(page, pageSize);
            }

            var shipments = await QueryShipments()
                .Where(s => s.ShipperId == null
                    && s.Status == ShipmentStatus.Pending
                    && s.Order.Status == OrderStatus.Unshipped)
                .OrderBy(s => s.CreatedAt)
                .ToListAsync();

            var visibleShipments = shipments
                .Where(s => IsWithinAvailableRoute(s, shipperLocation))
                .ToList();

            return ToShipmentPage(visibleShipments, page, pageSize);
        }

        public async Task<PagedResult<ShipperShipmentDto>> GetMyShipmentsAsync(int shipperId, int page, int pageSize)
        {
            var query = QueryShipments()
                .Where(s => s.ShipperId == shipperId
                    && (s.Status == ShipmentStatus.Accepted
                        || s.Status == ShipmentStatus.Shipped
                        || s.Status == ShipmentStatus.Arrived
                        || s.Status == ShipmentStatus.OnHold))
                .OrderByDescending(s => s.AssignedAt);

            return await ToShipmentPageAsync(query, page, pageSize);
        }

        public async Task<PagedResult<ShipperShipmentDto>> GetCompletedShipmentsAsync(int shipperId, int page, int pageSize, string? period = null)
        {
            var query = QueryShipments()
                .Where(s => s.ShipperId == shipperId && s.Status == ShipmentStatus.Delivered);

            var normalizedPeriod = period?.Trim().ToLowerInvariant();
            if (normalizedPeriod == "today" || normalizedPeriod == "month")
            {
                var (todayStartUtc, tomorrowStartUtc, monthStartUtc) = GetVietnamStatsUtcRange(DateTime.UtcNow);
                var fromUtc = normalizedPeriod == "today" ? todayStartUtc : monthStartUtc;
                query = query.Where(s => s.DeliveredAt != null
                    && s.DeliveredAt >= fromUtc
                    && s.DeliveredAt < tomorrowStartUtc);
            }

            return await ToShipmentPageAsync(query.OrderByDescending(s => s.DeliveredAt), page, pageSize);
        }

        public async Task<ShipperStatsDto> GetStatsAsync(int shipperId)
        {
            var now = DateTime.UtcNow;
            var (todayStartUtc, tomorrowStartUtc, monthStartUtc) = GetVietnamStatsUtcRange(now);

            var owned = QueryShipments().Where(s => s.ShipperId == shipperId);
            var completed = owned.Where(s => s.Status == ShipmentStatus.Delivered);
            var completedWithDeliveredAt = completed.Where(s => s.DeliveredAt != null);
            var completedToday = completedWithDeliveredAt.Where(s => s.DeliveredAt >= todayStartUtc && s.DeliveredAt < tomorrowStartUtc);
            var completedThisMonth = completedWithDeliveredAt.Where(s => s.DeliveredAt >= monthStartUtc && s.DeliveredAt < tomorrowStartUtc);
            var failedLogs = _db.ShipmentLogs
                .Where(l => l.Status == ShipmentStatus.OnHold && l.Shipment.ShipperId == shipperId);
            var failedToday = failedLogs
                .Where(l => l.CreatedAt >= todayStartUtc && l.CreatedAt < tomorrowStartUtc)
                .Select(l => l.ShipmentId)
                .Distinct();
            var failedThisMonth = failedLogs
                .Where(l => l.CreatedAt >= monthStartUtc && l.CreatedAt < tomorrowStartUtc)
                .Select(l => l.ShipmentId)
                .Distinct();
            var activeToday = owned.Where(s =>
                (s.Status == ShipmentStatus.Accepted
                    || s.Status == ShipmentStatus.Shipped
                    || s.Status == ShipmentStatus.Arrived
                    || s.Status == ShipmentStatus.OnHold)
                && ((s.AssignedAt != null && s.AssignedAt >= todayStartUtc && s.AssignedAt < tomorrowStartUtc)
                    || (s.AcceptedAt != null && s.AcceptedAt >= todayStartUtc && s.AcceptedAt < tomorrowStartUtc)
                    || (s.PickedUpAt != null && s.PickedUpAt >= todayStartUtc && s.PickedUpAt < tomorrowStartUtc)
                    || (s.ArrivedAt != null && s.ArrivedAt >= todayStartUtc && s.ArrivedAt < tomorrowStartUtc)));
            var totalAssigned = await owned.CountAsync();
            var completedCount = await completed.CountAsync();

            return new ShipperStatsDto
            {
                TodayCompleted = await completedToday.CountAsync(),
                TodayIncome = await completedToday.SumAsync(s => s.Order.ShippingFee),
                TodayFailed = await failedToday.CountAsync(),
                MonthCompleted = await completedThisMonth.CountAsync(),
                MonthIncome = await completedThisMonth.SumAsync(s => s.Order.ShippingFee),
                MonthFailed = await failedThisMonth.CountAsync(),
                AllCompleted = completedCount,
                AllIncome = await completed.SumAsync(s => s.Order.ShippingFee),
                AllFailed = await failedLogs.Select(l => l.ShipmentId).Distinct().CountAsync(),
                ActiveShipments = await activeToday.CountAsync(),
                PendingCodAmount = await activeToday
                    .Where(s => s.Order.Payment != null
                        && s.Order.Payment.Method == PaymentMethod.CashOnDelivery
                        && s.Order.Payment.Status != PaymentStatus.Completed)
                    .SumAsync(s => s.Order.TotalAmount),
                SuccessRate = totalAssigned == 0 ? 100 : Math.Round((decimal)completedCount / totalAssigned * 100, 1)
            };
        }

        private static (DateTime TodayStartUtc, DateTime TomorrowStartUtc, DateTime MonthStartUtc) GetVietnamStatsUtcRange(DateTime utcNow)
        {
            TimeZoneInfo vietnamTimeZone;
            try
            {
                vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
            }
            catch (TimeZoneNotFoundException)
            {
                vietnamTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
            }

            var localToday = TimeZoneInfo.ConvertTimeFromUtc(utcNow, vietnamTimeZone).Date;
            var localTomorrow = localToday.AddDays(1);
            var localMonthStart = new DateTime(localToday.Year, localToday.Month, 1);
            return (
                TimeZoneInfo.ConvertTimeToUtc(localToday, vietnamTimeZone),
                TimeZoneInfo.ConvertTimeToUtc(localTomorrow, vietnamTimeZone),
                TimeZoneInfo.ConvertTimeToUtc(localMonthStart, vietnamTimeZone)
            );
        }

        public async Task<bool> UpdateLocationAsync(int shipperId, ShipperLocationUpdateDto dto)
        {
            if (!IsValidCoordinate(dto.Latitude, dto.Longitude))
                throw new InvalidOperationException("Vị trí shipper không hợp lệ.");

            var shipper = await _db.Users.FindAsync(shipperId)
                ?? throw new KeyNotFoundException("Shipper không tồn tại.");
            if (shipper.Role != UserRole.Shipper && shipper.Role != UserRole.Admin)
                throw new UnauthorizedAccessException("Tài khoản không có quyền cập nhật vị trí shipper.");

            var location = await _db.ShipperLocations.FirstOrDefaultAsync(l => l.ShipperId == shipperId);
            if (location == null)
            {
                location = new ShipperLocation { ShipperId = shipperId };
                _db.ShipperLocations.Add(location);
            }

            location.Latitude = dto.Latitude;
            location.Longitude = dto.Longitude;
            location.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return true;
        }

        private static async Task<PagedResult<ShipperShipmentDto>> ToShipmentPageAsync(
            IQueryable<Shipment> query, int page, int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            var totalCount = await query.CountAsync();
            var items = await query
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            return new PagedResult<ShipperShipmentDto>
            {
                Items = items.Select(MapToDto).ToList(),
                TotalCount = totalCount,
                Page = page,
                PageSize = pageSize
            };
        }

        private static PagedResult<ShipperShipmentDto> ToShipmentPage(
            IReadOnlyList<Shipment> shipments,
            int page,
            int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            return new PagedResult<ShipperShipmentDto>
            {
                Items = shipments
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(MapToDto)
                    .ToList(),
                TotalCount = shipments.Count,
                Page = page,
                PageSize = pageSize
            };
        }

        private static PagedResult<ShipperShipmentDto> EmptyShipmentPage(int page, int pageSize)
        {
            page = Math.Max(1, page);
            pageSize = Math.Clamp(pageSize, 1, 50);

            return new PagedResult<ShipperShipmentDto>
            {
                Items = new List<ShipperShipmentDto>(),
                TotalCount = 0,
                Page = page,
                PageSize = pageSize
            };
        }

        private async Task<ShipperLocation?> GetFreshShipperLocationAsync(int shipperId)
        {
            var cutoff = DateTime.UtcNow.Subtract(ShipperLocationFreshness);
            return await _db.ShipperLocations
                .FirstOrDefaultAsync(l => l.ShipperId == shipperId && l.UpdatedAt >= cutoff);
        }

        private static bool IsWithinAvailableRoute(Shipment shipment, ShipperLocation location)
        {
            var pickupAddress = GetPickupAddress(shipment);
            var pickupCoordinate = pickupAddress == null
                ? FallbackShopCoordinate
                : ResolveAddressCoordinate(pickupAddress, allowCityFallback: true);
            var deliveryCoordinate = ResolveAddressCoordinate(shipment.Order.ShippingAddress, allowCityFallback: true);

            var shipperCoordinate = new GeoPoint(location.Latitude, location.Longitude);

            if (pickupCoordinate.HasValue)
            {
                return IsWithinAvailableRadius(shipperCoordinate, pickupCoordinate.Value);
            }

            if (deliveryCoordinate.HasValue)
            {
                return IsWithinAvailableRadius(shipperCoordinate, deliveryCoordinate.Value);
            }

            return true;
        }

        private static bool IsWithinAvailableRadius(GeoPoint shipperCoordinate, GeoPoint endpoint)
        {
            var distanceMeters = CalculateDistanceMeters(shipperCoordinate, endpoint);
            return distanceMeters.HasValue && distanceMeters.Value <= MaxAvailableEndpointDistanceMeters;
        }

        public async Task<ShipperShipmentDto> GetShipmentDetailAsync(int shipperId, int shipmentId)
        {
            var shipment = await QueryShipments()
                .FirstOrDefaultAsync(s => s.Id == shipmentId)
                ?? throw new KeyNotFoundException("Không tìm thấy vận đơn.");

            var isAvailable = shipment.ShipperId == null && shipment.Status == ShipmentStatus.Pending;
            var isMine = shipment.ShipperId == shipperId;

            if (!isAvailable && !isMine)
                throw new UnauthorizedAccessException("Bạn không có quyền xem vận đơn này.");

            if (isAvailable)
            {
                var shipperLocation = await GetFreshShipperLocationAsync(shipperId);
                if (shipperLocation == null || !IsWithinAvailableRoute(shipment, shipperLocation))
                    throw new UnauthorizedAccessException("Vận đơn này nằm ngoài bán kính nhận đơn của bạn.");
            }

            return MapToDto(shipment);
        }

        public async Task<ShipperShipmentDto> AcceptShipmentAsync(int shipperId, int shipmentId, string? note)
        {
            var shipment = await GetAssignableShipment(shipmentId);

            if (shipment.ShipperId != null)
                throw new InvalidOperationException("Vận đơn đã được shipper khác nhận.");

            if (shipment.Status != ShipmentStatus.Pending)
                throw new InvalidOperationException("Vận đơn không ở trạng thái chờ lấy hàng.");

            if (shipment.Order.Status != OrderStatus.Unshipped)
                throw new InvalidOperationException("Đơn hàng chưa được seller xác nhận.");

            var shipperLocation = await GetFreshShipperLocationAsync(shipperId);
            if (shipperLocation == null || !IsWithinAvailableRoute(shipment, shipperLocation))
                throw new UnauthorizedAccessException("Bạn chỉ có thể nhận đơn có điểm lấy hàng trong bán kính 10 km.");

            var shipper = await _db.Users.FindAsync(shipperId)
                ?? throw new KeyNotFoundException("Shipper không tồn tại.");

            var now = DateTime.UtcNow;
            shipment.ShipperId = shipperId;
            shipment.Status = ShipmentStatus.Accepted;
            shipment.AssignedAt = now;
            shipment.AcceptedAt = now;

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipmentId,
                Status = ShipmentStatus.Accepted,
                Note = note ?? $"Shipper {shipper.FullName} đã nhận đơn và bắt đầu giao hàng."
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = shipment.OrderId,
                Status = OrderStatus.Unshipped,
                Note = $"Shipper {shipper.FullName} đã nhận đơn và đang giao hàng."
            });

            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(
                shipment.Order.BuyerId,
                $"Đơn #{shipment.Order.OrderNumber} đang được shipper {shipper.FullName} giao đến bạn.",
                NotificationAction.OrderAccepted,
                shipment.OrderId);

            var sellerIds = shipment.Order.OrderItems.Select(oi => oi.SellerId).Distinct();
            foreach (var sellerId in sellerIds)
            {
                await _notif.CreateNotificationAsync(
                    sellerId,
                    $"Đơn #{shipment.Order.OrderNumber} đã được shipper {shipper.FullName} nhận và đang giao cho khách.",
                    NotificationAction.OrderAccepted,
                    shipment.OrderId);
            }

            await BroadcastShipmentChangedAsync(shipment, "ShipmentAccepted");

            return MapToDto(shipment);
        }

        public async Task<ShipperShipmentDto> ConfirmPickupAsync(int shipperId, int shipmentId, string? note)
        {
            var shipment = await GetOwnedShipment(shipperId, shipmentId);

            if (shipment.Status != ShipmentStatus.Accepted)
                throw new InvalidOperationException("Vận đơn không ở trạng thái chờ lấy hàng.");

            if (!ShipmentTiming.CanConfirmPickup(shipment.AcceptedAt))
                throw new InvalidOperationException("Chưa đủ thời gian chờ. Vui lòng đợi thêm.");

            var now = DateTime.UtcNow;
            shipment.Status = ShipmentStatus.Shipped;
            shipment.PickedUpAt = now;
            shipment.Order.Status = OrderStatus.Shipped;

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipmentId,
                Status = ShipmentStatus.Shipped,
                Note = note ?? "Đã lấy hàng tại seller."
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = shipment.OrderId,
                Status = OrderStatus.Shipped,
                Note = "Shipper đã lấy hàng, đang giao đến người mua."
            });

            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(
                shipment.Order.BuyerId,
                $"Đơn #{shipment.Order.OrderNumber} đang được giao đến bạn.",
                NotificationAction.General,
                shipment.OrderId);

            await BroadcastShipmentChangedAsync(shipment, "ShipmentPickedUp");

            return MapToDto(shipment);
        }

        public async Task<ShipperShipmentDto> ConfirmArrivalAsync(int shipperId, int shipmentId, string? note)
        {
            var shipment = await GetOwnedShipment(shipperId, shipmentId);

            if (shipment.Status != ShipmentStatus.Shipped)
                throw new InvalidOperationException("Vận đơn chưa ở trạng thái chờ giao hàng.");

            if (!ShipmentTiming.CanConfirmArrival(shipment.PickedUpAt))
                throw new InvalidOperationException("Chưa đủ thời gian di chuyển. Vui lòng đợi thêm.");

            var now = DateTime.UtcNow;
            shipment.Status = ShipmentStatus.Arrived;
            shipment.ArrivedAt = now;

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipmentId,
                Status = ShipmentStatus.Arrived,
                Note = note ?? "Đã đến nơi giao hàng."
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = shipment.OrderId,
                Status = OrderStatus.Shipped,
                Note = "Shipper đã đến nơi giao hàng."
            });

            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(
                shipment.Order.BuyerId,
                $"Đơn hàng #{shipment.Order.OrderNumber} đã đến nơi. Vui lòng xác nhận đã nhận hàng.",
                NotificationAction.OrderArrived,
                shipment.OrderId);

            await BroadcastShipmentChangedAsync(shipment, "ShipmentArrived");

            return MapToDto(shipment);
        }

        public async Task<ShipperShipmentDto> ConfirmCashReceivedAsync(int shipperId, int shipmentId, string? note)
        {
            var shipment = await GetOwnedShipment(shipperId, shipmentId);

            if (shipment.Status != ShipmentStatus.Arrived)
                throw new InvalidOperationException("Đơn hàng chưa đến nơi.");

            if (shipment.BuyerConfirmedReceiptAt == null)
                throw new InvalidOperationException("Người mua chưa xác nhận nhận hàng.");

            var payment = shipment.Order.Payment;
            if (payment == null
                || (payment.Method != PaymentMethod.CashOnDelivery && payment.Method != PaymentMethod.CreditCard))
                throw new InvalidOperationException("Đơn hàng không thanh toán tiền mặt tại cửa.");

            await CompleteShipmentAsync(shipment, shipperId, note ?? "Shipper đã nhận tiền mặt.");

            return MapToDto(shipment);
        }

        public async Task<ShipperShipmentDto> ConfirmTransferReceivedAsync(int shipperId, int shipmentId, string? note)
        {
            var shipment = await GetOwnedShipment(shipperId, shipmentId);

            if (shipment.Status != ShipmentStatus.Arrived)
                throw new InvalidOperationException("Đơn hàng chưa đến nơi.");

            if (shipment.TransferReportedAt == null)
                throw new InvalidOperationException("Người mua chưa báo chuyển khoản.");

            await CompleteShipmentAsync(shipment, shipperId, note ?? "Shipper đã xác nhận nhận chuyển khoản.");
            return MapToDto(shipment);
        }

        public async Task<bool> RequestPaymentAsync(int shipperId, int shipmentId)
        {
            var shipment = await GetOwnedShipment(shipperId, shipmentId);

            if (shipment.Status != ShipmentStatus.Arrived)
                throw new InvalidOperationException("Đơn hàng chưa đến nơi.");

            await _notif.CreateNotificationAsync(
                shipment.Order.BuyerId,
                $"Đơn hàng #{shipment.Order.OrderNumber} đã đến nơi. Vui lòng xác nhận nhận hàng và thanh toán.",
                NotificationAction.OrderArrived,
                shipment.OrderId);

            return true;
        }

        public async Task<ShipperShipmentDto> ConfirmDeliveredAsync(int shipperId, int shipmentId, string? note)
        {
            var shipment = await GetOwnedShipment(shipperId, shipmentId);

            if (shipment.Status != ShipmentStatus.Arrived)
                throw new InvalidOperationException("Chỉ có thể hoàn tất khi đơn đang được giao.");

            await CompleteShipmentAsync(shipment, shipperId, note ?? "Giao hàng thành công.");

            return MapToDto(shipment);
        }

        public async Task<ShipperShipmentDto> ReportDeliveryFailedAsync(
            int shipperId,
            int shipmentId,
            string? reason,
            string? note)
        {
            var shipment = await GetOwnedShipment(shipperId, shipmentId);

            if (shipment.Status != ShipmentStatus.Shipped && shipment.Status != ShipmentStatus.Arrived)
                throw new InvalidOperationException("Chỉ báo giao thất bại khi đơn đang đi giao hoặc đã đến nơi.");

            var failureReason = string.IsNullOrWhiteSpace(reason) ? "Không giao được" : reason.Trim();
            shipment.Status = ShipmentStatus.OnHold;

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipment.Id,
                Status = ShipmentStatus.OnHold,
                Note = string.IsNullOrWhiteSpace(note)
                    ? $"Giao thất bại: {failureReason}"
                    : $"Giao thất bại: {failureReason}. Ghi chú: {note}"
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = shipment.OrderId,
                Status = shipment.Order.Status,
                Note = $"Shipper báo giao thất bại: {failureReason}"
            });

            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(
                shipment.Order.BuyerId,
                $"Đơn #{shipment.Order.OrderNumber} giao chưa thành công: {failureReason}.",
                NotificationAction.General,
                shipment.OrderId);

            await BroadcastShipmentChangedAsync(shipment, "ShipmentDeliveryFailed");

            return MapToDto(shipment);
        }

        private async Task CompleteShipmentAsync(Shipment shipment, int shipperId, string note)
        {
            if (shipment.Status == ShipmentStatus.Delivered || shipment.Order.Status == OrderStatus.Complete)
                throw new InvalidOperationException("Đơn hàng đã hoàn tất trước đó.");

            if (shipment.Order.Payment == null)
                throw new InvalidOperationException("Đơn hàng chưa có thông tin thanh toán.");

            if (shipment.Order.Payment.Method == PaymentMethod.CashOnDelivery
                || shipment.Order.Payment.Method == PaymentMethod.CreditCard)
            {
                shipment.Order.Payment.Status = PaymentStatus.Completed;
                shipment.Order.Payment.UpdatedAt = DateTime.UtcNow;
            }
            else if (shipment.Order.Payment.Status != PaymentStatus.Completed)
            {
                shipment.Order.Payment.Status = PaymentStatus.Completed;
                shipment.Order.Payment.UpdatedAt = DateTime.UtcNow;
            }

            shipment.Status = ShipmentStatus.Delivered;
            shipment.DeliveredAt = DateTime.UtcNow;
            shipment.Order.Status = OrderStatus.Complete;

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipment.Id,
                Status = ShipmentStatus.Delivered,
                Note = note
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = shipment.OrderId,
                Status = OrderStatus.Complete,
                Note = note
            });

            await CreditShipperBalanceAsync(shipperId, shipment.Order.ShippingFee);
            await CreditSellerPayoutsAsync(shipment.Order);

            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(
                shipment.Order.BuyerId,
                $"Đơn hàng #{shipment.Order.OrderNumber} đã giao thành công!",
                NotificationAction.OrderDelivered,
                shipment.OrderId);

            await BroadcastShipmentChangedAsync(shipment, "ShipmentDelivered");
        }

        private async Task BroadcastShipmentChangedAsync(Shipment shipment, string eventName)
        {
            var groups = new List<string>
            {
                DeliveryHub.ShipperAvailableGroup,
                DeliveryHub.UserGroup(shipment.Order.BuyerId)
            };

            if (shipment.ShipperId.HasValue)
            {
                groups.Add(DeliveryHub.UserGroup(shipment.ShipperId.Value));
            }

            groups.AddRange(shipment.Order.OrderItems
                .Select(oi => oi.SellerId)
                .Distinct()
                .Select(DeliveryHub.UserGroup));

            var payload = new
            {
                shipmentId = shipment.Id,
                orderId = shipment.OrderId,
                orderNumber = shipment.Order.OrderNumber,
                shipmentStatus = shipment.Status.ToString(),
                orderStatus = shipment.Order.Status.ToString(),
                paymentStatus = shipment.Order.Payment?.Status.ToString(),
                buyerId = shipment.Order.BuyerId,
                shipperId = shipment.ShipperId
            };

            var targetGroups = groups.Distinct().ToArray();
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync(eventName, payload);
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync("ShipmentUpdated", payload);
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync("OrderUpdated", payload);
        }

        private async Task CreditShipperBalanceAsync(int shipperId, decimal amount)
        {
            var account = await _db.BankAccounts.FirstOrDefaultAsync(b => b.UserId == shipperId);
            if (account != null)
            {
                account.Balance += amount;
            }
        }

        private async Task CreditSellerPayoutsAsync(Order order)
        {
            var sellerPayouts = order.OrderItems
                .GroupBy(oi => oi.SellerId)
                .Select(g => new { SellerId = g.Key, Amount = g.Sum(oi => oi.UnitPrice * oi.Quantity) })
                .ToList();

            foreach (var payout in sellerPayouts)
            {
                var sellerAccount = await _db.BankAccounts.FirstOrDefaultAsync(b => b.UserId == payout.SellerId);
                if (sellerAccount != null)
                {
                    sellerAccount.Balance += payout.Amount;
                }
            }
        }

        private async Task<Shipment> GetAssignableShipment(int shipmentId) =>
            await QueryShipments().FirstOrDefaultAsync(s => s.Id == shipmentId)
            ?? throw new KeyNotFoundException("Không tìm thấy vận đơn.");

        private async Task<Shipment> GetOwnedShipment(int shipperId, int shipmentId)
        {
            var shipment = await QueryShipments().FirstOrDefaultAsync(s => s.Id == shipmentId)
                ?? throw new KeyNotFoundException("Không tìm thấy vận đơn.");

            if (shipment.ShipperId != shipperId)
                throw new UnauthorizedAccessException("Bạn không phải shipper của vận đơn này.");

            return shipment;
        }

        private IQueryable<Shipment> QueryShipments() =>
            _db.Shipments
                .Include(s => s.Order).ThenInclude(o => o.Buyer)
                .Include(s => s.Order).ThenInclude(o => o.ShippingAddress)
                .Include(s => s.Order).ThenInclude(o => o.Payment)
                .Include(s => s.Order).ThenInclude(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(s => s.Order).ThenInclude(o => o.OrderItems).ThenInclude(oi => oi.Seller).ThenInclude(seller => seller.Addresses)
                .Include(s => s.Shipper);

        private static string FormatAddress(UserAddress? address)
        {
            if (address == null) return string.Empty;

            return string.Join(", ",
                new[] { address.StreetAddress, address.State, address.City, address.Country }
                    .Where(part => !string.IsNullOrWhiteSpace(part)));
        }

        private static UserAddress? GetPickupAddress(Shipment shipment)
        {
            var seller = shipment.Order.OrderItems
                .OrderBy(oi => oi.Id)
                .Select(oi => oi.Seller)
                .FirstOrDefault(seller => seller != null);

            return seller?.Addresses
                .OrderByDescending(address => address.IsDefault)
                .ThenBy(address => address.Id)
                .FirstOrDefault();
        }

        private static string BuildPickupAddress(Shipment shipment)
        {
            var sellerAddress = GetPickupAddress(shipment);
            var formattedAddress = FormatAddress(sellerAddress);

            return string.IsNullOrWhiteSpace(formattedAddress)
                ? FallbackShopAddress
                : formattedAddress;
        }

        private static GeoPoint? ResolveAddressCoordinate(UserAddress? address, bool allowCityFallback = true)
        {
            if (address == null) return null;

            return ResolveAddressCoordinate(
                address.StreetAddress,
                address.State,
                address.City,
                address.Country,
                allowCityFallback);
        }

        private static GeoPoint? ResolveAddressCoordinate(
            string streetAddress,
            string state,
            string city,
            string country,
            bool allowCityFallback = true)
        {
            var combined = NormalizeForSearch($"{streetAddress} {state} {city} {country}");
            var compact = combined.Replace(".", string.Empty).Replace(" ", string.Empty);

            var isHoChiMinh = combined.Contains("ho chi minh")
                || combined.Contains("tp ho chi minh")
                || combined.Contains("hcm")
                || combined.Contains("sai gon")
                || combined.Contains("saigon");
            if (isHoChiMinh)
            {
                var isDistrict1 = HasDistrict(combined, compact, 1);
                if (isDistrict1 && combined.Contains("le loi"))
                {
                    return CoordinateOnLeLoiDistrict1(ReadLeadingNumber(streetAddress));
                }

                if (isDistrict1) return new GeoPoint(10.7758, 106.7019);
                if (HasDistrict(combined, compact, 2)) return new GeoPoint(10.7873, 106.7498);
                if (HasDistrict(combined, compact, 3)) return new GeoPoint(10.7840, 106.6848);
                if (HasDistrict(combined, compact, 4)) return new GeoPoint(10.7578, 106.7050);
                if (HasDistrict(combined, compact, 5)) return new GeoPoint(10.7540, 106.6634);
                if (HasDistrict(combined, compact, 6)) return new GeoPoint(10.7460, 106.6358);
                if (HasDistrict(combined, compact, 7)) return new GeoPoint(10.7325, 106.7219);
                if (HasDistrict(combined, compact, 8)) return new GeoPoint(10.7247, 106.6286);
                if (HasDistrict(combined, compact, 9)) return new GeoPoint(10.8428, 106.8287);
                if (HasDistrict(combined, compact, 10)) return new GeoPoint(10.7731, 106.6679);
                if (HasDistrict(combined, compact, 11)) return new GeoPoint(10.7629, 106.6501);
                if (HasDistrict(combined, compact, 12)) return new GeoPoint(10.8672, 106.6413);
                if (ContainsAny(combined, "binh thanh")) return new GeoPoint(10.8106, 106.7091);
                if (ContainsAny(combined, "phu nhuan")) return new GeoPoint(10.7993, 106.6805);
                if (ContainsAny(combined, "tan binh")) return new GeoPoint(10.8016, 106.6522);
                if (ContainsAny(combined, "tan phu")) return new GeoPoint(10.7916, 106.6273);
                if (ContainsAny(combined, "go vap", "govap")) return new GeoPoint(10.8387, 106.6653);
                if (ContainsAny(combined, "binh tan")) return new GeoPoint(10.7653, 106.6038);
                if (ContainsAny(combined, "thu duc")) return new GeoPoint(10.8494, 106.7537);
                if (ContainsAny(combined, "nha be", "nhabe")) return new GeoPoint(10.6953, 106.7405);
                if (ContainsAny(combined, "binh chanh", "binhchanh")) return new GeoPoint(10.6874, 106.5939);
                if (ContainsAny(combined, "hoc mon", "hocmon")) return new GeoPoint(10.8830, 106.5866);
                if (ContainsAny(combined, "cu chi", "cuchi")) return new GeoPoint(10.9739, 106.4933);
                if (ContainsAny(combined, "can gio", "cangio")) return new GeoPoint(10.4112, 106.9547);

                return allowCityFallback ? new GeoPoint(10.7769, 106.7009) : null;
            }

            if (combined.Contains("ha noi") || combined.Contains("hanoi"))
            {
                if (combined.Contains("hoan kiem")) return new GeoPoint(21.0287, 105.8521);
                if (combined.Contains("ba dinh")) return new GeoPoint(21.0367, 105.8342);
                if (combined.Contains("dong da")) return new GeoPoint(21.0181, 105.8293);
                if (combined.Contains("cau giay")) return new GeoPoint(21.0362, 105.7906);
                if (combined.Contains("hai ba trung")) return new GeoPoint(21.0091, 105.8607);
                if (combined.Contains("thanh xuan")) return new GeoPoint(20.9935, 105.8056);
                if (combined.Contains("ha dong")) return new GeoPoint(20.9714, 105.7788);
                if (combined.Contains("long bien")) return new GeoPoint(21.0479, 105.8836);
                if (combined.Contains("tay ho")) return new GeoPoint(21.0684, 105.8230);
                if (combined.Contains("nam tu liem")) return new GeoPoint(21.0122, 105.7608);
                if (combined.Contains("bac tu liem")) return new GeoPoint(21.0718, 105.7747);

                return allowCityFallback ? new GeoPoint(21.0278, 105.8342) : null;
            }

            if (combined.Contains("da nang") || combined.Contains("danang"))
            {
                if (combined.Contains("hai chau")) return new GeoPoint(16.0678, 108.2208);
                if (combined.Contains("son tra")) return new GeoPoint(16.1065, 108.2529);
                if (combined.Contains("thanh khe")) return new GeoPoint(16.0704, 108.1906);
                if (combined.Contains("ngu hanh son")) return new GeoPoint(16.0168, 108.2530);
                if (combined.Contains("cam le")) return new GeoPoint(16.0155, 108.2038);
                if (combined.Contains("lien chieu")) return new GeoPoint(16.0718, 108.1507);

                return allowCityFallback ? new GeoPoint(16.0471, 108.2068) : null;
            }

            return null;
        }

        private static bool HasDistrict(string combined, string compact, int districtNumber)
        {
            var number = districtNumber.ToString(CultureInfo.InvariantCulture);
            return Regex.IsMatch(combined, $@"(^|[^a-z0-9])(quan|q|district)\.?\s*{number}([^0-9]|$)")
                || Regex.IsMatch(compact, $@"(quan|q|district){number}([^0-9]|$)");
        }

        private static bool ContainsAny(string value, params string[] tokens) =>
            tokens.Any(value.Contains);

        private static GeoPoint CoordinateOnLeLoiDistrict1(int? houseNumber)
        {
            var house = Math.Clamp(houseNumber ?? 60, 1, 120);
            var progress = (house - 1) / 119d;
            var latitude = 10.77295 + 0.00225 * progress;
            var longitude = 106.69870 + 0.00495 * progress;

            return new GeoPoint(Math.Round(latitude, 6), Math.Round(longitude, 6));
        }

        private static int? ReadLeadingNumber(string value)
        {
            var digits = new string((value ?? string.Empty).Trim().TakeWhile(char.IsDigit).ToArray());
            return int.TryParse(digits, out var number) ? number : null;
        }

        private static string NormalizeForSearch(string value)
        {
            if (string.IsNullOrWhiteSpace(value)) return string.Empty;

            var normalized = value.Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);
            foreach (var character in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(character) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(character);
                }
            }

            return builder.ToString().Normalize(NormalizationForm.FormC).ToLowerInvariant();
        }

        private static int? CalculateDistanceMeters(GeoPoint? from, GeoPoint? to)
        {
            if (from == null || to == null) return null;

            const double earthRadiusKm = 6371.0088;
            var latitudeDelta = DegreesToRadians(to.Value.Latitude - from.Value.Latitude);
            var longitudeDelta = DegreesToRadians(to.Value.Longitude - from.Value.Longitude);
            var fromLatitude = DegreesToRadians(from.Value.Latitude);
            var toLatitude = DegreesToRadians(to.Value.Latitude);

            var haversine = Math.Sin(latitudeDelta / 2) * Math.Sin(latitudeDelta / 2)
                + Math.Cos(fromLatitude) * Math.Cos(toLatitude)
                * Math.Sin(longitudeDelta / 2) * Math.Sin(longitudeDelta / 2);
            var distance = 2 * earthRadiusKm * Math.Asin(Math.Min(1, Math.Sqrt(haversine)));

            return (int)Math.Round(distance * 1000, MidpointRounding.AwayFromZero);
        }

        private static double DegreesToRadians(double degrees) => degrees * Math.PI / 180d;

        private static bool IsValidCoordinate(double latitude, double longitude) =>
            double.IsFinite(latitude)
            && double.IsFinite(longitude)
            && Math.Abs(latitude) <= 90
            && Math.Abs(longitude) <= 180;

        private static ShipperShipmentDto MapToDto(Shipment s)
        {
            var addr = s.Order.ShippingAddress;
            var pickupAddress = GetPickupAddress(s);
            var pickupAddressText = BuildPickupAddress(s);
            var deliveryAddressText = FormatAddress(addr);
            var pickupCoordinate = ResolveAddressCoordinate(pickupAddress) ?? FallbackShopCoordinate;
            var deliveryCoordinate = ResolveAddressCoordinate(addr);
            var distanceMeters = CalculateDistanceMeters(pickupCoordinate, deliveryCoordinate);
            var payment = s.Order.Payment;
            var isCashCod = payment != null
                && (payment.Method == PaymentMethod.CashOnDelivery || payment.Method == PaymentMethod.CreditCard)
                && payment.Status == PaymentStatus.Unpaid
                && s.BuyerConfirmedReceiptAt != null;
            var awaitingTransfer = s.TransferReportedAt != null && s.Status == ShipmentStatus.Arrived;

            return new ShipperShipmentDto
            {
                ShipmentId = s.Id,
                OrderId = s.OrderId,
                OrderNumber = s.Order.OrderNumber,
                OrderStatus = s.Order.Status.ToString(),
                ShipmentStatus = s.Status.ToString(),
                TotalAmount = s.Order.TotalAmount,
                ShippingFee = s.Order.ShippingFee,
                PaymentMethod = payment?.Method.ToString(),
                PaymentStatus = payment?.Status.ToString(),
                TrackingNumber = s.TrackingNumber,
                ShipmentMethod = s.ShipmentMethod,
                ShipmentDate = s.ShipmentDate,
                EstimatedArrival = s.EstimatedArrival,
                AssignedAt = s.AssignedAt,
                DeliveredAt = s.DeliveredAt,
                BuyerName = s.Order.Buyer.FullName,
                BuyerPhone = s.Order.Buyer.PhoneNumber ?? "",
                DeliveryAddress = deliveryAddressText,
                PickupAddress = pickupAddressText,
                DeliveryLatitude = deliveryCoordinate?.Latitude,
                DeliveryLongitude = deliveryCoordinate?.Longitude,
                PickupLatitude = pickupCoordinate.Latitude,
                PickupLongitude = pickupCoordinate.Longitude,
                DistanceMeters = distanceMeters,
                DistanceKm = distanceMeters.HasValue
                    ? Math.Round(distanceMeters.Value / 1000m, 3)
                    : 0m,
                ShipperName = s.Shipper?.FullName,
                ShipperId = s.ShipperId,
                CanConfirmPickup = s.Status == ShipmentStatus.Accepted && ShipmentTiming.CanConfirmPickup(s.AcceptedAt),
                CanConfirmArrival = s.Status == ShipmentStatus.Shipped && ShipmentTiming.CanConfirmArrival(s.PickedUpAt),
                PickupCountdownSeconds = s.Status == ShipmentStatus.Accepted
                    ? ShipmentTiming.CountdownSeconds(s.AcceptedAt)
                    : 0,
                ArrivalCountdownSeconds = s.Status == ShipmentStatus.Shipped
                    ? ShipmentTiming.ArrivalCountdownSeconds(s.PickedUpAt)
                    : 0,
                BuyerConfirmedReceipt = s.BuyerConfirmedReceiptAt != null,
                AwaitingCash = isCashCod,
                AwaitingTransferConfirm = awaitingTransfer,
                OrderItems = s.Order.OrderItems.Select(oi => new ShipperOrderItemDto
                {
                    ProductId = oi.ProductId,
                    ProductName = oi.Product?.Name ?? "Sản phẩm",
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice
                }).ToList()
            };
        }
    }
}
