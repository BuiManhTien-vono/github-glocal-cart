using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using GlocalCart.API.Enums;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Users - Tài khoản người dùng (Account trong UML)
    /// Kế thừa IdentityUser<int> để tích hợp ASP.NET Identity Framework
    /// Hỗ trợ đa vai trò: Member (Buyer), Seller, Admin
    /// </summary>
    public class User : IdentityUser<int>
    {
        // IdentityUser<int> đã cung cấp sẵn:
        // - int Id
        // - string UserName
        // - string Email
        // - string PasswordHash
        // - string PhoneNumber

        [Required, MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

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
        public ICollection<ProductFavorite> FavoriteProducts { get; set; } = new List<ProductFavorite>();
        public ICollection<ShopFollow> FollowedShops { get; set; } = new List<ShopFollow>();
        public ICollection<ShopFollow> ShopFollowers { get; set; } = new List<ShopFollow>();
    }
}
