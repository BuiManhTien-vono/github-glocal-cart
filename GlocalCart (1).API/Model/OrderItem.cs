using System.ComponentModel.DataAnnotations.Schema;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng OrderItems - Chi tiết dòng hàng trong đơn
    /// Mỗi OrderItem liên kết với 1 Product và 1 Seller
    /// </summary>
    public class OrderItem
    {
        public int Id { get; set; }

        public int OrderId { get; set; }
        public int ProductId { get; set; }

        /// <summary>
        /// ID Seller sở hữu sản phẩm (để Seller theo dõi đơn hàng)
        /// </summary>
        public int SellerId { get; set; }

        public int Quantity { get; set; }

        /// <summary>
        /// Giá tại thời điểm đặt hàng (snapshot)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal UnitPrice { get; set; }

        // Navigation
        public Order Order { get; set; } = null!;
        public Product Product { get; set; } = null!;
        public User Seller { get; set; } = null!;
    }
}
