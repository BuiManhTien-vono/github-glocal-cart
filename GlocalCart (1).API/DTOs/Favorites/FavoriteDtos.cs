using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.DTOs.Favorites
{
    public class AddFavoriteDto
    {
        [Required]
        public int ProductId { get; set; }
    }
}
