using GlocalCart.API.DTOs.Cart;

namespace GlocalCart.API.Services.Interfaces
{
    public interface ICartService
    {
        Task<CartResponseDto> GetCartAsync(int userId);
        Task<CartItemResponseDto> AddToCartAsync(int userId, AddToCartDto dto);
        Task<CartItemResponseDto> UpdateCartItemAsync(int userId, int itemId, UpdateCartItemDto dto);
        Task<bool> RemoveCartItemAsync(int userId, int itemId);
        Task<bool> ClearCartAsync(int userId);
        Task<CartResponseDto> SyncCartAsync(int userId, SyncCartDto dto);
    }
}
