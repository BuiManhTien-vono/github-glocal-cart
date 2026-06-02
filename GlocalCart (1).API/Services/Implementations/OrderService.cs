using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.SignalR;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Orders;
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
    public class OrderService : IOrderService
    {
        private const int MaxAvailableEndpointDistanceMeters = 10_000;
        private static readonly TimeSpan ShipperLocationFreshness = TimeSpan.FromMinutes(15);
        private static readonly GeoPoint FallbackShopCoordinate = new(10.7743, 106.7017);
        private readonly record struct GeoPoint(double Latitude, double Longitude);
        private readonly record struct OrderLine(Product Product, int Quantity, decimal UnitPrice);

        private readonly AppDbContext _db;
        private readonly INotificationService _notif;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly IHubContext<DeliveryHub> _deliveryHub;

        public OrderService(
            AppDbContext db,
            INotificationService notif,
            IServiceScopeFactory scopeFactory,
            IHubContext<DeliveryHub> deliveryHub)
        {
            _db = db;
            _notif = notif;
            _scopeFactory = scopeFactory;
            _deliveryHub = deliveryHub;
        }

        public async Task<OrderResponseDto> CreateOrderAsync(int buyerId, CreateOrderDto dto)
        {
            await using var transaction = await _db.Database.BeginTransactionAsync();

            var requestedItems = dto.Items?
                .Where(i => i.ProductId > 0 && i.Quantity > 0)
                .GroupBy(i => i.ProductId)
                .Select(g => new CreateOrderItemDto
                {
                    ProductId = g.Key,
                    Quantity = g.Sum(i => i.Quantity)
                })
                .ToList();

            var cartItemsToRemove = new List<CartItem>();
            List<OrderLine> orderLines;

            if (requestedItems?.Any() == true)
            {
                var productIds = requestedItems.Select(i => i.ProductId).ToList();
                var products = await _db.Products
                    .Where(p => productIds.Contains(p.Id))
                    .ToListAsync();

                if (products.Count != productIds.Count)
                    throw new KeyNotFoundException("Mot so san pham khong ton tai.");

                var quantityByProductId = requestedItems.ToDictionary(i => i.ProductId, i => i.Quantity);
                orderLines = products
                    .Select(p => new OrderLine(p, quantityByProductId[p.Id], p.Price))
                    .ToList();

                if (!dto.IsBuyNow)
                {
                    cartItemsToRemove = await _db.CartItems
                        .Where(ci => ci.UserId == buyerId && productIds.Contains(ci.ProductId))
                        .ToListAsync();
                }
            }
            else
            {
                var cartItems = await _db.CartItems
                    .Include(ci => ci.Product)
                    .Where(ci => ci.UserId == buyerId)
                    .ToListAsync();

                if (!cartItems.Any())
                    throw new InvalidOperationException("Gio hang trong.");

                orderLines = cartItems
                    .Select(ci => new OrderLine(ci.Product, ci.Quantity, ci.PriceSnapshot))
                    .ToList();
                cartItemsToRemove = cartItems;
            }

            var sellerIdsInOrder = orderLines.Select(line => line.Product.SellerId).Distinct().ToList();

            var address = await _db.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == dto.ShippingAddressId && a.UserId == buyerId)
                ?? throw new KeyNotFoundException("Dia chi giao hang khong ton tai.");

            foreach (var line in orderLines)
            {
                if (line.Quantity > line.Product.AvailableItemCount)
                    throw new InvalidOperationException($"San pham '{line.Product.Name}' chi con {line.Product.AvailableItemCount} don vi.");
                if (!line.Product.IsActive || line.Product.IsLocked)
                    throw new InvalidOperationException($"San pham '{line.Product.Name}' khong kha dung.");
            }

            var order = new Order
            {
                OrderNumber = "GC-" + DateTime.UtcNow.Ticks.ToString()[^10..],
                BuyerId = buyerId,
                ShippingAddressId = dto.ShippingAddressId,
                Status = OrderStatus.Pending,
                ShippingFee = 30000m,
                TotalAmount = orderLines.Sum(line => line.UnitPrice * line.Quantity) + 30000m,
                Note = dto.Note
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            foreach (var line in orderLines)
            {
                _db.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = line.Product.Id,
                    SellerId = line.Product.SellerId,
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice
                });

                line.Product.AvailableItemCount -= line.Quantity;
            }

            var isBankTransfer = dto.PaymentMethod == PaymentMethod.ElectronicBankTransfer;
            _db.Payments.Add(new Payment
            {
                OrderId = order.Id,
                Method = dto.PaymentMethod,
                Status = PaymentStatus.Unpaid,
                Amount = order.TotalAmount,
                TransactionRef = isBankTransfer ? null : null
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = order.Id,
                Status = OrderStatus.Pending,
                Note = isBankTransfer
                    ? "Don hang duoc tao. Cho thanh toan chuyen khoan."
                    : "Don hang duoc tao (COD). Cho seller xu ly."
            });

            if (cartItemsToRemove.Any())
                _db.CartItems.RemoveRange(cartItemsToRemove);

            await _db.SaveChangesAsync();

            await transaction.CommitAsync();

            foreach (var sellerId in sellerIdsInOrder)
            {
                string notifMessage = isBankTransfer
                    ? $"Ban co don hang moi #{order.OrderNumber}. Nguoi mua dang tien hanh thanh toan chuyen khoan."
                    : $"Yeu cau xac nhan: Ban co don hang moi #{order.OrderNumber} (COD), vui long xac nhan de chuan bi hang.";

                await _notif.CreateNotificationAsync(sellerId, notifMessage);
            }

            await BroadcastOrderUpdatedAsync(order, "OrderCreated");

            return await GetOrderByIdAsync(buyerId, order.Id);
        }

        public async Task<PagedResult<OrderResponseDto>> GetBuyerOrdersAsync(int buyerId, int page, int pageSize)
        {
            return await _db.Orders
                .Include(o => o.Buyer)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ThenInclude(p => p.Images)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Seller)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.Shipment).ThenInclude(s => s!.Shipper)
                .Where(o => o.BuyerId == buyerId)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => MapToDto(o))
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<OrderResponseDto> GetOrderByIdAsync(int userId, int orderId)
        {
            var order = await _db.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ThenInclude(p => p.Images)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Seller)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.Shipment).ThenInclude(s => s!.Shipper)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            // Kiểm tra quyền: buyer hoặc seller liên quan
            var isBuyer = order.BuyerId == userId;
            var isSeller = order.OrderItems.Any(oi => oi.SellerId == userId);
            var isAdmin = await _db.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.Admin);

            if (!isBuyer && !isSeller && !isAdmin)
                throw new UnauthorizedAccessException("Bạn không có quyền xem đơn hàng này.");

            return MapToDto(order);
        }

        public async Task<bool> CancelOrderAsync(int buyerId, int orderId, string? reason = null)
        {
            var order = await _db.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Payment)
                .Include(o => o.Shipment)
                .FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == buyerId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Unshipped)
                throw new InvalidOperationException("Chỉ có thể hủy đơn khi chưa vận chuyển.");

            order.Status = OrderStatus.Canceled;

            // Hoàn lại tồn kho
            foreach (var item in order.OrderItems)
                item.Product.AvailableItemCount += item.Quantity;
            CancelActiveShipment(order.Shipment);
            CancelOrRefundPayment(order.Payment);

            var logNote = string.IsNullOrEmpty(reason) ? "Người mua hủy đơn." : $"Người mua hủy đơn. Lý do: {reason}";
            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = OrderStatus.Canceled, Note = logNote });

            // Cập nhật Payment
            await _db.SaveChangesAsync();

            var sellerIds = order.OrderItems.Select(oi => oi.SellerId).Distinct();
            foreach (var sid in sellerIds)
                await _notif.CreateNotificationAsync(sid, $"Đơn hàng #{order.OrderNumber} đã bị hủy bởi người mua.");

            await BroadcastOrderUpdatedAsync(order, "OrderCanceled");

            return true;
        }

        public async Task<List<OrderLogDto>> GetOrderLogsAsync(int userId, int orderId)
        {
            // Verify access
            await GetOrderByIdAsync(userId, orderId);

            return await _db.OrderLogs
                .Where(ol => ol.OrderId == orderId)
                .OrderBy(ol => ol.CreatedAt)
                .Select(ol => new OrderLogDto { Status = ol.Status.ToString(), Note = ol.Note, CreatedAt = ol.CreatedAt })
                .ToListAsync();
        }

        // === SELLER ===
        public async Task<PagedResult<OrderResponseDto>> GetSellerOrdersAsync(int sellerId, int page, int pageSize)
        {
            var isAdmin = await IsAdminAsync(sellerId);
            var orderIds = isAdmin
                ? null
                : await _db.OrderItems
                    .Where(oi => oi.SellerId == sellerId)
                    .Select(oi => oi.OrderId)
                    .Distinct()
                    .ToListAsync();

            var query = _db.Orders
                .Include(o => o.Buyer)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ThenInclude(p => p.Images)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Seller)
                .Include(o => o.ShippingAddress).Include(o => o.Payment)
                .Include(o => o.Shipment).ThenInclude(s => s!.Shipper)
                .AsQueryable();

            if (!isAdmin)
            {
                query = query.Where(o => orderIds!.Contains(o.Id));
            }

            return await query
                .OrderByDescending(o => o.OrderDate)
                .Select(o => MapToDto(o))
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<bool> UpdateOrderStatusAsync(int sellerId, int orderId, UpdateOrderStatusDto dto)
        {
            var isAdmin = await IsAdminAsync(sellerId);
            var order = await _db.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Payment)
                .Include(o => o.Shipment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!isAdmin && !order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật đơn hàng này.");

            if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
                throw new ArgumentException("Trạng thái không hợp lệ.");

            if (!isAdmin && newStatus is (OrderStatus.Shipped or OrderStatus.Complete))
                throw new InvalidOperationException("Seller không thể chuyển sang Shipped/Complete. Vui lòng tạo vận đơn và để Shipper xử lý.");

            if (!isAdmin && newStatus != OrderStatus.Canceled)
                OrderBusinessRules.EnsureSellerCanFulfill(order.Payment);

            if (newStatus == OrderStatus.Canceled)
            {
                if (order.Status == OrderStatus.Canceled)
                    return true;
                if (IsDeliveredOrComplete(order))
                    throw new InvalidOperationException("Khong the huy don da giao/hoan tat.");

                RestoreOrderStock(order);
                CancelActiveShipment(order.Shipment);
                CancelOrRefundPayment(order.Payment);
            }

            if (isAdmin)
                SyncShipmentForOrderStatus(order, newStatus);

            var statusActor = isAdmin ? "Admin" : "Seller";
            order.Status = newStatus;
            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = newStatus, Note = dto.Note ?? $"{statusActor} cap nhat: {newStatus}" });
            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(order.BuyerId, $"Đơn hàng #{order.OrderNumber} chuyển sang trạng thái: {newStatus}");
            await BroadcastOrderUpdatedAsync(order, "OrderStatusUpdated");
            return true;
        }

        public async Task<bool> RejectOrderAsync(int sellerId, int orderId, RejectOrderDto dto)
        {
            var isAdmin = await IsAdminAsync(sellerId);
            var order = await _db.Orders.Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Shipment)
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!isAdmin && !order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền.");

            if (order.Status == OrderStatus.Canceled)
                return true;

            if (IsDeliveredOrComplete(order))
                throw new InvalidOperationException("Khong the huy don da giao/hoan tat.");

            var cancelActor = isAdmin ? "Admin" : "Seller";
            order.Status = OrderStatus.Canceled;
            RestoreOrderStock(order);
            CancelActiveShipment(order.Shipment);
            CancelOrRefundPayment(order.Payment);

            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = OrderStatus.Canceled, Note = $"{cancelActor} huy don: {dto.Reason}" });

            await _db.SaveChangesAsync();
            await _notif.CreateNotificationAsync(order.BuyerId, $"Don hang #{order.OrderNumber} da bi huy. Ly do: {dto.Reason}");
            await BroadcastOrderUpdatedAsync(order, "OrderCanceled");
            return true;
        }

        // === SHIPMENT ===
        public async Task<ShipmentInfoDto> CreateShipmentAsync(int sellerId, int orderId, CreateShipmentDto dto)
        {
            var isAdmin = await IsAdminAsync(sellerId);
            var order = await _db.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Shipment)
                .Include(o => o.Payment)
                .Include(o => o.ShippingAddress)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!isAdmin && !order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền.");

            var pickupOwnerId = isAdmin
                ? order.OrderItems.Select(oi => oi.SellerId).FirstOrDefault()
                : sellerId;

            if (order.Shipment != null)
                throw new InvalidOperationException("Đơn hàng đã có thông tin vận chuyển.");

            if (order.Status is OrderStatus.Canceled or OrderStatus.Complete)
                throw new InvalidOperationException("Không thể tạo vận đơn cho đơn đã hủy/hoàn tất.");

            if (!isAdmin)
                OrderBusinessRules.EnsureSellerCanFulfill(order.Payment);

            var shipment = new Shipment
            {
                OrderId = orderId,
                Status = ShipmentStatus.Pending,
                ShipmentDate = dto.ShipmentDate ?? DateTime.UtcNow,
                EstimatedArrival = dto.EstimatedArrival,
                ShipmentMethod = dto.ShipmentMethod,
                TrackingNumber = dto.TrackingNumber ?? "GC-" + Guid.NewGuid().ToString("N")[..8].ToUpper()
            };

            _db.Shipments.Add(shipment);

            if (order.Status == OrderStatus.Pending)
                order.Status = OrderStatus.Unshipped;

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = orderId,
                Status = OrderStatus.Unshipped,
                Note = "Seller đã tạo vận đơn. Chờ lấy hàng."
            });

            await _db.SaveChangesAsync();

            var pickupAddress = await _db.UserAddresses
                .OrderByDescending(a => a.IsDefault)
                .ThenBy(a => a.Id)
                .FirstOrDefaultAsync(a => a.UserId == pickupOwnerId);
            var pickupCoordinate = pickupAddress == null
                ? FallbackShopCoordinate
                : ResolveAddressCoordinate(pickupAddress, allowCityFallback: true);
            var deliveryCoordinate = ResolveAddressCoordinate(order.ShippingAddress, allowCityFallback: true);
            var nearbyShipperIds = await GetNearbyShipperIdsAsync(pickupCoordinate, deliveryCoordinate);
            var shipmentAvailablePayload = new
            {
                shipmentId = shipment.Id,
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                status = shipment.Status.ToString()
            };

            foreach (var sId in nearbyShipperIds)
            {
                await _notif.CreateNotificationAsync(sId, $"Có đơn hàng mới #{order.OrderNumber} chờ nhận giao.");
            }

            if (nearbyShipperIds.Count > 0)
            {
                await _deliveryHub.Clients
                    .Groups(nearbyShipperIds.Select(DeliveryHub.UserGroup))
                    .SendAsync("ShipmentAvailable", shipmentAvailablePayload);
            }

            await _deliveryHub.Clients
                .Group(DeliveryHub.ShipperAvailableGroup)
                .SendAsync("ShipmentAvailable", shipmentAvailablePayload);

            order.Shipment = shipment;
            await BroadcastOrderUpdatedAsync(order, "OrderShipmentCreated");

            return new ShipmentInfoDto
            {
                Id = shipment.Id,
                Status = shipment.Status.ToString(),
                ShipmentDate = shipment.ShipmentDate,
                EstimatedArrival = shipment.EstimatedArrival,
                ShipmentMethod = shipment.ShipmentMethod,
                TrackingNumber = shipment.TrackingNumber
            };
        }

        public async Task<ShipmentInfoDto> GetShipmentAsync(int userId, int orderId)
        {
            await GetOrderByIdAsync(userId, orderId);

            var shipment = await _db.Shipments.Include(s => s.Shipper)
                .FirstOrDefaultAsync(s => s.OrderId == orderId)
                ?? throw new KeyNotFoundException("Chưa có thông tin vận chuyển.");

            return MapShipmentDto(shipment);
        }

        public async Task<bool> UpdateShipmentStatusAsync(int sellerId, int shipmentId, UpdateShipmentStatusDto dto)
        {
            var isAdmin = await IsAdminAsync(sellerId);
            var shipment = await _db.Shipments
                .Include(s => s.Order).ThenInclude(o => o.OrderItems)
                .Include(s => s.Order).ThenInclude(o => o.Payment)
                .FirstOrDefaultAsync(s => s.Id == shipmentId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin vận chuyển.");

            if (!isAdmin && !shipment.Order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền.");

            if (!Enum.TryParse<ShipmentStatus>(dto.Status, true, out var newStatus))
                throw new ArgumentException("Trạng thái vận chuyển không hợp lệ.");

            if (isAdmin)
            {
                ApplyAdminShipmentStatus(shipment, newStatus, dto.Note);
                await _db.SaveChangesAsync();
                await BroadcastShipmentUpdatedAsync(shipment.Order, "ShipmentUpdated");
                return true;
            }

            if (newStatus is ShipmentStatus.Delivered or ShipmentStatus.Shipped)
                throw new InvalidOperationException(
                    "Seller không thể đánh dấu Shipped/Delivered. Shipper sẽ nhận và xác nhận giao hàng qua API /api/shipper.");

            if (newStatus == ShipmentStatus.OnHold && shipment.Status == ShipmentStatus.Pending)
            {
                shipment.Status = ShipmentStatus.OnHold;
                _db.ShipmentLogs.Add(new ShipmentLog
                {
                    ShipmentId = shipmentId,
                    Status = newStatus,
                    Note = dto.Note ?? "Tạm giữ vận chuyển."
                });
                await _db.SaveChangesAsync();
                await BroadcastShipmentUpdatedAsync(shipment.Order, "ShipmentUpdated");
                return true;
            }

            throw new InvalidOperationException($"Seller không thể chuyển vận đơn sang trạng thái: {newStatus}");
        }

        public async Task<List<ShipmentLogDto>> GetShipmentLogsAsync(int userId, int shipmentId)
        {
            var shipment = await _db.Shipments
                .Include(s => s.Order).ThenInclude(o => o.OrderItems)
                .FirstOrDefaultAsync(s => s.Id == shipmentId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin vận chuyển.");

            var isBuyer = shipment.Order.BuyerId == userId;
            var isSeller = shipment.Order.OrderItems.Any(oi => oi.SellerId == userId);
            var isShipper = shipment.ShipperId == userId;
            var isAdmin = await _db.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.Admin);

            if (!isBuyer && !isSeller && !isShipper && !isAdmin)
                throw new UnauthorizedAccessException("Bạn không có quyền xem lịch sử vận chuyển này.");

            return await _db.ShipmentLogs
                .Where(sl => sl.ShipmentId == shipmentId)
                .OrderBy(sl => sl.CreatedAt)
                .Select(sl => new ShipmentLogDto { Status = sl.Status.ToString(), Note = sl.Note, CreatedAt = sl.CreatedAt })
                .ToListAsync();
        }

        public async Task<bool> SelectPaymentMethodAsync(int buyerId, int orderId, SelectPaymentMethodDto dto)
        {
            var order = await _db.Orders.Include(o => o.Shipment).Include(o => o.Payment).FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (order.BuyerId != buyerId) throw new UnauthorizedAccessException();
            if (order.Shipment == null || order.Shipment.Status != ShipmentStatus.Arrived)
                throw new InvalidOperationException("Chưa thể chọn phương thức thanh toán lúc này.");

            if (order.Shipment.BuyerConfirmedReceiptAt == null)
                throw new InvalidOperationException("Vui lòng xác nhận đã nhận hàng trước.");

            if (order.Payment == null) throw new InvalidOperationException("Không có thông tin thanh toán.");

            if (dto.Method == "Cash")
            {
                order.Payment.Method = PaymentMethod.CreditCard;
                await _db.SaveChangesAsync();
                if (order.Shipment.ShipperId.HasValue)
                {
                    await _notif.CreateNotificationAsync(
                        order.Shipment.ShipperId.Value,
                        $"Khách đơn #{order.OrderNumber} chọn TIỀN MẶT. Vui lòng bấm \"Đã nhận tiền\" sau khi thu.",
                        NotificationAction.CashSelected,
                        orderId);
                }
            }
            else if (dto.Method == "Transfer")
            {
                order.Payment.Method = PaymentMethod.ElectronicBankTransfer;
                await _db.SaveChangesAsync();
            }

            await BroadcastShipmentUpdatedAsync(order, "ShipmentPaymentMethodSelected");

            return true;
        }

        public async Task<bool> ConfirmTransferAsync(int buyerId, int orderId)
        {
            var order = await _db.Orders.Include(o => o.Shipment).Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (order.BuyerId != buyerId) throw new UnauthorizedAccessException();
            if (order.Shipment == null || order.Shipment.Status != ShipmentStatus.Arrived)
                throw new InvalidOperationException("Chưa thể xác nhận chuyển khoản.");

            if (order.Shipment.BuyerConfirmedReceiptAt == null)
                throw new InvalidOperationException("Vui lòng xác nhận đã nhận hàng trước.");

            if (order.Payment?.Method != PaymentMethod.ElectronicBankTransfer)
                throw new InvalidOperationException("Vui lòng chọn phương thức chuyển khoản trước.");

            order.Shipment.TransferReportedAt = DateTime.UtcNow;
            order.Payment.Status = PaymentStatus.Completed;
            order.Payment.UpdatedAt = DateTime.UtcNow;

            if (order.Shipment.ShipperId.HasValue)
            {
                await _notif.CreateNotificationAsync(
                    order.Shipment.ShipperId.Value,
                    $"Khách đơn #{order.OrderNumber} đã chuyển khoản {order.TotalAmount:N0}đ. Vui lòng bấm \"Đã nhận chuyển khoản\".",
                    NotificationAction.TransferReported,
                    orderId);
            }

            await _db.SaveChangesAsync();
            await BroadcastShipmentUpdatedAsync(order, "ShipmentPaymentUpdated");
            return true;
        }

        public async Task<ConfirmReceiptResultDto> ConfirmReceiptAsync(int buyerId, int orderId)
        {
            var order = await _db.Orders
                .Include(o => o.Shipment)
                .Include(o => o.Payment)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (order.BuyerId != buyerId) throw new UnauthorizedAccessException();
            if (order.Shipment == null || order.Shipment.Status != ShipmentStatus.Arrived)
                throw new InvalidOperationException("Đơn hàng chưa đến nơi, chưa thể xác nhận nhận hàng.");

            if (order.Shipment.BuyerConfirmedReceiptAt != null)
                return new ConfirmReceiptResultDto
                {
                    Completed = order.Status == OrderStatus.Complete,
                    RequiresPayment = order.Payment?.Status == PaymentStatus.Unpaid,
                    Message = "Đã xác nhận nhận hàng trước đó."
                };

            order.Shipment.BuyerConfirmedReceiptAt = DateTime.UtcNow;

            if (order.Payment != null && order.Payment.Status == PaymentStatus.Completed)
            {
                await _db.SaveChangesAsync();
                await BroadcastShipmentUpdatedAsync(order, "ShipmentReceiptConfirmed");

                if (order.Shipment.ShipperId.HasValue)
                {
                    await _notif.CreateNotificationAsync(
                        order.Shipment.ShipperId.Value,
                        $"Khách đã nhận hàng đơn #{order.OrderNumber} (đã thanh toán trước).",
                        NotificationAction.OrderDelivered,
                        orderId);
                }

                return new ConfirmReceiptResultDto
                {
                    Completed = false,
                    RequiresPayment = false,
                    Message = "Đã xác nhận nhận hàng. Vui lòng chờ shipper hoàn tất giao hàng."
                };
            }

            await _db.SaveChangesAsync();
            await BroadcastShipmentUpdatedAsync(order, "ShipmentReceiptConfirmed");

            return new ConfirmReceiptResultDto
            {
                Completed = false,
                RequiresPayment = true,
                Message = "Vui lòng chọn phương thức thanh toán."
            };
        }

        private async Task BroadcastShipmentUpdatedAsync(Order order, string eventName)
        {
            var shipment = order.Shipment ?? await _db.Shipments.FirstOrDefaultAsync(s => s.OrderId == order.Id);
            if (shipment == null) return;

            var groups = new List<string> { DeliveryHub.UserGroup(order.BuyerId) };
            if (shipment.ShipperId.HasValue)
            {
                groups.Add(DeliveryHub.UserGroup(shipment.ShipperId.Value));
            }

            groups.AddRange(await GetSellerGroupsAsync(order.Id));

            var payload = new
            {
                shipmentId = shipment.Id,
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                shipmentStatus = shipment.Status.ToString(),
                orderStatus = order.Status.ToString(),
                paymentStatus = order.Payment?.Status.ToString(),
                buyerId = order.BuyerId,
                shipperId = shipment.ShipperId
            };

            var targetGroups = groups.Distinct().ToArray();
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync(eventName, payload);
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync("ShipmentUpdated", payload);
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync("OrderUpdated", payload);
        }

        private async Task<List<int>> GetNearbyShipperIdsAsync(GeoPoint? pickupCoordinate, GeoPoint? deliveryCoordinate)
        {
            if (pickupCoordinate == null && deliveryCoordinate == null)
            {
                return new List<int>();
            }

            var cutoff = DateTime.UtcNow.Subtract(ShipperLocationFreshness);
            var locations = await _db.ShipperLocations
                .Include(l => l.Shipper)
                .Where(l => l.UpdatedAt >= cutoff && l.Shipper.Role == UserRole.Shipper)
                .ToListAsync();

            return locations
                .Where(location =>
                {
                    var shipperCoordinate = new GeoPoint(location.Latitude, location.Longitude);
                    if (pickupCoordinate.HasValue)
                    {
                        return IsWithinAvailableRadius(shipperCoordinate, pickupCoordinate.Value);
                    }

                    return deliveryCoordinate.HasValue
                        && IsWithinAvailableRadius(shipperCoordinate, deliveryCoordinate.Value);
                })
                .Select(location => location.ShipperId)
                .Distinct()
                .ToList();
        }

        private static bool IsWithinAvailableRadius(GeoPoint shipperCoordinate, GeoPoint endpoint)
        {
            var distanceMeters = CalculateDistanceMeters(shipperCoordinate, endpoint);
            return distanceMeters.HasValue && distanceMeters.Value <= MaxAvailableEndpointDistanceMeters;
        }

        private static GeoPoint? ResolveAddressCoordinate(UserAddress? address, bool allowCityFallback = true)
        {
            if (address == null) return null;

            var combined = NormalizeForSearch($"{address.StreetAddress} {address.State} {address.City} {address.Country}");
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
                    return CoordinateOnLeLoiDistrict1(ReadLeadingNumber(address.StreetAddress));
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

        private async Task BroadcastOrderUpdatedAsync(Order order, string eventName)
        {
            var shipment = order.Shipment ?? await _db.Shipments.FirstOrDefaultAsync(s => s.OrderId == order.Id);
            var payment = order.Payment ?? await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == order.Id);

            var groups = new List<string> { DeliveryHub.UserGroup(order.BuyerId) };
            groups.AddRange(await GetSellerGroupsAsync(order.Id));

            if (shipment?.ShipperId.HasValue == true)
            {
                groups.Add(DeliveryHub.UserGroup(shipment.ShipperId.Value));
            }

            var payload = new
            {
                shipmentId = shipment?.Id,
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                shipmentStatus = shipment?.Status.ToString(),
                orderStatus = order.Status.ToString(),
                paymentStatus = payment?.Status.ToString(),
                buyerId = order.BuyerId,
                shipperId = shipment?.ShipperId
            };

            var targetGroups = groups.Distinct().ToArray();
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync(eventName, payload);
            await _deliveryHub.Clients.Groups(targetGroups).SendAsync("OrderUpdated", payload);
        }

        private async Task<List<string>> GetSellerGroupsAsync(int orderId)
        {
            return await _db.OrderItems
                .Where(oi => oi.OrderId == orderId)
                .Select(oi => oi.SellerId)
                .Distinct()
                .Select(sellerId => DeliveryHub.UserGroup(sellerId))
                .ToListAsync();
        }

        private async Task<bool> IsAdminAsync(int userId)
        {
            return await _db.Users.AnyAsync(u => u.Id == userId && u.Role == UserRole.Admin);
        }

        private static void SyncShipmentForOrderStatus(Order order, OrderStatus newStatus)
        {
            var now = DateTime.UtcNow;
            if (newStatus == OrderStatus.Complete && order.Payment != null)
            {
                order.Payment.Status = PaymentStatus.Completed;
                order.Payment.UpdatedAt = now;
            }

            if (order.Shipment == null)
                return;

            if (newStatus == OrderStatus.Shipped && order.Shipment.Status != ShipmentStatus.Delivered)
            {
                order.Shipment.Status = ShipmentStatus.Shipped;
                order.Shipment.PickedUpAt ??= now;
            }
            else if (newStatus == OrderStatus.Complete)
            {
                order.Shipment.Status = ShipmentStatus.Delivered;
                order.Shipment.DeliveredAt ??= now;
            }
        }

        private void ApplyAdminShipmentStatus(Shipment shipment, ShipmentStatus newStatus, string? note)
        {
            var previousOrderStatus = shipment.Order.Status;
            var now = DateTime.UtcNow;

            shipment.Status = newStatus;

            if (newStatus == ShipmentStatus.Accepted)
            {
                shipment.AcceptedAt ??= now;
            }
            else if (newStatus == ShipmentStatus.Shipped)
            {
                shipment.PickedUpAt ??= now;
                shipment.Order.Status = OrderStatus.Shipped;
            }
            else if (newStatus == ShipmentStatus.Arrived)
            {
                shipment.ArrivedAt ??= now;
                shipment.Order.Status = OrderStatus.Shipped;
            }
            else if (newStatus == ShipmentStatus.Delivered)
            {
                shipment.DeliveredAt ??= now;
                shipment.Order.Status = OrderStatus.Complete;
                if (shipment.Order.Payment != null)
                {
                    shipment.Order.Payment.Status = PaymentStatus.Completed;
                    shipment.Order.Payment.UpdatedAt = now;
                }
            }

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipment.Id,
                Status = newStatus,
                Note = note ?? $"Admin cap nhat van don: {newStatus}"
            });

            if (shipment.Order.Status != previousOrderStatus)
            {
                _db.OrderLogs.Add(new OrderLog
                {
                    OrderId = shipment.OrderId,
                    Status = shipment.Order.Status,
                    Note = note ?? $"Admin cap nhat theo van don: {newStatus}"
                });
            }
        }

        private static bool IsDeliveredOrComplete(Order order)
        {
            return order.Status == OrderStatus.Complete
                || order.Shipment?.Status == ShipmentStatus.Delivered;
        }

        private static void CancelActiveShipment(Shipment? shipment)
        {
            if (shipment == null || shipment.Status == ShipmentStatus.Delivered)
                return;

            shipment.Status = ShipmentStatus.OnHold;
        }

        private static void CancelOrRefundPayment(Payment? payment)
        {
            if (payment == null)
                return;

            payment.Status = payment.Status == PaymentStatus.Completed
                ? PaymentStatus.Refunded
                : PaymentStatus.Canceled;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        private static OrderResponseDto MapToDto(Order o) => new()
        {
            Id = o.Id, OrderNumber = o.OrderNumber, Status = o.Status.ToString(),
            OrderDate = o.OrderDate, TotalAmount = o.TotalAmount, ShippingFee = o.ShippingFee,
            BuyerName = o.Buyer?.FullName, Note = o.Note,
            ShippingAddress = new AddressSnapshotDto
            {
                StreetAddress = o.ShippingAddress.StreetAddress, City = o.ShippingAddress.City,
                State = o.ShippingAddress.State, Zipcode = o.ShippingAddress.Zipcode, Country = o.ShippingAddress.Country
            },
            Items = o.OrderItems.Select(oi => new OrderItemResponseDto
            {
                Id = oi.Id, ProductId = oi.ProductId, ProductName = oi.Product.Name,
                ProductImage = oi.Product.Images.FirstOrDefault(i => i.IsMain)?.ImageUrl,
                SellerId = oi.SellerId, SellerName = oi.Seller.FullName,
                Quantity = oi.Quantity, UnitPrice = oi.UnitPrice
            }).ToList(),
            Payment = o.Payment != null ? new PaymentResponseDto
            {
                Method = o.Payment.Method.ToString(), Status = o.Payment.Status.ToString(),
                Amount = o.Payment.Amount, TransactionRef = o.Payment.TransactionRef
            } : null,
            Shipment = o.Shipment != null ? MapShipmentDto(o.Shipment) : null
        };

        private static void RestoreOrderStock(Order order)
        {
            foreach (var item in order.OrderItems)
            {
                item.Product.AvailableItemCount += item.Quantity;
            }
        }

        private static ShipmentInfoDto MapShipmentDto(Shipment s) => new()
        {
            Id = s.Id,
            Status = s.Status.ToString(),
            ShipmentDate = s.ShipmentDate,
            EstimatedArrival = s.EstimatedArrival,
            ShipmentMethod = s.ShipmentMethod,
            TrackingNumber = s.TrackingNumber,
            ShipperId = s.ShipperId,
            ShipperName = s.Shipper?.FullName,
            ShipperPhone = s.Shipper?.PhoneNumber,
            AssignedAt = s.AssignedAt,
            DeliveredAt = s.DeliveredAt
        };
    }
}
