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

        public int DisplayOrder { get; set; } = 0;

        public bool IsMain { get; set; } = false;

        // Navigation
        public Product Product { get; set; } = null!;
    }
}
