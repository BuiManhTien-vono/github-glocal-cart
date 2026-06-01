using GlocalCart.API.DTOs.Favorites;

namespace GlocalCart.API.Services.Interfaces
{
    public interface IFavoriteService
    {
        Task<IReadOnlyList<FavoriteProductDto>> GetFavoritesAsync(int userId);
        Task AddFavoriteAsync(int userId, int productId);
        Task RemoveFavoriteAsync(int userId, int productId);
    }
}
