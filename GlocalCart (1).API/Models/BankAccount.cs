using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng BankAccounts - Tài khoản ngân hàng mô phỏng (ElectronicBankTransfer trong UML)
    /// </summary>
    public class BankAccount
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required, MaxLength(200)]
        public string BankName { get; set; } = string.Empty;

        [Required, MaxLength(50)]
        public string RoutingNumber { get; set; } = string.Empty;

        /// <summary>
        /// Số tài khoản (chỉ lưu 4 số cuối, phần còn lại mask)
        /// </summary>
        [Required, MaxLength(30)]
        public string AccountNumberMasked { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
    }
}
