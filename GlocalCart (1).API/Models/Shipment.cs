using System.ComponentModel.DataAnnotations;
using GlocalCart.API.Enums;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Shipments - Vận chuyển đơn hàng (Shipment trong UML)
    /// Quan hệ 1-1 với Order, 1-N với ShipmentLog
    /// </summary>
    public class Shipment
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        /// <summary>
        /// Ngày gửi hàng (theo UML: shipmentDate: date)
        /// </summary>
        public DateTime? ShipmentDate { get; set; }

        /// <summary>
        /// Ngày dự kiến giao (theo UML: estimatedArrival: date)
        /// </summary>
        public DateTime? EstimatedArrival { get; set; }

        /// <summary>
        /// Phương thức vận chuyển (theo UML: shipmentMethod: string)
        /// </summary>
        [MaxLength(100)]
        public string? ShipmentMethod { get; set; }

        /// <summary>
        /// Mã theo dõi vận chuyển
        /// </summary>
        [MaxLength(100)]
        public string? TrackingNumber { get; set; }

        /// <summary>
        /// Trạng thái hiện tại của vận đơn
        /// </summary>
        public ShipmentStatus Status { get; set; } = ShipmentStatus.Pending;

        /// <summary>
        /// Shipper đã nhận đơn (null = chưa có shipper nhận)
        /// </summary>
        public int? ShipperId { get; set; }

        public DateTime? AssignedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Order Order { get; set; } = null!;
        public User? Shipper { get; set; }
        public ICollection<ShipmentLog> ShipmentLogs { get; set; } = new List<ShipmentLog>();
    }
}
