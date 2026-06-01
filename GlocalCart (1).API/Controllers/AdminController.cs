using GlocalCart.API.DTOs.Admin;
using GlocalCart.API.DTOs.Orders;
using GlocalCart.API.DTOs.Products;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly IAdminService _adminService;

        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            var category = await _adminService.CreateCategoryAsync(dto);
            return Ok(ApiResponse.Created(category, "Tao danh muc thanh cong."));
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CreateCategoryDto dto)
        {
            await _adminService.UpdateCategoryAsync(id, dto);
            return Ok(ApiResponse.Ok("Cap nhat danh muc thanh cong."));
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            await _adminService.DeleteCategoryAsync(id);
            return Ok(ApiResponse.Ok("Xoa danh muc thanh cong."));
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _adminService.GetUsersAsync(page, pageSize);
            return Ok(ApiResponse.Ok(result));
        }

        [HttpPatch("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateAccountStatusDto dto)
        {
            var message = await _adminService.UpdateUserStatusAsync(id, dto);
            return Ok(ApiResponse.Ok(message));
        }

        [HttpPatch("users/{id}/seller")]
        public async Task<IActionResult> ToggleSeller(int id)
        {
            var message = await _adminService.ToggleSellerAsync(id);
            return Ok(ApiResponse.Ok(message));
        }

        [HttpGet("products")]
        public async Task<IActionResult> GetAllProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _adminService.GetAllProductsAsync(page, pageSize);
            return Ok(ApiResponse.Ok(result));
        }

        [HttpPatch("products/{id}/lock")]
        public async Task<IActionResult> ToggleProductLock(int id)
        {
            var message = await _adminService.ToggleProductLockAsync(id);
            return Ok(ApiResponse.Ok(message));
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetAllOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _adminService.GetAllOrdersAsync(page, pageSize);
            return Ok(ApiResponse.Ok(result));
        }

        [HttpPatch("orders/{id}/status")]
        public async Task<IActionResult> AdminUpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            var message = await _adminService.UpdateOrderStatusAsync(id, dto);
            return Ok(ApiResponse.Ok(message));
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var dashboard = await _adminService.GetDashboardAsync();
            return Ok(ApiResponse.Ok(dashboard));
        }

        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenue([FromQuery] int days = 30)
        {
            var revenue = await _adminService.GetRevenueAsync(days);
            return Ok(ApiResponse.Ok(revenue));
        }
    }
}
