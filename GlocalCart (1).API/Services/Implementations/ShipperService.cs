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
                    && s.Order.Status != OrderStatus.Canceled
                    && s.Order.Status != OrderStatus.Complete
                    && (s.Order.Payment == null
                        || s.Order.Payment.Method == PaymentMethod.CreditCard
                        || s.Order.Payment.Status == PaymentStatus.Completed))
                .OrderBy(s => s.CreatedAt);

            return await ToShipmentPageAsync(query, page, pageSize);
        }

        public async Task<PagedResult<ShipperShipmentDto>> GetMyShipmentsAsync(int shipperId, int page, int pageSize)
        {
            var query = QueryShipments()
                .Where(s => s.ShipperId == shipperId && s.Status == ShipmentStatus.Shipped)
                .OrderByDescending(s => s.AssignedAt);

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
            var shipment = await QueryShipments()
                .FirstOrDefaultAsync(s => s.Id == shipmentId)
                ?? throw new KeyNotFoundException("Không tìm thấy vận đơn.");

            if (shipment.ShipperId != null)
                throw new InvalidOperationException("Vận đơn đã được shipper khác nhận.");

            if (shipment.Status != ShipmentStatus.Pending)
                throw new InvalidOperationException("Vận đơn không ở trạng thái chờ nhận.");

            OrderBusinessRules.EnsureSellerCanFulfill(shipment.Order.Payment);

            if (shipment.Order.Status is OrderStatus.Canceled or OrderStatus.Complete)
                throw new InvalidOperationException("Đơn hàng không thể nhận giao.");

            var shipper = await _db.Users.FindAsync(shipperId)
                ?? throw new KeyNotFoundException("Shipper không tồn tại.");

            shipment.ShipperId = shipperId;
            shipment.Status = ShipmentStatus.Shipped;
            shipment.AssignedAt = DateTime.UtcNow;

            shipment.Order.Status = OrderStatus.Shipped;

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipmentId,
                Status = ShipmentStatus.Shipped,
                Note = note ?? $"Shipper {shipper.FullName} đã nhận đơn giao."
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = shipment.OrderId,
                Status = OrderStatus.Shipped,
                Note = $"Shipper {shipper.FullName} đã nhận giao hàng."
            });

            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(shipment.Order.BuyerId,
                $"Đơn #{shipment.Order.OrderNumber} đang được giao bởi {shipper.FullName}.");

            var sellerIds = shipment.Order.OrderItems.Select(oi => oi.SellerId).Distinct();
            foreach (var sellerId in sellerIds)
                await _notif.CreateNotificationAsync(sellerId,
                    $"Shipper đã nhận giao đơn #{shipment.Order.OrderNumber}.");

            return MapToDto(shipment);
        }

        public async Task<ShipperShipmentDto> ConfirmDeliveredAsync(int shipperId, int shipmentId, string? note)
        {
            var shipment = await QueryShipments()
                .FirstOrDefaultAsync(s => s.Id == shipmentId)
                ?? throw new KeyNotFoundException("Không tìm thấy vận đơn.");

            if (shipment.ShipperId != shipperId)
                throw new UnauthorizedAccessException("Bạn không phải shipper của vận đơn này.");

            if (shipment.Status != ShipmentStatus.Shipped)
                throw new InvalidOperationException("Chỉ có thể xác nhận giao khi đang vận chuyển.");

            shipment.Status = ShipmentStatus.Delivered;
            shipment.DeliveredAt = DateTime.UtcNow;
            shipment.Order.Status = OrderStatus.Complete;

            var payment = shipment.Order.Payment;
            if (payment != null && payment.Method == PaymentMethod.CreditCard && payment.Status == PaymentStatus.Unpaid)
            {
                payment.Status = PaymentStatus.Completed;
                payment.TransactionRef ??= "COD-" + Guid.NewGuid().ToString("N")[..10].ToUpper();
                payment.UpdatedAt = DateTime.UtcNow;
            }

            _db.ShipmentLogs.Add(new ShipmentLog
            {
                ShipmentId = shipmentId,
                Status = ShipmentStatus.Delivered,
                Note = note ?? "Giao hàng thành công."
            });

            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = shipment.OrderId,
                Status = OrderStatus.Complete,
                Note = note ?? "Đã giao hàng thành công."
            });

            await _db.SaveChangesAsync();

            await _notif.CreateNotificationAsync(shipment.Order.BuyerId,
                $"Đơn hàng #{shipment.Order.OrderNumber} đã giao thành công!");

            return MapToDto(shipment);
        }

        private IQueryable<Shipment> QueryShipments() =>
            _db.Shipments
                .Include(s => s.Order).ThenInclude(o => o.Buyer)
                .Include(s => s.Order).ThenInclude(o => o.ShippingAddress)
                .Include(s => s.Order).ThenInclude(o => o.Payment)
                .Include(s => s.Order).ThenInclude(o => o.OrderItems)
                .Include(s => s.Shipper);

        private static ShipperShipmentDto MapToDto(Shipment s)
        {
            var addr = s.Order.ShippingAddress;
            return new ShipperShipmentDto
            {
                ShipmentId = s.Id,
                OrderId = s.OrderId,
                OrderNumber = s.Order.OrderNumber,
                OrderStatus = s.Order.Status.ToString(),
                ShipmentStatus = s.Status.ToString(),
                TotalAmount = s.Order.TotalAmount,
                TrackingNumber = s.TrackingNumber,
                ShipmentMethod = s.ShipmentMethod,
                ShipmentDate = s.ShipmentDate,
                EstimatedArrival = s.EstimatedArrival,
                AssignedAt = s.AssignedAt,
                BuyerName = s.Order.Buyer.FullName,
                BuyerPhone = s.Order.Buyer.PhoneNumber ?? "",
                DeliveryAddress = $"{addr.StreetAddress}, {addr.City}, {addr.State}, {addr.Country}",
                ShipperName = s.Shipper?.FullName
            };
        }
    }
}
