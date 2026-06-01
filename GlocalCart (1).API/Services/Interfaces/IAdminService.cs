using GlocalCart.API.DTOs.Admin;
using GlocalCart.API.DTOs.Orders;
using GlocalCart.API.DTOs.Products;
using GlocalCart.API.Helpers;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IAdminService
    {
        Task<AdminCategoryDto> CreateCategoryAsync(CreateCategoryDto dto);
        Task UpdateCategoryAsync(int id, CreateCategoryDto dto);
        Task DeleteCategoryAsync(int id);
        Task<PagedResult<AdminUserDto>> GetUsersAsync(int page, int pageSize);
        Task<string> UpdateUserStatusAsync(int id, UpdateAccountStatusDto dto);
        Task<string> ToggleSellerAsync(int id);
        Task<PagedResult<ProductResponseDto>> GetAllProductsAsync(int page, int pageSize);
        Task<string> ToggleProductLockAsync(int id);
        Task<PagedResult<AdminOrderDto>> GetAllOrdersAsync(int page, int pageSize);
        Task<string> UpdateOrderStatusAsync(int id, UpdateOrderStatusDto dto);
        Task<AdminDashboardDto> GetDashboardAsync();
        Task<AdminRevenueDto> GetRevenueAsync(int days);
    }
}
