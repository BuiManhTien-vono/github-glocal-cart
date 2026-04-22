using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng CreditCards - Thẻ tín dụng mô phỏng (CreditCard trong UML)
    /// </summary>
    public class CreditCard
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required, MaxLength(150)]
        public string NameOnCard { get; set; } = string.Empty;

        /// <summary>
        /// Số thẻ (chỉ lưu 4 số cuối, phần còn lại mask)
        /// </summary>
        [Required, MaxLength(20)]
        public string CardNumberMasked { get; set; } = string.Empty;

        /// <summary>
        /// Mã bảo mật (mô phỏng, lưu mã hóa)
        /// </summary>
        [Required, MaxLength(10)]
        public string CodeEncrypted { get; set; } = string.Empty;

        // Billing Address (theo UML)
        [MaxLength(300)]
        public string? BillingStreet { get; set; }

        [MaxLength(100)]
        public string? BillingCity { get; set; }

        [MaxLength(100)]
        public string? BillingState { get; set; }

        [MaxLength(20)]
        public string? BillingZip { get; set; }

        [MaxLength(100)]
        public string? BillingCountry { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }
}
