namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng trung gian CatalogProducts - Quan hệ M-N giữa Catalog và Product
    /// </summary>
    public class CatalogProduct
    {
        public int CatalogId { get; set; }
        public int ProductId { get; set; }

        // Navigation
        public Catalog Catalog { get; set; } = null!;
        public Product Product { get; set; } = null!;
    }
}
