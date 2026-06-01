namespace GlocalCart.API.DTOs.Shops
{
    public class FollowedShopDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public int ProductCount { get; set; }
        public DateTime FollowedAt { get; set; }
    }

    public class SellerSummaryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public int ProductCount { get; set; }
    }
}
