using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Products;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.Processing;

namespace GlocalCart.API.Services.Implementations
{
    public class ProductService : IProductService
    {
        private readonly AppDbContext _db;

        public ProductService(AppDbContext db) { _db = db; }

        public async Task<PagedResult<ProductResponseDto>> GetProductsAsync(ProductSearchDto search)
        {
            var query = _db.Products
                .Include(p => p.Seller).Include(p => p.Category).Include(p => p.Images).Include(p => p.Reviews)
                .Where(p => p.IsActive && !p.IsLocked)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(search.Name))
                query = query.Where(p => p.Name.ToLower().Contains(search.Name.ToLower()));
            if (search.CategoryId.HasValue)
            {
                // Lấy ID của category hiện tại và toàn bộ category con của nó
                var allCategoryIds = await GetCategoryIdsRecursive(search.CategoryId.Value);
                query = query.Where(p => allCategoryIds.Contains(p.CategoryId));
            }
            if (search.MinPrice.HasValue)
                query = query.Where(p => p.Price >= search.MinPrice.Value);
            if (search.MaxPrice.HasValue)
                query = query.Where(p => p.Price <= search.MaxPrice.Value);

            query = query.OrderByDescending(p => p.CreatedAt);

            return await query.Select(p => MapToDto(p)).ToPagedResultAsync(search.Page, search.PageSize);
        }

        public async Task<ProductResponseDto> GetProductByIdAsync(int id)
        {
            var product = await _db.Products
                .Include(p => p.Seller).Include(p => p.Category).Include(p => p.Images).Include(p => p.Reviews)
                .FirstOrDefaultAsync(p => p.Id == id && p.IsActive && !p.IsLocked)
                ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm.");
            return MapToDto(product);
        }

        public async Task<List<CategoryDto>> GetCategoriesAsync()
        {
            var categories = await _db.Categories
                .Where(c => c.ParentCategoryId == null && c.IsActive)
                .Include(c => c.SubCategories)
                .ToListAsync();

            return categories.Select(c => MapCategoryDto(c)).ToList();
        }

        public async Task<PagedResult<ProductResponseDto>> SearchProductsAsync(string? name, int? categoryId, int page, int pageSize)
        {
            var search = new ProductSearchDto { Name = name, CategoryId = categoryId, Page = page, PageSize = pageSize };
            return await GetProductsAsync(search);
        }

        public async Task<ProductResponseDto> CreateProductAsync(int sellerId, CreateProductDto dto)
        {
            var category = await _db.Categories.FindAsync(dto.CategoryId)
                ?? throw new KeyNotFoundException("Danh mục không tồn tại.");

            var product = new Product
            {
                SellerId = sellerId, CategoryId = dto.CategoryId,
                Name = dto.Name, Description = dto.Description,
                Price = dto.Price, AvailableItemCount = dto.AvailableItemCount,
                MediaUrl = dto.MediaUrl, IsActive = true
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            // Thêm ảnh nếu có
            if (dto.ImageUrls?.Any() == true)
            {
                for (int i = 0; i < dto.ImageUrls.Count; i++)
                {
                    _db.ProductImages.Add(new ProductImage
                    {
                        ProductId = product.Id, ImageUrl = dto.ImageUrls[i],
                        DisplayOrder = i, IsMain = i == 0
                    });
                }
                await _db.SaveChangesAsync();
            }

            return await GetProductByIdForOwnerAsync(product.Id);
        }

        /// <summary>
        /// Tạo sản phẩm mới từ multipart form (thông tin + file ảnh).
        /// Nén ảnh sang WebP rồi lưu binary vào DB.
        /// </summary>
        public async Task<ProductResponseDto> CreateProductWithImagesAsync(int sellerId, CreateProductWithImagesDto dto)
        {
            var category = await _db.Categories.FindAsync(dto.CategoryId)
                ?? throw new KeyNotFoundException("Danh mục không tồn tại.");

            var product = new Product
            {
                SellerId = sellerId,
                CategoryId = dto.CategoryId,
                Name = dto.Name,
                Description = dto.Description,
                Price = dto.Price,
                AvailableItemCount = dto.AvailableItemCount,
                IsActive = true
            };

            _db.Products.Add(product);
            await _db.SaveChangesAsync();

            // Nén và lưu từng ảnh vào DB
            if (dto.Images?.Any() == true)
            {
                for (int i = 0; i < dto.Images.Count; i++)
                {
                    var file = dto.Images[i];
                    if (file.Length == 0) continue;

                    var webpData = await CompressToWebpAsync(file);

                    var productImage = new ProductImage
                    {
                        ProductId = product.Id,
                        ImageData = webpData,
                        ContentType = "image/webp",
                        ImageUrl = string.Empty, // Sẽ cập nhật sau khi có Id
                        DisplayOrder = i,
                        IsMain = i == 0
                    };

                    _db.ProductImages.Add(productImage);
                    await _db.SaveChangesAsync();

                    // Cập nhật ImageUrl trỏ đến endpoint serve ảnh từ DB
                    productImage.ImageUrl = $"/api/products/images/{productImage.Id}/data";
                    await _db.SaveChangesAsync();
                }

                // Cập nhật MediaUrl = ảnh chính (ảnh đầu tiên)
                var mainImage = await _db.ProductImages
                    .Where(pi => pi.ProductId == product.Id && pi.IsMain)
                    .FirstOrDefaultAsync();
                if (mainImage != null)
                {
                    product.MediaUrl = mainImage.ImageUrl;
                    await _db.SaveChangesAsync();
                }
            }

            return await GetProductByIdForOwnerAsync(product.Id);
        }

        /// <summary>
        /// Lấy binary ảnh từ DB theo imageId
        /// </summary>
        public async Task<(byte[] Data, string ContentType)?> GetProductImageDataAsync(int imageId)
        {
            var image = await _db.ProductImages
                .Where(pi => pi.Id == imageId && pi.ImageData != null)
                .Select(pi => new { pi.ImageData, pi.ContentType })
                .FirstOrDefaultAsync();

            if (image?.ImageData == null)
                return null;

            return (image.ImageData, image.ContentType ?? "image/webp");
        }

        public async Task<ProductResponseDto> UpdateProductAsync(int sellerId, int productId, UpdateProductDto dto)
        {
            var product = await _db.Products
                .Include(p => p.Images)
                .FirstOrDefaultAsync(p => p.Id == productId && p.SellerId == sellerId)
                ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm hoặc bạn không có quyền.");

            if (dto.Name != null) product.Name = dto.Name;
            if (dto.Description != null) product.Description = dto.Description;
            if (dto.Price.HasValue) product.Price = dto.Price.Value;
            if (dto.AvailableItemCount.HasValue) product.AvailableItemCount = dto.AvailableItemCount.Value;
            if (dto.CategoryId.HasValue) product.CategoryId = dto.CategoryId.Value;
            if (dto.MediaUrl != null) product.MediaUrl = dto.MediaUrl;
            product.UpdatedAt = DateTime.UtcNow;

            // Đồng bộ danh sách ảnh
            if (dto.ImageUrls != null)
            {
                // 1. Xóa những ảnh cũ không còn nằm trong danh sách mới
                var imagesToRemove = product.Images
                    .Where(img => !dto.ImageUrls.Contains(img.ImageUrl))
                    .ToList();
                
                foreach (var img in imagesToRemove)
                {
                    _db.ProductImages.Remove(img);
                }

                // 2. Thêm những ảnh mới hoặc cập nhật thứ tự hiển thị
                for (int i = 0; i < dto.ImageUrls.Count; i++)
                {
                    var url = dto.ImageUrls[i];
                    var existingImg = product.Images.FirstOrDefault(img => img.ImageUrl == url);

                    if (existingImg != null)
                    {
                        existingImg.DisplayOrder = i;
                        existingImg.IsMain = i == 0;
                    }
                    else
                    {
                        _db.ProductImages.Add(new ProductImage
                        {
                            ProductId = product.Id,
                            ImageUrl = url,
                            DisplayOrder = i,
                            IsMain = i == 0
                        });
                    }
                }

                // Tự động cập nhật MediaUrl là ảnh đầu tiên nếu có thay đổi
                if (dto.ImageUrls.Any())
                {
                    product.MediaUrl = dto.ImageUrls[0];
                }
                else
                {
                    product.MediaUrl = null;
                }
            }

            await _db.SaveChangesAsync();
            return await GetProductByIdForOwnerAsync(product.Id);
        }

        public async Task<bool> ToggleVisibilityAsync(int sellerId, int productId)
        {
            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId && p.SellerId == sellerId)
                ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm.");
            product.IsActive = !product.IsActive;
            product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateStockAsync(int sellerId, int productId, int newStock)
        {
            var product = await _db.Products.FirstOrDefaultAsync(p => p.Id == productId && p.SellerId == sellerId)
                ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm.");
            product.AvailableItemCount = newStock;
            product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return true;
        }

        public async Task<PagedResult<ProductResponseDto>> GetMyProductsAsync(int sellerId, int page, int pageSize)
        {
            var query = _db.Products
                .Include(p => p.Seller).Include(p => p.Category).Include(p => p.Images).Include(p => p.Reviews)
                .Where(p => p.SellerId == sellerId)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => MapToDto(p));

            return await query.ToPagedResultAsync(page, pageSize);
        }

        // ============================================================
        // Private Helpers
        // ============================================================

        /// <summary>
        /// Nén ảnh sang WebP, resize nếu quá lớn (max 1200px width)
        /// </summary>
        private static async Task<byte[]> CompressToWebpAsync(IFormFile file)
        {
            using var inputStream = file.OpenReadStream();
            using var image = await Image.LoadAsync(inputStream);

            // Resize nếu ảnh quá rộng
            if (image.Width > 1200)
            {
                var newHeight = (int)((double)1200 / image.Width * image.Height);
                image.Mutate(x => x.Resize(1200, newHeight));
            }

            var encoder = new WebpEncoder
            {
                Quality = 80 // Chất lượng nén 0-100
            };

            using var outputStream = new MemoryStream();
            await image.SaveAsWebpAsync(outputStream, encoder);
            return outputStream.ToArray();
        }

        private static ProductResponseDto MapToDto(Product p) => new()
        {
            Id = p.Id, SellerId = p.SellerId, SellerName = p.Seller.FullName,
            CategoryId = p.CategoryId, CategoryName = p.Category.Name,
            Name = p.Name, Description = p.Description, Price = p.Price,
            AvailableItemCount = p.AvailableItemCount, IsActive = p.IsActive,
            MediaUrl = p.MediaUrl, CreatedAt = p.CreatedAt,
            Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto
            {
                Id = i.Id, ImageUrl = i.ImageUrl, DisplayOrder = i.DisplayOrder,
                IsMain = i.IsMain, HasImageData = i.ImageData != null
            }).ToList(),
            AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0,
            ReviewCount = p.Reviews.Count
        };

        private async Task<ProductResponseDto> GetProductByIdForOwnerAsync(int id)
        {
            var product = await _db.Products
                .Include(p => p.Seller).Include(p => p.Category).Include(p => p.Images).Include(p => p.Reviews)
                .FirstOrDefaultAsync(p => p.Id == id)
                ?? throw new KeyNotFoundException("Không tìm thấy sản phẩm.");

            return MapToDto(product);
        }

        private async Task<List<int>> GetCategoryIdsRecursive(int parentId)
        {
            var all = await _db.Categories.Where(c => c.IsActive).Select(c => new { c.Id, c.ParentCategoryId }).ToListAsync();
            var result = new List<int> { parentId };
            var stack = new Stack<int>();
            stack.Push(parentId);
            
            while (stack.Count > 0)
            {
                var id = stack.Pop();
                var children = all.Where(c => c.ParentCategoryId == id).Select(c => c.Id).ToList();
                foreach (var childId in children)
                {
                    if (!result.Contains(childId))
                    {
                        result.Add(childId);
                        stack.Push(childId);
                    }
                }
            }
            
            Console.WriteLine($"[DEBUG] Category SEARCH: parent {parentId} -> found IDs: {string.Join(",", result)}");
            return result;
        }

        private static CategoryDto MapCategoryDto(Category c) => new()
        {
            Id = c.Id, Name = c.Name, Description = c.Description,
            ParentCategoryId = c.ParentCategoryId, IsActive = c.IsActive,
            SubCategories = c.SubCategories.Where(s => s.IsActive).Select(s => MapCategoryDto(s)).ToList()
        };
    }
}

