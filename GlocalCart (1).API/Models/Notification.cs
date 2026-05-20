using System.ComponentModel.DataAnnotations;
using GlocalCart.API.Enums;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Notifications - Thông báo hệ thống (Notification trong UML)
    /// Hỗ trợ 2 loại: Email và SMS (theo UML subclass)
    /// </summary>
    public class Notification
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        /// <summary>
        /// Loại thông báo (Email / SMS)
        /// </summary>
        public NotificationType Type { get; set; }

        public NotificationAction Action { get; set; } = NotificationAction.General;

        public int? RelatedOrderId { get; set; }

        /// <summary>
        /// Nội dung thông báo (theo UML: content: string)
        /// </summary>
        [Required, MaxLength(1000)]
        public string Content { get; set; } = string.Empty;

        public bool IsRead { get; set; } = false;

        /// <summary>
        /// Thời điểm tạo (theo UML: createdOn: date)
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }
}
