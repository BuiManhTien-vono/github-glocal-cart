using System.ComponentModel.DataAnnotations;
using GlocalCart.API.Enums;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Users - Tài khoản người dùng (Account trong UML)
    /// Hỗ trợ đa vai trò: Member (Buyer), Seller, Admin
    /// </summary>
    public class User
    {
        public int Id { get; set; }

        [Required, MaxLength(100)]
        public string UserName { get; set; } = string.Empty;

        [Required, MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required, MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Phone { get; set; }

        public UserRole Role { get; set; } = UserRole.Member;

        /// <summary>
        /// Cho biết Member đã kích hoạt vai trò Seller chưa
        /// </summary>
        public bool IsSeller { get; set; } = false;

        /// <summary>
        /// Trạng thái tài khoản chi tiết theo UML (Active, Blocked, Banned...)
        /// </summary>
        public AccountStatus AccountStatus { get; set; } = AccountStatus.Active;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public ICollection<UserAddress> Addresses { get; set; } = new List<UserAddress>();
        public ICollection<CreditCard> CreditCards { get; set; } = new List<CreditCard>();
        public ICollection<BankAccount> BankAccounts { get; set; } = new List<BankAccount>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
        public ICollection<Order> Orders { get; set; } = new List<Order>();
        public ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();
        public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    }
}
