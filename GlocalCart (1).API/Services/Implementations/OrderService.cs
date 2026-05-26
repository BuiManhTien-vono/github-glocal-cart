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

namespace GlocalCart.API.Services.Implementations
{
    public class OrderService : IOrderService
    {
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

            // Lấy giỏ hàng
            var cartItems = await _db.CartItems
                .Include(ci => ci.Product)
                .Where(ci => ci.UserId == buyerId)
                .ToListAsync();

            if (!cartItems.Any())
                throw new InvalidOperationException("Giỏ hàng trống.");

            var sellerIdsInCart = cartItems.Select(ci => ci.Product.SellerId).Distinct().ToList();
            if (sellerIdsInCart.Count > 1)
                throw new InvalidOperationException("Hiện tại mỗi đơn hàng chỉ hỗ trợ sản phẩm từ một shop. Vui lòng tách giỏ hàng theo từng shop để đặt hàng.");

            // Kiểm tra địa chỉ
            var address = await _db.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == dto.ShippingAddressId && a.UserId == buyerId)
                ?? throw new KeyNotFoundException("Địa chỉ giao hàng không tồn tại.");

            // Kiểm tra tồn kho cho tất cả sản phẩm
            foreach (var item in cartItems)
            {
                if (item.Quantity > item.Product.AvailableItemCount)
                    throw new InvalidOperationException($"Sản phẩm '{item.Product.Name}' chỉ còn {item.Product.AvailableItemCount} đơn vị.");
                if (!item.Product.IsActive || item.Product.IsLocked)
                    throw new InvalidOperationException($"Sản phẩm '{item.Product.Name}' không khả dụng.");
            }

            var order = new Order
            {
                OrderNumber = "GC-" + DateTime.UtcNow.Ticks.ToString()[^10..],
                BuyerId = buyerId,
                ShippingAddressId = dto.ShippingAddressId,
                Status = OrderStatus.Pending,
                ShippingFee = 30000m,
                TotalAmount = cartItems.Sum(ci => ci.PriceSnapshot * ci.Quantity) + 30000m,
                Note = dto.Note
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            // Tạo OrderItems + trừ kho
            foreach (var ci in cartItems)
            {
                _db.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = ci.ProductId,
                    SellerId = ci.Product.SellerId,
                    Quantity = ci.Quantity,
                    UnitPrice = ci.PriceSnapshot
                });

                // Trừ tồn kho
                ci.Product.AvailableItemCount -= ci.Quantity;
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
                    ? "Đơn hàng được tạo. Chờ thanh toán chuyển khoản."
                    : "Đơn hàng được tạo (COD). Chờ seller xử lý."
            });

            // Xóa giỏ hàng
            _db.CartItems.RemoveRange(cartItems);

            await _db.SaveChangesAsync();

            await transaction.CommitAsync();

            // Thông báo cho Seller(s)
            var sellerIds = cartItems.Select(ci => ci.Product.SellerId).Distinct();
            foreach (var sellerId in sellerIds)
            {
                string notifMessage = isBankTransfer
                    ? $"Bạn có đơn hàng mới #{order.OrderNumber}. Người mua đang tiến hành thanh toán chuyển khoản."
                    : $"YÊU CẦU XÁC NHẬN: Bạn có đơn hàng mới #{order.OrderNumber} (COD), vui lòng xác nhận để chuẩn bị hàng.";
                    
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
                .FirstOrDefaultAsync(o => o.Id == orderId && o.BuyerId == buyerId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (order.Status != OrderStatus.Pending && order.Status != OrderStatus.Unshipped)
                throw new InvalidOperationException("Chỉ có thể hủy đơn khi chưa vận chuyển.");

            order.Status = OrderStatus.Canceled;

            // Hoàn lại tồn kho
            foreach (var item in order.OrderItems)
                item.Product.AvailableItemCount += item.Quantity;

            var logNote = string.IsNullOrEmpty(reason) ? "Người mua hủy đơn." : $"Người mua hủy đơn. Lý do: {reason}";
            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = OrderStatus.Canceled, Note = logNote });

            // Cập nhật Payment
            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (payment != null)
            {
                payment.Status = payment.Status == PaymentStatus.Completed
                    ? PaymentStatus.Refunded
                    : PaymentStatus.Canceled;
                payment.UpdatedAt = DateTime.UtcNow;
            }

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
            var orderIds = await _db.OrderItems
                .Where(oi => oi.SellerId == sellerId)
                .Select(oi => oi.OrderId)
                .Distinct()
                .ToListAsync();

            return await _db.Orders
                .Include(o => o.Buyer)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ThenInclude(p => p.Images)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Seller)
                .Include(o => o.ShippingAddress).Include(o => o.Payment)
                .Include(o => o.Shipment).ThenInclude(s => s!.Shipper)
                .Where(o => orderIds.Contains(o.Id))
                .OrderByDescending(o => o.OrderDate)
                .Select(o => MapToDto(o))
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<bool> UpdateOrderStatusAsync(int sellerId, int orderId, UpdateOrderStatusDto dto)
        {
            var order = await _db.Orders.Include(o => o.OrderItems).Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật đơn hàng này.");

            if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
                throw new ArgumentException("Trạng thái không hợp lệ.");

            if (newStatus is OrderStatus.Shipped or OrderStatus.Complete)
                throw new InvalidOperationException("Seller không thể chuyển sang Shipped/Complete. Vui lòng tạo vận đơn và để Shipper xử lý.");

            if (newStatus != OrderStatus.Canceled)
                OrderBusinessRules.EnsureSellerCanFulfill(order.Payment);

            order.Status = newStatus;
            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = newStatus, Note = dto.Note ?? $"Seller cập nhật: {newStatus}" });
            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(order.BuyerId, $"Đơn hàng #{order.OrderNumber} chuyển sang trạng thái: {newStatus}");
            await BroadcastOrderUpdatedAsync(order, "OrderStatusUpdated");
            return true;
        }

        public async Task<bool> RejectOrderAsync(int sellerId, int orderId, RejectOrderDto dto)
        {
            var order = await _db.Orders.Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền.");

            if (order.Status == OrderStatus.Shipped || order.Status == OrderStatus.Complete)
                throw new InvalidOperationException("Không thể từ chối đơn đã vận chuyển.");

            order.Status = OrderStatus.Canceled;
            foreach (var item in order.OrderItems.Where(oi => oi.SellerId == sellerId))
                item.Product.AvailableItemCount += item.Quantity;

            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = OrderStatus.Canceled, Note = $"Seller từ chối: {dto.Reason}" });

            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (payment != null)
            {
                payment.Status = payment.Status == PaymentStatus.Completed
                    ? PaymentStatus.Refunded
                    : PaymentStatus.Canceled;
                payment.UpdatedAt = DateTime.UtcNow;
            }

            await _db.SaveChangesAsync();
            await _notif.CreateNotificationAsync(order.BuyerId, $"Đơn hàng #{order.OrderNumber} bị từ chối. Lý do: {dto.Reason}");
            await BroadcastOrderUpdatedAsync(order, "OrderRejected");
            return true;
        }

        // === SHIPMENT ===
        public async Task<ShipmentInfoDto> CreateShipmentAsync(int sellerId, int orderId, CreateShipmentDto dto)
        {
            var order = await _db.Orders.Include(o => o.OrderItems).Include(o => o.Shipment).Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền.");

            if (order.Shipment != null)
                throw new InvalidOperationException("Đơn hàng đã có thông tin vận chuyển.");

            if (order.Status is OrderStatus.Canceled or OrderStatus.Complete)
                throw new InvalidOperationException("Không thể tạo vận đơn cho đơn đã hủy/hoàn tất.");

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

            var shipperIds = await _db.Users.Where(u => u.Role == UserRole.Shipper).Select(u => u.Id).ToListAsync();
            foreach (var sId in shipperIds)
            {
                await _notif.CreateNotificationAsync(sId, $"Có đơn hàng mới #{order.OrderNumber} chờ nhận giao.");
            }

            await _deliveryHub.Clients.Group(DeliveryHub.ShipperAvailableGroup).SendAsync("ShipmentAvailable", new
            {
                shipmentId = shipment.Id,
                orderId = order.Id,
                orderNumber = order.OrderNumber,
                status = shipment.Status.ToString()
            });

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
            var shipment = await _db.Shipments.Include(s => s.Order).ThenInclude(o => o.OrderItems)
                .FirstOrDefaultAsync(s => s.Id == shipmentId)
                ?? throw new KeyNotFoundException("Không tìm thấy thông tin vận chuyển.");

            if (!shipment.Order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền.");

            if (!Enum.TryParse<ShipmentStatus>(dto.Status, true, out var newStatus))
                throw new ArgumentException("Trạng thái vận chuyển không hợp lệ.");

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
