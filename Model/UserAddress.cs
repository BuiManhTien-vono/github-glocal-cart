using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng UserAddresses - Địa chỉ giao hàng (Address dataType trong UML)
    /// Mỗi User có thể có nhiều địa chỉ, 1 địa chỉ mặc định
    /// </summary>
    public class UserAddress
    {
        public int Id { get; set; }

        public int UserId { get; set; }

        [Required, MaxLength(300)]
        public string StreetAddress { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string City { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string State { get; set; } = string.Empty;

        [Required, MaxLength(20)]
        public string Zipcode { get; set; } = string.Empty;

        [Required, MaxLength(100)]
        public string Country { get; set; } = string.Empty;

        public bool IsDefault { get; set; } = false;

        // Navigation
        public User User { get; set; } = null!;
    }
}
