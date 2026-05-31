using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace GlocalCart.API.DTOs.Products
{
    public class ProductResponseDto
    {
        public int Id { get; set; }
        public int SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal Price { get; set; }
        public int AvailableItemCount { get; set; }
        public bool IsActive { get; set; }
        public bool IsLocked { get; set; }
        public string? MediaUrl { get; set; }
        public List<ProductImageDto> Images { get; set; } = new();
        public double AverageRating { get; set; }
        public int ReviewCount { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ProductImageDto
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public bool HasImageData { get; set; }
        public int DisplayOrder { get; set; }
        public bool IsMain { get; set; }
    }

    public class CreateProductDto
    {
        [Required, MaxLength(300)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required, Range(0.01, double.MaxValue)]
        public decimal Price { get; set; }

        [Required, Range(0, int.MaxValue)]
        public int AvailableItemCount { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [MaxLength(500)]
        public string? MediaUrl { get; set; }

        public List<string>? ImageUrls { get; set; }
    }

    /// <summary>
    /// DTO nhận multipart form: thông tin sản phẩm + file ảnh upload
    /// Seller gửi form-data gồm text fields + file ảnh, server sẽ nén sang WebP rồi lưu vào DB
    /// </summary>
    public class CreateProductWithImagesDto
    {
        [Required, MaxLength(300)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Required, Range(0.01, double.MaxValue)]
        public decimal Price { get; set; }

        [Required, Range(0, int.MaxValue)]
        public int AvailableItemCount { get; set; }

        [Required]
        public int CategoryId { get; set; }

        /// <summary>
        /// Danh sách file ảnh upload (JPEG, PNG, WebP) – sẽ nén sang WebP trước khi lưu
        /// </summary>
        public List<IFormFile>? Images { get; set; }
    }

    public class UpdateProductDto
    {
        [MaxLength(300)]
        public string? Name { get; set; }

        [MaxLength(2000)]
        public string? Description { get; set; }

        [Range(0.01, double.MaxValue)]
        public decimal? Price { get; set; }

        [Range(0, int.MaxValue)]
        public int? AvailableItemCount { get; set; }

        public int? CategoryId { get; set; }

        [MaxLength(500)]
        public string? MediaUrl { get; set; }

        public List<string>? ImageUrls { get; set; }
    }

    public class UpdateStockDto
    {
        [Required, Range(0, int.MaxValue)]
        public int AvailableItemCount { get; set; }
    }

    public class ProductSearchDto
    {
        public string? Name { get; set; }
        public int? CategoryId { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class CategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ParentCategoryId { get; set; }
        public bool IsActive { get; set; }
        public List<CategoryDto> SubCategories { get; set; } = new();
    }

    public class CreateCategoryDto
    {
        [Required, MaxLength(200)]
        public string Name { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Description { get; set; }

        public int? ParentCategoryId { get; set; }
    }
}

