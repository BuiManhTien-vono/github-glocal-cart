using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Catalogs - Bộ sưu tập sản phẩm (Catalog trong UML)
    /// VD: "Bán chạy", "Khuyến mãi", "Sản phẩm mới"
    /// </summary>
    public class Catalog
    {
        public int Id { get; set; }

        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        public DateTime LastUpdated { get; set; } = DateTime.UtcNow;

        // Navigation - Many-to-Many qua CatalogProduct
        public ICollection<CatalogProduct> CatalogProducts { get; set; } = new List<CatalogProduct>();
    }
}
