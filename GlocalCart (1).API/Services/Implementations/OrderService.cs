using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Orders;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class OrderService : IOrderService
    {
        private readonly AppDbContext _db;
        private readonly INotificationService _notif;

        public OrderService(AppDbContext db, INotificationService notif)
        {
            _db = db;
            _notif = notif;
        }

        public async Task<OrderResponseDto> CreateOrderAsync(int buyerId, CreateOrderDto dto)
        {
            // Lấy giỏ hàng
            var cartItems = await _db.CartItems
                .Include(ci => ci.Product)
                .Where(ci => ci.UserId == buyerId)
                .ToListAsync();

            if (!cartItems.Any())
                throw new InvalidOperationException("Giỏ hàng trống.");

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

            // Tạo đơn hàng
            var order = new Order
            {
                OrderNumber = "GC-" + DateTime.UtcNow.Ticks.ToString()[^10..],
                BuyerId = buyerId,
                ShippingAddressId = dto.ShippingAddressId,
                Status = OrderStatus.Pending,
                TotalAmount = cartItems.Sum(ci => ci.PriceSnapshot * ci.Quantity),
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

            // Tạo Payment mô phỏng
            _db.Payments.Add(new Payment
            {
                OrderId = order.Id,
                Method = dto.PaymentMethod,
                Status = PaymentStatus.Completed,
                Amount = order.TotalAmount,
                TransactionRef = "TXN-" + Guid.NewGuid().ToString("N")[..12].ToUpper()
            });

            // Ghi OrderLog đầu tiên
            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = order.Id,
                Status = OrderStatus.Pending,
                Note = "Đơn hàng được tạo."
            });

            // Xóa giỏ hàng
            _db.CartItems.RemoveRange(cartItems);

            await _db.SaveChangesAsync();

            // Thông báo cho Seller(s)
            var sellerIds = cartItems.Select(ci => ci.Product.SellerId).Distinct();
            foreach (var sellerId in sellerIds)
            {
                await _notif.CreateNotificationAsync(sellerId,
                    $"Bạn có đơn hàng mới #{order.OrderNumber}.");
            }

            return await GetOrderByIdAsync(buyerId, order.Id);
        }

        public async Task<PagedResult<OrderResponseDto>> GetBuyerOrdersAsync(int buyerId, int page, int pageSize)
        {
            return await _db.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ThenInclude(p => p.Images)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Seller)
                .Include(o => o.ShippingAddress)
                .Include(o => o.Payment)
                .Include(o => o.Shipment)
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
                .Include(o => o.Shipment)
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

        public async Task<bool> CancelOrderAsync(int buyerId, int orderId)
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

            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = OrderStatus.Canceled, Note = "Người mua hủy đơn." });

            // Cập nhật Payment
            var payment = await _db.Payments.FirstOrDefaultAsync(p => p.OrderId == orderId);
            if (payment != null) { payment.Status = PaymentStatus.Refunded; payment.UpdatedAt = DateTime.UtcNow; }

            await _db.SaveChangesAsync();

            var sellerIds = order.OrderItems.Select(oi => oi.SellerId).Distinct();
            foreach (var sid in sellerIds)
                await _notif.CreateNotificationAsync(sid, $"Đơn hàng #{order.OrderNumber} đã bị hủy bởi người mua.");

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
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ThenInclude(p => p.Images)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Seller)
                .Include(o => o.ShippingAddress).Include(o => o.Payment).Include(o => o.Shipment)
                .Where(o => orderIds.Contains(o.Id))
                .OrderByDescending(o => o.OrderDate)
                .Select(o => MapToDto(o))
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<bool> UpdateOrderStatusAsync(int sellerId, int orderId, UpdateOrderStatusDto dto)
        {
            var order = await _db.Orders.Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền cập nhật đơn hàng này.");

            if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
                throw new ArgumentException("Trạng thái không hợp lệ.");

            order.Status = newStatus;
            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = newStatus, Note = dto.Note ?? $"Seller cập nhật: {newStatus}" });
            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(order.BuyerId, $"Đơn hàng #{order.OrderNumber} chuyển sang trạng thái: {newStatus}");
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
            if (payment != null) { payment.Status = PaymentStatus.Refunded; payment.UpdatedAt = DateTime.UtcNow; }

            await _db.SaveChangesAsync();
            await _notif.CreateNotificationAsync(order.BuyerId, $"Đơn hàng #{order.OrderNumber} bị từ chối. Lý do: {dto.Reason}");
            return true;
        }

        // === SHIPMENT ===
        public async Task<ShipmentInfoDto> CreateShipmentAsync(int sellerId, int orderId, CreateShipmentDto dto)
        {
            var order = await _db.Orders.Include(o => o.OrderItems).Include(o => o.Shipment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền.");

            if (order.Shipment != null)
                throw new InvalidOperationException("Đơn hàng đã có thông tin vận chuyển.");

            var shipment = new Shipment
            {
                OrderId = orderId,
                ShipmentDate = dto.ShipmentDate ?? DateTime.UtcNow,
                EstimatedArrival = dto.EstimatedArrival,
                ShipmentMethod = dto.ShipmentMethod,
                TrackingNumber = dto.TrackingNumber
            };

            _db.Shipments.Add(shipment);
            order.Status = OrderStatus.Shipped;
            _db.OrderLogs.Add(new OrderLog { OrderId = orderId, Status = OrderStatus.Shipped, Note = "Đơn hàng đã được gửi." });

            await _db.SaveChangesAsync();

            _db.ShipmentLogs.Add(new ShipmentLog { ShipmentId = shipment.Id, Status = ShipmentStatus.Shipped, Note = "Bắt đầu vận chuyển." });
            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(order.BuyerId, $"Đơn hàng #{order.OrderNumber} đã được gửi đi.");

            return new ShipmentInfoDto
            {
                Id = shipment.Id, ShipmentDate = shipment.ShipmentDate,
                EstimatedArrival = shipment.EstimatedArrival,
                ShipmentMethod = shipment.ShipmentMethod, TrackingNumber = shipment.TrackingNumber
            };
        }

        public async Task<ShipmentInfoDto> GetShipmentAsync(int userId, int orderId)
        {
            var shipment = await _db.Shipments.FirstOrDefaultAsync(s => s.OrderId == orderId)
                ?? throw new KeyNotFoundException("Chưa có thông tin vận chuyển.");
            return new ShipmentInfoDto
            {
                Id = shipment.Id, ShipmentDate = shipment.ShipmentDate,
                EstimatedArrival = shipment.EstimatedArrival,
                ShipmentMethod = shipment.ShipmentMethod, TrackingNumber = shipment.TrackingNumber
            };
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

            _db.ShipmentLogs.Add(new ShipmentLog { ShipmentId = shipmentId, Status = newStatus, Note = dto.Note });

            // Nếu giao thành công -> cập nhật Order
            if (newStatus == ShipmentStatus.Delivered)
            {
                shipment.Order.Status = OrderStatus.Complete;
                _db.OrderLogs.Add(new OrderLog { OrderId = shipment.OrderId, Status = OrderStatus.Complete, Note = "Đã giao hàng thành công." });
                await _notif.CreateNotificationAsync(shipment.Order.BuyerId, $"Đơn hàng #{shipment.Order.OrderNumber} đã giao thành công!");
            }

            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<List<ShipmentLogDto>> GetShipmentLogsAsync(int userId, int shipmentId)
        {
            return await _db.ShipmentLogs
                .Where(sl => sl.ShipmentId == shipmentId)
                .OrderBy(sl => sl.CreatedAt)
                .Select(sl => new ShipmentLogDto { Status = sl.Status.ToString(), Note = sl.Note, CreatedAt = sl.CreatedAt })
                .ToListAsync();
        }

        private static OrderResponseDto MapToDto(Order o) => new()
        {
            Id = o.Id, OrderNumber = o.OrderNumber, Status = o.Status.ToString(),
            OrderDate = o.OrderDate, TotalAmount = o.TotalAmount, Note = o.Note,
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
            Shipment = o.Shipment != null ? new ShipmentInfoDto
            {
                Id = o.Shipment.Id, ShipmentDate = o.Shipment.ShipmentDate,
                EstimatedArrival = o.Shipment.EstimatedArrival,
                ShipmentMethod = o.Shipment.ShipmentMethod, TrackingNumber = o.Shipment.TrackingNumber
            } : null
        };
    }
}
