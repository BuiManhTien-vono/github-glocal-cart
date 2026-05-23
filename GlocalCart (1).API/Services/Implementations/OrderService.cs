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
            var isBuyNow = dto.Items != null && dto.Items.Any();

            // ── Lấy danh sách sản phẩm + số lượng ──
            // Sử dụng một cấu trúc chung cho cả 2 luồng
            List<(Product Product, int Quantity, decimal PriceSnapshot)> orderLines;

            if (isBuyNow)
            {
                // Buy Now: lấy sản phẩm trực tiếp từ dto.Items
                var productIds = dto.Items!.Select(i => i.ProductId).ToList();
                var products = await _db.Products
                    .Where(p => productIds.Contains(p.Id))
                    .ToListAsync();

                orderLines = dto.Items!.Select(item =>
                {
                    var product = products.FirstOrDefault(p => p.Id == item.ProductId)
                        ?? throw new KeyNotFoundException($"Sản phẩm #{item.ProductId} không tồn tại.");
                    return (product, item.Quantity, product.Price);
                }).ToList();
            }
            else
            {
                // Cart-based: lấy từ giỏ hàng trên server
                var cartItems = await _db.CartItems
                    .Include(ci => ci.Product)
                    .Where(ci => ci.UserId == buyerId)
                    .ToListAsync();

                if (!cartItems.Any())
                    throw new InvalidOperationException("Giỏ hàng trống.");

                orderLines = cartItems.Select(ci =>
                    (ci.Product, ci.Quantity, ci.PriceSnapshot)
                ).ToList();
            }

            // Kiểm tra địa chỉ
            var address = await _db.UserAddresses
                .FirstOrDefaultAsync(a => a.Id == dto.ShippingAddressId && a.UserId == buyerId)
                ?? throw new KeyNotFoundException("Địa chỉ giao hàng không tồn tại.");

            // Kiểm tra tồn kho cho tất cả sản phẩm
            foreach (var (product, quantity, _) in orderLines)
            {
                if (quantity > product.AvailableItemCount)
                    throw new InvalidOperationException($"Sản phẩm '{product.Name}' chỉ còn {product.AvailableItemCount} đơn vị.");
                if (!product.IsActive || product.IsLocked)
                    throw new InvalidOperationException($"Sản phẩm '{product.Name}' không khả dụng.");
            }

            // Tạo đơn hàng
            var order = new Order
            {
                OrderNumber = "GC-" + DateTime.UtcNow.Ticks.ToString()[^10..],
                BuyerId = buyerId,
                ShippingAddressId = dto.ShippingAddressId,
                Status = OrderStatus.Pending,
                TotalAmount = orderLines.Sum(ol => ol.PriceSnapshot * ol.Quantity),
                Note = dto.Note
            };

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            // Tạo OrderItems + trừ kho
            foreach (var (product, quantity, priceSnapshot) in orderLines)
            {
                _db.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductId = product.Id,
                    SellerId = product.SellerId,
                    Quantity = quantity,
                    UnitPrice = priceSnapshot
                });

                // Trừ tồn kho
                product.AvailableItemCount -= quantity;
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

            // Xóa sản phẩm đã mua khỏi giỏ hàng
            var purchasedProductIds = orderLines.Select(ol => ol.Product.Id).ToList();
            var cartItemsToRemove = await _db.CartItems
                .Where(ci => ci.UserId == buyerId && purchasedProductIds.Contains(ci.ProductId))
                .ToListAsync();
            if (cartItemsToRemove.Any())
            {
                _db.CartItems.RemoveRange(cartItemsToRemove);
            }

            await _db.SaveChangesAsync();

            // Thông báo cho Seller(s)
            var sellerIds = orderLines.Select(ol => ol.Product.SellerId).Distinct();
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
            var order = await _db.Orders.Include(o => o.OrderItems).Include(o => o.Shipment).Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            if (!order.OrderItems.Any(oi => oi.SellerId == sellerId))
                throw new UnauthorizedAccessException("Bạn không có quyền.");

            if (order.Shipment != null)
                throw new InvalidOperationException("Đơn hàng đã có thông tin vận chuyển.");

            OrderBusinessRules.EnsureSellerCanFulfill(order.Payment);

            if (order.Status is OrderStatus.Canceled or OrderStatus.Complete)
                throw new InvalidOperationException("Không thể tạo vận đơn cho đơn đã hủy/hoàn tất.");

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
                Status = order.Status,
                Note = "Seller đã tạo vận đơn. Chờ shipper nhận giao."
            });

            await _db.SaveChangesAsync();

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipment.Id,
                Status = ShipmentStatus.Pending,
                Note = "Vận đơn chờ shipper nhận."
            });
            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(order.BuyerId,
                $"Đơn hàng #{order.OrderNumber} đã được đóng gói, chờ shipper giao.");

            return MapShipmentDto(shipment);
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
                return true;
            }

            throw new InvalidOperationException($"Seller không thể chuyển vận đơn sang trạng thái: {newStatus}");
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
