using GlocalCart.API.DTOs.Products;
using GlocalCart.API.Helpers;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IProductService
    {
        // Public
        Task<PagedResult<ProductResponseDto>> GetProductsAsync(ProductSearchDto search);
        Task<ProductResponseDto> GetProductByIdAsync(int id);
        Task<List<CategoryDto>> GetCategoriesAsync();
        Task<PagedResult<ProductResponseDto>> SearchProductsAsync(string? name, int? categoryId, int page, int pageSize);

        // Seller
        Task<ProductResponseDto> CreateProductAsync(int sellerId, CreateProductDto dto);
        Task<ProductResponseDto> CreateProductWithImagesAsync(int sellerId, CreateProductWithImagesDto dto);
        Task<ProductResponseDto> UpdateProductAsync(int sellerId, int productId, UpdateProductDto dto, bool isAdmin = false);
        Task<bool> ToggleVisibilityAsync(int sellerId, int productId, bool isAdmin = false);
        Task<bool> UpdateStockAsync(int sellerId, int productId, int newStock, bool isAdmin = false);
        Task<PagedResult<ProductResponseDto>> GetMyProductsAsync(int sellerId, int page, int pageSize, bool isAdmin = false);

        // Image
        Task<(byte[] Data, string ContentType)?> GetProductImageDataAsync(int imageId);
    }
}
