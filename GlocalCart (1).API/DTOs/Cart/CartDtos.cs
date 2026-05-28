using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.DTOs.Cart
{
    public class CartItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public int SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public decimal PriceSnapshot { get; set; }
        public decimal CurrentPrice { get; set; }
        public int Quantity { get; set; }
        public int AvailableStock { get; set; }
        public decimal Subtotal => PriceSnapshot * Quantity;
    }

    public class CartResponseDto
    {
        public List<CartItemResponseDto> Items { get; set; } = new();
        public decimal TotalAmount => Items.Sum(i => i.Subtotal);
        public int TotalItems => Items.Sum(i => i.Quantity);
    }

    public class AddToCartDto
    {
        [Required]
        public int ProductId { get; set; }

        [Range(1, 100)]
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartItemDto
    {
        [Required, Range(1, 100)]
        public int Quantity { get; set; }
    }

    /// <summary>
    /// Dùng để đồng bộ giỏ hàng từ Guest (AsyncStorage) sang Member (Database)
    /// </summary>
    public class SyncCartDto
    {
        public List<SyncCartItemDto> Items { get; set; } = new();
    }

    public class SyncCartItemDto
    {
        public int ProductId { get; set; }
        public int Quantity { get; set; }
    }
}
