using System.ComponentModel.DataAnnotations;
using GlocalCart.API.Enums;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng ShipmentLogs - Lịch sử trạng thái vận chuyển (ShipmentLog trong UML)
    /// </summary>
    public class ShipmentLog
    {
        public int Id { get; set; }

        public int ShipmentId { get; set; }

        /// <summary>
        /// Trạng thái vận chuyển (theo UML: status: ShipmentStatus)
        /// </summary>
        public ShipmentStatus Status { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// Thời điểm ghi log (theo UML: creationDate: date)
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Shipment Shipment { get; set; } = null!;
    }
}
