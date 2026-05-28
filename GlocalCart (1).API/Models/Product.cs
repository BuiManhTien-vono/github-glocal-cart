using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Products - Sản phẩm do Seller đăng bán (Product trong UML)
    /// </summary>
    public class Product
    {
        public int Id { get; set; }

        /// <summary>
        /// ID Seller sở hữu sản phẩm này
        /// </summary>
        public int SellerId { get; set; }

        public int CategoryId { get; set; }

        [Required, MaxLength(300)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        /// <summary>
        /// Giá bán (theo UML: price: double)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        /// <summary>
        /// Số lượng tồn kho hiện có (theo UML: availableItemCount: int)
        /// </summary>
        public int AvailableItemCount { get; set; } = 0;

        /// <summary>
        /// Trạng thái hiển thị (ẩn/hiện sản phẩm)
        /// </summary>
        public bool IsActive { get; set; } = true;

        /// <summary>
        /// Sản phẩm bị Admin khóa do vi phạm
        /// </summary>
        public bool IsLocked { get; set; } = false;

        [MaxLength(500)]
        public string? MediaUrl { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Concurrency token để chống bán lố (overselling)
        /// </summary>
        [Timestamp]
        public byte[] RowVersion { get; set; } = null!;

        // Navigation
        public User Seller { get; set; } = null!;
        public Category Category { get; set; } = null!;
        public ICollection<ProductImage> Images { get; set; } = new List<ProductImage>();
        public ICollection<ProductReview> Reviews { get; set; } = new List<ProductReview>();
        public ICollection<CartItem> CartItems { get; set; } = new List<CartItem>();
        public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
        public ICollection<CatalogProduct> CatalogProducts { get; set; } = new List<CatalogProduct>();
        public ICollection<ProductFavorite> Favorites { get; set; } = new List<ProductFavorite>();
    }
}
