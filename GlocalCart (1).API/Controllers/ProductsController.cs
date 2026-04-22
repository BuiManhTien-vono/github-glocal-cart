using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using GlocalCart.API.DTOs.Products;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly IProductService _productService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public ProductsController(IProductService productService) { _productService = productService; }

        /// <summary>
        /// Lấy danh sách sản phẩm (Public - tìm kiếm, lọc, phân trang)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetProducts([FromQuery] ProductSearchDto search) =>
            Ok(await _productService.GetProductsAsync(search));

        /// <summary>
        /// Chi tiết sản phẩm (Public)
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetProduct(int id) => Ok(await _productService.GetProductByIdAsync(id));

        /// <summary>
        /// Tìm kiếm sản phẩm theo tên hoặc danh mục (UML Search interface)
        /// </summary>
        [HttpGet("search")]
        public async Task<IActionResult> SearchProducts(
            [FromQuery] string? name, [FromQuery] int? categoryId,
            [FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(await _productService.SearchProductsAsync(name, categoryId, page, pageSize));

        /// <summary>
        /// Seller đăng sản phẩm mới
        /// </summary>
        [HttpPost]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> CreateProduct([FromBody] CreateProductDto dto) =>
            Ok(await _productService.CreateProductAsync(UserId, dto));

        /// <summary>
        /// Seller cập nhật sản phẩm
        /// </summary>
        [HttpPut("{id}")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateProduct(int id, [FromBody] UpdateProductDto dto) =>
            Ok(await _productService.UpdateProductAsync(UserId, id, dto));

        /// <summary>
        /// Seller ẩn/hiện sản phẩm
        /// </summary>
        [HttpPatch("{id}/visibility")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> ToggleVisibility(int id)
        {
            await _productService.ToggleVisibilityAsync(UserId, id);
            return Ok(new { success = true, message = "Đã cập nhật trạng thái hiển thị." });
        }

        /// <summary>
        /// Seller cập nhật tồn kho
        /// </summary>
        [HttpPut("{id}/stock")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateStock(int id, [FromBody] UpdateStockDto dto)
        {
            await _productService.UpdateStockAsync(UserId, id, dto.AvailableItemCount);
            return Ok(new { success = true, message = "Đã cập nhật tồn kho." });
        }

        /// <summary>
        /// Seller xem danh sách sản phẩm của mình
        /// </summary>
        [HttpGet("my-products")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> GetMyProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20) =>
            Ok(await _productService.GetMyProductsAsync(UserId, page, pageSize));
    }
}
