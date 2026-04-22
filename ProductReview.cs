using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng ProductReviews - Đánh giá sản phẩm (ProductReview trong UML)
    /// Chỉ cho phép đánh giá sau khi đơn hàng Complete/Delivered
    /// </summary>
    public class ProductReview
    {
        public int Id { get; set; }

        public int ProductId { get; set; }
        public int UserId { get; set; }
        public int OrderId { get; set; }

        /// <summary>
        /// Điểm đánh giá 1-5 sao (theo UML: rating: int)
        /// </summary>
        [Range(1, 5)]
        public int Rating { get; set; }

        /// <summary>
        /// Nội dung nhận xét (theo UML: review: string)
        /// </summary>
        [MaxLength(2000)]
        public string? Review { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Product Product { get; set; } = null!;
        public User User { get; set; } = null!;
        public Order Order { get; set; } = null!;
    }
}
