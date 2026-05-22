using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Shipper;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class ShipperService : IShipperService
    {
        private readonly AppDbContext _db;
        private readonly INotificationService _notif;

        public ShipperService(AppDbContext db, INotificationService notif)
        {
            _db = db;
            _notif = notif;
        }

        public async Task<PagedResult<ShipperShipmentDto>> GetAvailableShipmentsAsync(int page, int pageSize)
        {
            var query = QueryShipments()
                .Where(s => s.ShipperId == null
                    && s.Status == ShipmentStatus.Pending
                    && s.Order.Status == OrderStatus.Unshipped)
                .OrderBy(s => s.CreatedAt);

            return await ToShipmentPageAsync(query, page, pageSize);
        }

        public async Task<PagedResult<ShipperShipmentDto>> GetMyShipmentsAsync(int shipperId, int page, int pageSize)
        {
            var query = QueryShipments()
                .Where(s => s.ShipperId == shipperId
                    && (s.Status == ShipmentStatus.Accepted
                        || s.Status == ShipmentStatus.Shipped
                        || s.Status == ShipmentStatus.Arrived))
                .OrderByDescending(s => s.AssignedAt);

            return await ToShipmentPageAsync(query, page, pageSize);
        }

        public async Task<PagedResult<ShipperShipmentDto>> GetCompletedShipmentsAsync(int shipperId, int page, int pageSize)
        {
            var query = QueryShipments()
                .Where(s => s.ShipperId == shipperId && s.Status == ShipmentStatus.Delivered)
                .OrderByDescending(s => s.DeliveredAt);

            return await ToShipmentPageAsync(query, page, pageSize);
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

        public async Task<ShipperShipmentDto> GetShipmentDetailAsync(int shipperId, int shipmentId)
        {
            var shipment = await QueryShipments()
                .FirstOrDefaultAsync(s => s.Id == shipmentId)
                ?? throw new KeyNotFoundException("Không tìm thấy vận đơn.");

            var isAvailable = shipment.ShipperId == null && shipment.Status == ShipmentStatus.Pending;
            var isMine = shipment.ShipperId == shipperId;

            if (!isAvailable && !isMine)
                throw new UnauthorizedAccessException("Bạn không có quyền xem vận đơn này.");

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
                Note = note ?? $"Shipper {shipper.FullName} đã nhận đơn."
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = shipment.OrderId,
                Status = OrderStatus.Unshipped,
                Note = $"Shipper {shipper.FullName} đã nhận đơn, đang đến lấy hàng."
            });

            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(
                shipment.Order.BuyerId,
                $"Đơn #{shipment.Order.OrderNumber} đã có shipper {shipper.FullName} nhận giao.",
                NotificationAction.OrderAccepted,
                shipment.OrderId);

            var sellerIds = shipment.Order.OrderItems.Select(oi => oi.SellerId).Distinct();
            foreach (var sellerId in sellerIds)
            {
                await _notif.CreateNotificationAsync(
                    sellerId,
                    $"Shipper đã nhận đơn #{shipment.Order.OrderNumber}, đang đến lấy hàng.",
                    NotificationAction.OrderAccepted,
                    shipment.OrderId);
            }

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
            if (payment == null || payment.Method != PaymentMethod.CreditCard)
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
                throw new InvalidOperationException("Chỉ có thể hoàn tất khi đã đến nơi.");

            var payment = shipment.Order.Payment;
            var isPrepaid = payment != null && payment.Status == PaymentStatus.Completed;

            if (!isPrepaid)
                throw new InvalidOperationException("Đơn chưa thanh toán đủ. Vui lòng chờ xác nhận thanh toán.");

            if (shipment.BuyerConfirmedReceiptAt == null)
                throw new InvalidOperationException("Người mua chưa xác nhận nhận hàng.");

            await CompleteShipmentAsync(shipment, shipperId, note ?? "Giao hàng thành công.");

            return MapToDto(shipment);
        }

        private async Task CompleteShipmentAsync(Shipment shipment, int shipperId, string note)
        {
            if (shipment.Status == ShipmentStatus.Delivered || shipment.Order.Status == OrderStatus.Complete)
                throw new InvalidOperationException("Đơn hàng đã hoàn tất trước đó.");

            if (shipment.Order.Payment == null)
                throw new InvalidOperationException("Đơn hàng chưa có thông tin thanh toán.");

            if (shipment.Order.Payment.Method == PaymentMethod.CreditCard)
            {
                shipment.Order.Payment.Status = PaymentStatus.Completed;
                shipment.Order.Payment.UpdatedAt = DateTime.UtcNow;
            }
            else if (shipment.Order.Payment.Status != PaymentStatus.Completed)
            {
                throw new InvalidOperationException("Đơn chưa thanh toán đủ. Vui lòng chờ xác nhận thanh toán.");
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
                .Include(s => s.Shipper);

        private static ShipperShipmentDto MapToDto(Shipment s)
        {
            var addr = s.Order.ShippingAddress;
            var payment = s.Order.Payment;
            var isCashCod = payment != null
                && payment.Method == PaymentMethod.CreditCard
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
                BuyerName = s.Order.Buyer.FullName,
                BuyerPhone = s.Order.Buyer.PhoneNumber ?? "",
                DeliveryAddress = $"{addr.StreetAddress}, {addr.City}, {addr.State}, {addr.Country}",
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
