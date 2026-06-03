using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using GlocalCart.API.Helpers;
using GlocalCart.API.DTOs.Products;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly IProductService _productService;
        private readonly IAdminService _adminService;

        public CategoriesController(IProductService productService, IAdminService adminService)
        {
            _productService = productService;
            _adminService = adminService;
        }

        /// <summary>
        /// Lấy danh sách danh mục phân cấp (Public)
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetCategories() =>
            Ok(ApiResponse.Ok(await _productService.GetCategoriesAsync()));

        [HttpPost]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            var category = await _adminService.CreateCategoryAsync(dto);
            return Ok(ApiResponse.Created(category, "Tao danh muc thanh cong."));
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CreateCategoryDto dto)
        {
            await _adminService.UpdateCategoryAsync(id, dto);
            return Ok(ApiResponse.Ok("Cap nhat danh muc thanh cong."));
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Seller,Admin")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            await _adminService.DeleteCategoryAsync(id);
            return Ok(ApiResponse.Ok("Xoa danh muc thanh cong."));
        }
    }
}
