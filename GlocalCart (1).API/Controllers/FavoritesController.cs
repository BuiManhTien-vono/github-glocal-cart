using System.Security.Claims;
using GlocalCart.API.DTOs.Favorites;
using GlocalCart.API.Helpers;
using GlocalCart.API.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GlocalCart.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FavoritesController : ControllerBase
    {
        private readonly IFavoriteService _favoriteService;
        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public FavoritesController(IFavoriteService favoriteService)
        {
            _favoriteService = favoriteService;
        }

        [HttpGet]
        public async Task<IActionResult> GetFavorites()
        {
            var favorites = await _favoriteService.GetFavoritesAsync(UserId);
            return Ok(ApiResponse.Ok(favorites));
        }

        [HttpPost]
        public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteDto dto)
        {
            await _favoriteService.AddFavoriteAsync(UserId, dto.ProductId);
            return Ok(ApiResponse.Ok("Da them san pham vao yeu thich."));
        }

        [HttpDelete("{productId:int}")]
        public async Task<IActionResult> RemoveFavorite(int productId)
        {
            await _favoriteService.RemoveFavoriteAsync(UserId, productId);
            return Ok(ApiResponse.Ok("Da xoa san pham khoi yeu thich."));
        }
    }
}
