namespace GlocalCart.API.DTOs.Favorites
{
    public class FavoriteProductDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string? MediaUrl { get; set; }
        public List<string> ImageUrls { get; set; } = new();
        public string SellerName { get; set; } = string.Empty;
        public double AverageRating { get; set; }
        public int Stock { get; set; }
        public DateTime FavoritedAt { get; set; }
    }
}
