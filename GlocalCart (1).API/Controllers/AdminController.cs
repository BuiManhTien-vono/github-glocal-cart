using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Products;
using GlocalCart.API.DTOs.Orders;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly UserManager<User> _userManager;

        public AdminController(AppDbContext db, UserManager<User> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        // === CATEGORIES ===
        [HttpPost("categories")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
        {
            var category = new Category { Name = dto.Name, Description = dto.Description, ParentCategoryId = dto.ParentCategoryId };
            _db.Categories.Add(category);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, category = new { category.Id, category.Name, category.Description, category.ParentCategoryId } });
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CreateCategoryDto dto)
        {
            var category = await _db.Categories.FindAsync(id) ?? throw new KeyNotFoundException("Danh mục không tồn tại.");
            category.Name = dto.Name;
            category.Description = dto.Description;
            if (dto.ParentCategoryId.HasValue) category.ParentCategoryId = dto.ParentCategoryId;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Cập nhật danh mục thành công." });
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _db.Categories.FindAsync(id) ?? throw new KeyNotFoundException("Danh mục không tồn tại.");
            if (await _db.Products.AnyAsync(p => p.CategoryId == id))
                throw new InvalidOperationException("Không thể xóa danh mục đang có sản phẩm.");
            _db.Categories.Remove(category);
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = "Xóa danh mục thành công." });
        }

        // === USERS ===
        [HttpGet("users")]
        public async Task<IActionResult> GetUsers([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _db.Users
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new
                {
                    u.Id, u.UserName, u.Email, u.FullName, Phone = u.PhoneNumber,
                    Role = u.Role.ToString(), u.IsSeller,
                    AccountStatus = u.AccountStatus.ToString(), u.CreatedAt
                }).ToPagedResultAsync(page, pageSize);
            return Ok(result);
        }

        [HttpPatch("users/{id}/status")]
        public async Task<IActionResult> UpdateUserStatus(int id, [FromBody] UpdateAccountStatusDto dto)
        {
            var user = await _db.Users.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
            if (!Enum.TryParse<AccountStatus>(dto.Status, true, out var status))
                throw new ArgumentException("Trạng thái không hợp lệ.");
            user.AccountStatus = status;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = $"Đã cập nhật trạng thái tài khoản: {status}" });
        }

        [HttpPatch("users/{id}/seller")]
        public async Task<IActionResult> ToggleSeller(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString()) ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
            user.IsSeller = !user.IsSeller;
            user.Role = user.IsSeller ? UserRole.Seller : UserRole.Member;
            user.UpdatedAt = DateTime.UtcNow;

            if (user.IsSeller)
                await _userManager.AddToRoleAsync(user, "Seller");
            else
                await _userManager.RemoveFromRoleAsync(user, "Seller");

            await _userManager.UpdateAsync(user);
            return Ok(new { success = true, message = user.IsSeller ? "Đã duyệt Seller." : "Đã thu hồi Seller." });
        }

        // === PRODUCTS ===
        [HttpPatch("products/{id}/lock")]
        public async Task<IActionResult> ToggleProductLock(int id)
        {
            var product = await _db.Products.FindAsync(id) ?? throw new KeyNotFoundException("Sản phẩm không tồn tại.");
            product.IsLocked = !product.IsLocked;
            product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = product.IsLocked ? "Đã khóa sản phẩm." : "Đã mở khóa sản phẩm." });
        }

        // === ORDERS ===
        [HttpGet("orders")]
        public async Task<IActionResult> GetAllOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _db.Orders
                .Include(o => o.Buyer).Include(o => o.Payment)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.Id, o.OrderNumber, Status = o.Status.ToString(), o.OrderDate, o.TotalAmount,
                    BuyerName = o.Buyer.FullName, BuyerEmail = o.Buyer.Email,
                    PaymentStatus = o.Payment != null ? o.Payment.Status.ToString() : "N/A"
                }).ToPagedResultAsync(page, pageSize);
            return Ok(result);
        }

        [HttpPatch("orders/{id}/status")]
        public async Task<IActionResult> AdminUpdateOrderStatus(int id, [FromBody] UpdateOrderStatusDto dto)
        {
            var order = await _db.Orders.FindAsync(id) ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");
            if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
                throw new ArgumentException("Trạng thái không hợp lệ.");
            order.Status = newStatus;
            _db.OrderLogs.Add(new OrderLog { OrderId = id, Status = newStatus, Note = dto.Note ?? "Admin cập nhật." });
            await _db.SaveChangesAsync();
            return Ok(new { success = true, message = $"Đã cập nhật trạng thái: {newStatus}" });
        }

        // === DASHBOARD ===
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var totalUsers = await _db.Users.CountAsync();
            var totalSellers = await _db.Users.CountAsync(u => u.IsSeller);
            var totalProducts = await _db.Products.CountAsync();
            var totalOrders = await _db.Orders.CountAsync();
            var totalRevenue = await _db.Payments.Where(p => p.Status == PaymentStatus.Completed).SumAsync(p => p.Amount);
            var pendingOrders = await _db.Orders.CountAsync(o => o.Status == OrderStatus.Pending);

            return Ok(new
            {
                totalUsers, totalSellers, totalProducts, totalOrders,
                totalRevenue, pendingOrders
            });
        }
    }

    // DTO riêng cho Admin
    public class UpdateAccountStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
