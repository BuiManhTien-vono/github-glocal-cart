using System.ComponentModel.DataAnnotations;
using GlocalCart.API.Enums;

namespace GlocalCart.API.DTOs.Orders
{
    public class CreateOrderDto
    {
        [Required]
        public int ShippingAddressId { get; set; }

        [Required]
        public PaymentMethod PaymentMethod { get; set; }

        [MaxLength(500)]
        public string? Note { get; set; }

        public List<CreateOrderItemDto>? Items { get; set; }
    }

    public class CreateOrderItemDto
    {
        [Required]
        public int ProductId { get; set; }

        [Range(1, int.MaxValue)]
        public int Quantity { get; set; } = 1;
    }

    public class OrderResponseDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public string? BuyerName { get; set; }
        public string? Note { get; set; }
        public AddressSnapshotDto ShippingAddress { get; set; } = null!;
        public List<OrderItemResponseDto> Items { get; set; } = new();
        public PaymentResponseDto? Payment { get; set; }
        public ShipmentInfoDto? Shipment { get; set; }
    }

    public class OrderItemResponseDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public string? ProductImage { get; set; }
        public int SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal => UnitPrice * Quantity;
    }

    public class SelectPaymentMethodDto
    {
        public string Method { get; set; } = string.Empty;
    }

    public class AddressSnapshotDto
    {
        public string StreetAddress { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string State { get; set; } = string.Empty;
        public string Zipcode { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;
    }

    public class PaymentResponseDto
    {
        public string Method { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? TransactionRef { get; set; }
    }

    public class ShipmentInfoDto
    {
        public int Id { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime? ShipmentDate { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public string? ShipmentMethod { get; set; }
        public string? TrackingNumber { get; set; }
        public int? ShipperId { get; set; }
        public string? ShipperName { get; set; }
        public string? ShipperPhone { get; set; }
        public DateTime? AssignedAt { get; set; }
        public DateTime? DeliveredAt { get; set; }
    }

    public class UpdateOrderStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Note { get; set; }
    }

    public class RejectOrderDto
    {
        [Required, MaxLength(500)]
        public string Reason { get; set; } = string.Empty;
    }

    public class OrderLogDto
    {
        public string Status { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateShipmentDto
    {
        public DateTime? ShipmentDate { get; set; }
        public DateTime? EstimatedArrival { get; set; }

        [MaxLength(100)]
        public string? ShipmentMethod { get; set; }

        [MaxLength(100)]
        public string? TrackingNumber { get; set; }
    }

    public class UpdateShipmentStatusDto
    {
        [Required]
        public string Status { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Note { get; set; }
    }

    public class ShipmentLogDto
    {
        public string Status { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ConfirmReceiptResultDto
    {
        public bool Completed { get; set; }
        public bool RequiresPayment { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
