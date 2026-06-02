using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Admin;
using GlocalCart.API.DTOs.Orders;
using GlocalCart.API.DTOs.Products;
using GlocalCart.API.Enums;
using GlocalCart.API.Helpers;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace GlocalCart.API.Services.Implementations
{
    public class AdminService : IAdminService
    {
        private readonly AppDbContext _db;
        private readonly UserManager<User> _userManager;

        public AdminService(AppDbContext db, UserManager<User> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public async Task<AdminCategoryDto> CreateCategoryAsync(CreateCategoryDto dto)
        {
            var category = new Category
            {
                Name = dto.Name,
                Description = dto.Description,
                ParentCategoryId = dto.ParentCategoryId
            };

            _db.Categories.Add(category);
            await _db.SaveChangesAsync();

            return new AdminCategoryDto
            {
                Id = category.Id,
                Name = category.Name,
                Description = category.Description,
                ParentCategoryId = category.ParentCategoryId
            };
        }

        public async Task UpdateCategoryAsync(int id, CreateCategoryDto dto)
        {
            var category = await _db.Categories.FindAsync(id)
                ?? throw new KeyNotFoundException("Danh muc khong ton tai.");

            category.Name = dto.Name;
            category.Description = dto.Description;
            if (dto.ParentCategoryId.HasValue)
            {
                category.ParentCategoryId = dto.ParentCategoryId;
            }

            await _db.SaveChangesAsync();
        }

        public async Task DeleteCategoryAsync(int id)
        {
            var category = await _db.Categories.FindAsync(id)
                ?? throw new KeyNotFoundException("Danh muc khong ton tai.");

            if (await _db.Products.AnyAsync(p => p.CategoryId == id))
            {
                throw new InvalidOperationException("Khong the xoa danh muc dang co san pham.");
            }

            _db.Categories.Remove(category);
            await _db.SaveChangesAsync();
        }

        public async Task<PagedResult<AdminUserDto>> GetUsersAsync(int page, int pageSize)
        {
            return await _db.Users
                .AsNoTracking()
                .OrderByDescending(u => u.CreatedAt)
                .Select(u => new AdminUserDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    FullName = u.FullName,
                    Phone = u.PhoneNumber,
                    Role = u.Role.ToString(),
                    IsSeller = u.IsSeller,
                    AccountStatus = u.AccountStatus.ToString(),
                    CreatedAt = u.CreatedAt
                })
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<string> UpdateUserStatusAsync(int id, UpdateAccountStatusDto dto)
        {
            var user = await _db.Users.FindAsync(id)
                ?? throw new KeyNotFoundException("Khong tim thay nguoi dung.");

            if (!Enum.TryParse<AccountStatus>(dto.Status, true, out var status))
            {
                throw new ArgumentException("Trang thai khong hop le.");
            }

            user.AccountStatus = status;
            user.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return $"Da cap nhat trang thai tai khoan: {status}";
        }

        public async Task<string> ToggleSellerAsync(int id)
        {
            var user = await _userManager.FindByIdAsync(id.ToString())
                ?? throw new KeyNotFoundException("Khong tim thay nguoi dung.");

            user.IsSeller = !user.IsSeller;
            user.Role = user.IsSeller ? UserRole.Seller : UserRole.Member;
            user.UpdatedAt = DateTime.UtcNow;

            if (user.IsSeller)
            {
                await _userManager.AddToRoleAsync(user, "Seller");
            }
            else
            {
                await _userManager.RemoveFromRoleAsync(user, "Seller");
            }

            await _userManager.UpdateAsync(user);

            return user.IsSeller ? "Da duyet Seller." : "Da thu hoi Seller.";
        }

        public async Task<PagedResult<ProductResponseDto>> GetAllProductsAsync(int page, int pageSize)
        {
            return await _db.Products
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
        }

        public async Task<string> ToggleProductLockAsync(int id)
        {
            var product = await _db.Products.FindAsync(id)
                ?? throw new KeyNotFoundException("San pham khong ton tai.");

            product.IsLocked = !product.IsLocked;
            product.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            return product.IsLocked ? "Da khoa san pham." : "Da mo khoa san pham.";
        }

        public async Task<PagedResult<AdminOrderDto>> GetAllOrdersAsync(int page, int pageSize)
        {
            return await _db.Orders
                .AsNoTracking()
                .Include(o => o.Buyer)
                .Include(o => o.Payment)
                .Include(o => o.Shipment)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product).ThenInclude(p => p.Category)
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Seller)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new AdminOrderDto
                {
                    Id = o.Id,
                    OrderNumber = o.OrderNumber,
                    Status = o.Status.ToString(),
                    OrderDate = o.OrderDate,
                    TotalAmount = o.TotalAmount,
                    ShippingFee = o.ShippingFee,
                    BuyerName = o.Buyer.FullName,
                    BuyerEmail = o.Buyer.Email,
                    PaymentStatus = o.Payment != null ? o.Payment.Status.ToString() : "N/A",
                    Payment = o.Payment != null
                        ? new AdminOrderPaymentDto
                        {
                            Method = o.Payment.Method.ToString(),
                            Status = o.Payment.Status.ToString(),
                            Amount = o.Payment.Amount,
                            TransactionRef = o.Payment.TransactionRef
                        }
                        : null,
                    Shipment = o.Shipment != null
                        ? new AdminOrderShipmentDto
                        {
                            Status = o.Shipment.Status.ToString(),
                            DeliveredAt = o.Shipment.DeliveredAt
                        }
                        : null,
                    Items = o.OrderItems.Select(oi => new AdminOrderItemDto
                    {
                        Id = oi.Id,
                        ProductId = oi.ProductId,
                        ProductName = oi.Product.Name,
                        SellerId = oi.SellerId,
                        SellerName = oi.Seller.FullName,
                        CategoryName = oi.Product.Category != null ? oi.Product.Category.Name : null,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        Subtotal = oi.UnitPrice * oi.Quantity
                    }).ToList()
                })
                .ToPagedResultAsync(page, pageSize);
        }

        public async Task<string> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto dto)
        {
            var order = await _db.Orders
                .Include(o => o.OrderItems).ThenInclude(oi => oi.Product)
                .Include(o => o.Payment)
                .Include(o => o.Shipment)
                .FirstOrDefaultAsync(o => o.Id == id)
                ?? throw new KeyNotFoundException("Khong tim thay don hang.");

            if (!Enum.TryParse<OrderStatus>(dto.Status, true, out var newStatus))
            {
                throw new ArgumentException("Trang thai khong hop le.");
            }

            if (newStatus == OrderStatus.Canceled && order.Status != OrderStatus.Canceled)
            {
                if (!IsDeliveredOrComplete(order))
                    RestoreOrderStock(order);

                CancelActiveShipment(order.Shipment);
                CancelOrRefundPayment(order.Payment);
            }
            else if (newStatus == OrderStatus.Complete)
            {
                CompletePayment(order.Payment);
            }

            SyncShipmentForOrderStatus(order, newStatus);
            order.Status = newStatus;
            _db.OrderLogs.Add(new OrderLog
            {
                OrderId = id,
                Status = newStatus,
                Note = dto.Note ?? "Admin cap nhat."
            });

            await _db.SaveChangesAsync();

            return $"Da cap nhat trang thai: {newStatus}";
        }

        public async Task<AdminDashboardDto> GetDashboardAsync()
        {
            var completedRevenueOrders = _db.Orders
                .Where(o => o.Status == OrderStatus.Complete
                    && o.Payment != null
                    && o.Payment.Status == PaymentStatus.Completed);

            return new AdminDashboardDto
            {
                TotalUsers = await _db.Users.CountAsync(),
                TotalSellers = await _db.Users.CountAsync(u => u.IsSeller),
                TotalProducts = await _db.Products.CountAsync(),
                TotalOrders = await _db.Orders.CountAsync(),
                TotalRevenue = await completedRevenueOrders.SumAsync(o => o.TotalAmount),
                ProductRevenue = await _db.OrderItems
                    .Where(oi => oi.Order.Status == OrderStatus.Complete
                        && oi.Order.Payment != null
                        && oi.Order.Payment.Status == PaymentStatus.Completed)
                    .SumAsync(oi => oi.UnitPrice * oi.Quantity),
                ShippingRevenue = await completedRevenueOrders.SumAsync(o => o.ShippingFee),
                CompletedOrders = await completedRevenueOrders.CountAsync(),
                PendingOrders = await _db.Orders.CountAsync(o => o.Status == OrderStatus.Pending)
            };
        }

        public async Task<AdminRevenueDto> GetRevenueAsync(int days)
        {
            var start = days > 0 ? DateTime.UtcNow.Date.AddDays(-days + 1) : (DateTime?)null;
            var revenueOrders = _db.Orders
                .Where(o => o.Status == OrderStatus.Complete
                    && o.Payment != null
                    && o.Payment.Status == PaymentStatus.Completed);

            if (start.HasValue)
            {
                revenueOrders = revenueOrders.Where(o => o.OrderDate >= start.Value);
            }

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
                .Select(g => new AdminRevenueBreakdownDto
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
                .Select(g => new AdminRevenueBreakdownDto
                {
                    Name = g.Key,
                    Quantity = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.UnitPrice * oi.Quantity)
                })
                .OrderByDescending(x => x.Revenue)
                .Take(8)
                .ToListAsync();

            return new AdminRevenueDto
            {
                TotalRevenue = totalRevenue,
                TotalOrders = totalOrders,
                TotalItems = totalItems,
                AverageOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0,
                ByCategory = byCategory,
                ByProduct = byProduct
            };
        }

        private static bool IsDeliveredOrComplete(Order order)
        {
            return order.Status == OrderStatus.Complete
                || order.Shipment?.Status == ShipmentStatus.Delivered;
        }

        private static void RestoreOrderStock(Order order)
        {
            foreach (var item in order.OrderItems)
            {
                item.Product.AvailableItemCount += item.Quantity;
            }
        }

        private static void CancelActiveShipment(Shipment? shipment)
        {
            if (shipment == null || shipment.Status == ShipmentStatus.Delivered)
                return;

            shipment.Status = ShipmentStatus.OnHold;
        }

        private static void CancelOrRefundPayment(Payment? payment)
        {
            if (payment == null)
                return;

            payment.Status = payment.Status == PaymentStatus.Completed
                ? PaymentStatus.Refunded
                : PaymentStatus.Canceled;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        private static void CompletePayment(Payment? payment)
        {
            if (payment == null)
                return;

            payment.Status = PaymentStatus.Completed;
            payment.UpdatedAt = DateTime.UtcNow;
        }

        private static void SyncShipmentForOrderStatus(Order order, OrderStatus newStatus)
        {
            if (order.Shipment == null)
                return;

            var now = DateTime.UtcNow;
            if (newStatus == OrderStatus.Shipped && order.Shipment.Status != ShipmentStatus.Delivered)
            {
                order.Shipment.Status = ShipmentStatus.Shipped;
                order.Shipment.PickedUpAt ??= now;
            }
            else if (newStatus == OrderStatus.Complete)
            {
                order.Shipment.Status = ShipmentStatus.Delivered;
                order.Shipment.DeliveredAt ??= now;
            }
        }
    }
}
