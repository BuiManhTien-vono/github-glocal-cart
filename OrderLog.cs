using System.ComponentModel.DataAnnotations;
using GlocalCart.API.Enums;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng OrderLogs - Lịch sử thay đổi trạng thái đơn hàng (OrderLog trong UML)
    /// Mỗi lần đổi trạng thái đơn -> ghi 1 dòng log (audit trail)
    /// </summary>
    public class OrderLog
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        /// <summary>
        /// Trạng thái tại thời điểm ghi log (theo UML: status: OrderStatus)
        /// </summary>
        public OrderStatus Status { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        /// <summary>
        /// Thời điểm ghi log (theo UML: creationDate: date)
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Order Order { get; set; } = null!;
    }
}
