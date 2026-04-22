using System.ComponentModel.DataAnnotations.Schema;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng CartItems - Giỏ hàng (Item trong UML với quantity + price snapshot)
    /// </summary>
    public class CartItem
    {
        public int Id { get; set; }

        public int UserId { get; set; }
        public int ProductId { get; set; }

        /// <summary>
        /// Số lượng sản phẩm trong giỏ (theo UML: quantity: int)
        /// </summary>
        public int Quantity { get; set; } = 1;

        /// <summary>
        /// Snapshot giá tại thời điểm thêm vào giỏ (theo UML: price: double)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal PriceSnapshot { get; set; }

        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public User User { get; set; } = null!;
        public Product Product { get; set; } = null!;
    }
}
