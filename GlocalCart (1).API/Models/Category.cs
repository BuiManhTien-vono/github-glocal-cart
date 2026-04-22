using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Categories - Danh mục sản phẩm phân cấp (ProductCategory trong UML)
    /// Hỗ trợ Self-referencing cho danh mục cha-con
    /// </summary>
    public class Category
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        /// <summary>
        /// ID danh mục cha (null nếu là danh mục gốc)
        /// </summary>
        public int? ParentCategoryId { get; set; }

        public bool IsActive { get; set; } = true;

        // Navigation - Self-referencing
        public Category? ParentCategory { get; set; }
        public ICollection<Category> SubCategories { get; set; } = new List<Category>();
        public ICollection<Product> Products { get; set; } = new List<Product>();
    }
}
