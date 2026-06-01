using GlocalCart.API.DTOs.Shops;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IShopService
    {
        Task<IReadOnlyList<FollowedShopDto>> GetFollowedShopsAsync(int userId);
        Task<IReadOnlyList<SellerSummaryDto>> GetSellersAsync();
        Task FollowShopAsync(int userId, int shopId);
        Task UnfollowShopAsync(int userId, int shopId);
    }
}
