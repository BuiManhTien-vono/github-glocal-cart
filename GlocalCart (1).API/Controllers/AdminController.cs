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
            return Ok(ApiResponse.Created(new { category.Id, category.Name, category.Description, category.ParentCategoryId }, "Tạo danh mục thành công."));
        }

        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CreateCategoryDto dto)
        {
            var category = await _db.Categories.FindAsync(id) ?? throw new KeyNotFoundException("Danh mục không tồn tại.");
            category.Name = dto.Name;
            category.Description = dto.Description;
            if (dto.ParentCategoryId.HasValue) category.ParentCategoryId = dto.ParentCategoryId;
            await _db.SaveChangesAsync();
            return Ok(ApiResponse.Ok("Cập nhật danh mục thành công."));
        }

        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var category = await _db.Categories.FindAsync(id) ?? throw new KeyNotFoundException("Danh mục không tồn tại.");
            if (await _db.Products.AnyAsync(p => p.CategoryId == id))
                throw new InvalidOperationException("Không thể xóa danh mục đang có sản phẩm.");
            _db.Categories.Remove(category);
            await _db.SaveChangesAsync();
            return Ok(ApiResponse.Ok("Xóa danh mục thành công."));
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
            return Ok(ApiResponse.Ok(result));
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
            return Ok(ApiResponse.Ok($"Đã cập nhật trạng thái tài khoản: {status}"));
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
            return Ok(ApiResponse.Ok(user.IsSeller ? "Đã duyệt Seller." : "Đã thu hồi Seller."));
        }

        // === PRODUCTS ===
        [HttpGet("products")]
        public async Task<IActionResult> GetAllProducts([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _db.Products
                .AsNoTracking()
                .Include(p => p.Seller)
                .Include(p => p.Category)
                .Include(p => p.Images)
                .Include(p => p.Reviews)
                .OrderByDescending(p => p.CreatedAt)
                .Select(p => new ProductResponseDto
                {
                    Id = p.Id,
                    SellerId = p.SellerId,
                    SellerName = p.Seller.FullName,
                    CategoryId = p.CategoryId,
                    CategoryName = p.Category.Name,
                    Name = p.Name,
                    Description = p.Description,
                    Price = p.Price,
                    AvailableItemCount = p.AvailableItemCount,
                    IsActive = p.IsActive,
                    IsLocked = p.IsLocked,
                    MediaUrl = p.MediaUrl,
                    CreatedAt = p.CreatedAt,
                    Images = p.Images.OrderBy(i => i.DisplayOrder).Select(i => new ProductImageDto
                    {
                        Id = i.Id,
                        ImageUrl = i.ImageUrl,
                        DisplayOrder = i.DisplayOrder,
                        IsMain = i.IsMain,
                        HasImageData = i.ImageData != null
                    }).ToList(),
                    AverageRating = p.Reviews.Any() ? p.Reviews.Average(r => r.Rating) : 0,
                    ReviewCount = p.Reviews.Count
                })
                .ToPagedResultAsync(page, pageSize);

            return Ok(ApiResponse.Ok(result));
        }

        [HttpPatch("products/{id}/lock")]
        public async Task<IActionResult> ToggleProductLock(int id)
        {
            var product = await _db.Products.FindAsync(id) ?? throw new KeyNotFoundException("Sản phẩm không tồn tại.");
            product.IsLocked = !product.IsLocked;
            product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return Ok(ApiResponse.Ok(product.IsLocked ? "Đã khóa sản phẩm." : "Đã mở khóa sản phẩm."));
        }

        // === ORDERS ===
        [HttpGet("orders")]
        public async Task<IActionResult> GetAllOrders([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
        {
            var result = await _db.Orders
                .Include(o => o.Buyer)
                .Include(o => o.Payment)
                .Include(o => o.Shipment)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ThenInclude(p => p.Category)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Seller)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new
                {
                    o.Id, o.OrderNumber, Status = o.Status.ToString(), o.OrderDate, o.TotalAmount, o.ShippingFee,
                    BuyerName = o.Buyer.FullName, BuyerEmail = o.Buyer.Email,
                    PaymentStatus = o.Payment != null ? o.Payment.Status.ToString() : "N/A",
                    Payment = o.Payment != null ? new
                    {
                        Method = o.Payment.Method.ToString(),
                        Status = o.Payment.Status.ToString(),
                        Amount = o.Payment.Amount,
                        TransactionRef = o.Payment.TransactionRef
                    } : null,
                    Shipment = o.Shipment != null ? new
                    {
                        Status = o.Shipment.Status.ToString(),
                        DeliveredAt = o.Shipment.DeliveredAt
                    } : null,
                    Items = o.OrderItems.Select(oi => new
                    {
                        oi.Id,
                        oi.ProductId,
                        ProductName = oi.Product.Name,
                        SellerId = oi.SellerId,
                        SellerName = oi.Seller.FullName,
                        CategoryName = oi.Product.Category != null ? oi.Product.Category.Name : null,
                        oi.Quantity,
                        oi.UnitPrice,
                        Subtotal = oi.UnitPrice * oi.Quantity
                    }).ToList()
                }).ToPagedResultAsync(page, pageSize);
            return Ok(ApiResponse.Ok(result));
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
            return Ok(ApiResponse.Ok($"Đã cập nhật trạng thái: {newStatus}"));
        }

        // === DASHBOARD ===
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            var totalUsers = await _db.Users.CountAsync();
            var totalSellers = await _db.Users.CountAsync(u => u.IsSeller);
            var totalProducts = await _db.Products.CountAsync();
            var totalOrders = await _db.Orders.CountAsync();
            var completedRevenueOrders = _db.Orders
                .Where(o => o.Status == OrderStatus.Complete
                    && o.Payment != null
                    && o.Payment.Status == PaymentStatus.Completed);
            var totalRevenue = await completedRevenueOrders.SumAsync(o => o.TotalAmount);
            var productRevenue = await _db.OrderItems
                .Where(oi => oi.Order.Status == OrderStatus.Complete
                    && oi.Order.Payment != null
                    && oi.Order.Payment.Status == PaymentStatus.Completed)
                .SumAsync(oi => oi.UnitPrice * oi.Quantity);
            var shippingRevenue = await completedRevenueOrders.SumAsync(o => o.ShippingFee);
            var completedOrders = await completedRevenueOrders.CountAsync();
            var pendingOrders = await _db.Orders.CountAsync(o => o.Status == OrderStatus.Pending);

            return Ok(ApiResponse.Ok(new
            {
                totalUsers, totalSellers, totalProducts, totalOrders,
                totalRevenue, productRevenue, shippingRevenue, completedOrders, pendingOrders
            }));
        }

        [HttpGet("revenue")]
        public async Task<IActionResult> GetRevenue([FromQuery] int days = 30)
        {
            var start = days > 0 ? DateTime.UtcNow.Date.AddDays(-days + 1) : (DateTime?)null;
            var revenueOrders = _db.Orders
                .Where(o => o.Status == OrderStatus.Complete
                    && o.Payment != null
                    && o.Payment.Status == PaymentStatus.Completed);

            if (start.HasValue)
                revenueOrders = revenueOrders.Where(o => o.OrderDate >= start.Value);

            var totalRevenue = await revenueOrders.SumAsync(o => o.TotalAmount);
            var totalOrders = await revenueOrders.CountAsync();
            var totalItems = await _db.OrderItems
                .Where(oi => oi.Order.Status == OrderStatus.Complete
                    && oi.Order.Payment != null
                    && oi.Order.Payment.Status == PaymentStatus.Completed
                    && (!start.HasValue || oi.Order.OrderDate >= start.Value))
                .SumAsync(oi => oi.Quantity);

            var byProduct = await _db.OrderItems
                .Where(oi => oi.Order.Status == OrderStatus.Complete
                    && oi.Order.Payment != null
                    && oi.Order.Payment.Status == PaymentStatus.Completed
                    && (!start.HasValue || oi.Order.OrderDate >= start.Value))
                .GroupBy(oi => new { oi.ProductId, oi.Product.Name })
                .Select(g => new
                {
                    Name = g.Key.Name,
                    Quantity = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.UnitPrice * oi.Quantity)
                })
                .OrderByDescending(x => x.Revenue)
                .Take(8)
                .ToListAsync();

            var byCategory = await _db.OrderItems
                .Where(oi => oi.Order.Status == OrderStatus.Complete
                    && oi.Order.Payment != null
                    && oi.Order.Payment.Status == PaymentStatus.Completed
                    && (!start.HasValue || oi.Order.OrderDate >= start.Value))
                .GroupBy(oi => oi.Product.Category.Name)
                .Select(g => new
                {
                    Name = g.Key,
                    Quantity = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.UnitPrice * oi.Quantity)
                })
                .OrderByDescending(x => x.Revenue)
                .Take(8)
                .ToListAsync();

            return Ok(ApiResponse.Ok(new
            {
                totalRevenue,
                totalOrders,
                totalItems,
                averageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0,
                byCategory,
                byProduct
            }));
        }
    }

    // DTO riêng cho Admin
    public class UpdateAccountStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }
}
