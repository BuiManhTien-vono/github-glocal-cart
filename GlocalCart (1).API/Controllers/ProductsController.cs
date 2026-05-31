using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Products;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private bool IsAdmin => User.IsInRole("Admin");

        public ProductsController(IProductService productService) { _productService = productService; }

        /// <summary>
        /// Lấy danh sách sản phẩm (Public - tìm kiếm, lọc, phân trang)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] ProductSearchDto search) =>
            Ok(ApiResponse.Ok(await _productService.GetProductsAsync(search)));

        /// <summary>
        /// Chi tiết sản phẩm (Public)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id) =>
            Ok(ApiResponse.Ok(await _productService.GetProductByIdAsync(id)));

        /// <summary>
        /// Tìm kiếm sản phẩm theo tên hoặc danh mục (UML Search interface)
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchProducts(
            [FromQuery] string? name, [FromQuery] int? categoryId,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _productService.SearchProductsAsync(name, categoryId, page, pageSize)));

        /// <summary>
        /// Seller đăng sản phẩm mới (JSON body - endpoint cũ)
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto) =>
            Ok(ApiResponse.Created(await _productService.CreateProductAsync(UserId, dto), "Đăng sản phẩm thành công."));

        /// <summary>
        /// Seller đăng sản phẩm mới + upload ảnh (multipart form-data).
        /// Ảnh sẽ được nén sang WebP và lưu trực tiếp vào DB.
        /// </summary>
        [HttpPost("with-images")]
        [Authorize(Roles = "Seller,Admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateProductWithImages([FromForm] CreateProductWithImagesDto dto)
        {
            // Validate file ảnh
            if (dto.Images?.Any() == true)
            {
                var allowedMimeTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/webp" };
                foreach (var file in dto.Images)
                {
                    if (file.Length == 0)
                        return BadRequest(ApiResponse.Fail("File ảnh không hợp lệ (rỗng)."));

                    if (Array.IndexOf(allowedMimeTypes, file.ContentType.ToLower()) < 0)
                        return BadRequest(ApiResponse.Fail("Chỉ chấp nhận ảnh JPG, PNG, WEBP."));

                    // Giới hạn kích thước 10MB mỗi ảnh
                    if (file.Length > 10 * 1024 * 1024)
                        return BadRequest(ApiResponse.Fail("Kích thước ảnh tối đa 10MB."));
                }
            }

            var result = await _productService.CreateProductWithImagesAsync(UserId, dto);
            return Ok(ApiResponse.Created(result, "Đăng sản phẩm với ảnh thành công."));
        }

        /// <summary>
        /// Lấy ảnh sản phẩm từ DB (trả binary WebP). Public endpoint.
        /// Client dùng URL: /api/products/images/{imageId}/data
        /// </summary>
        [HttpGet("images/{imageId}/data")]
        [ResponseCache(Duration = 86400)] // Cache 24h vì ảnh ít thay đổi
        public async Task<IActionResult> GetProductImageData(int imageId)
        {
            var result = await _productService.GetProductImageDataAsync(imageId);
            if (result == null)
                return NotFound(ApiResponse.NotFound("Không tìm thấy ảnh."));

            return File(result.Value.Data, result.Value.ContentType);
        }

        /// <summary>
        /// Seller cập nhật sản phẩm
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto) =>
            Ok(ApiResponse.Ok(await _productService.UpdateProductAsync(UserId, id, dto, IsAdmin), "Cập nhật sản phẩm thành công."));

        /// <summary>
        /// Seller ẩn/hiện sản phẩm
        /// </summary>
        [HttpPatch("{id}/visibility")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> ToggleVisibility(int id)
        {
            await _productService.ToggleVisibilityAsync(UserId, id, IsAdmin);
            return Ok(ApiResponse.Ok("Đã cập nhật trạng thái hiển thị."));
        }

        /// <summary>
        /// Seller cập nhật tồn kho
        /// </summary>
        [HttpPut("{id}/stock")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto dto)
        {
            await _productService.UpdateStockAsync(UserId, id, dto.AvailableItemCount, IsAdmin);
            return Ok(ApiResponse.Ok("Đã cập nhật tồn kho."));
        }

        /// <summary>
        /// Seller xem danh sách sản phẩm của mình
        /// </summary>
        [HttpGet("my-products")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> GetMyProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(ApiResponse.Ok(await _productService.GetMyProductsAsync(UserId, page, pageSize, IsAdmin)));
    }
}

