using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng ProductImages - Ảnh sản phẩm (nhiều ảnh/sản phẩm)
    /// </summary>
    public class ProductImage
    {
        public int Id { get; set; }

        public int ProductId { get; set; }

        [Required, MaxLength(500)]
        public string ImageUrl { get; set; } = string.Empty;

        /// <summary>
        /// Dữ liệu ảnh WebP đã nén, lưu trực tiếp trong DB
        /// </summary>
        public byte[]? ImageData { get; set; }

        /// <summary>
        /// MIME type (luôn là image/webp sau khi nén)
        /// </summary>
        [MaxLength(50)]
        public string? ContentType { get; set; }

        public int DisplayOrder { get; set; } = 0;

        public bool IsMain { get; set; } = false;

        // Navigation
        public Product Product { get; set; } = null!;
    }
}
