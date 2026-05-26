namespace GlocalCart.API.DTOs.Shipper
{
    public class ShipperShipmentDto
    {
        public int ShipmentId { get; set; }
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string OrderStatus { get; set; } = string.Empty;
        public string ShipmentStatus { get; set; } = string.Empty;
        public decimal TotalAmount { get; set; }
        public string? PaymentMethod { get; set; }
        public string? PaymentStatus { get; set; }
        public string? TrackingNumber { get; set; }
        public string? ShipmentMethod { get; set; }
        public DateTime? ShipmentDate { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public DateTime? AssignedAt { get; set; }
        public string BuyerName { get; set; } = string.Empty;
        public string BuyerPhone { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public string PickupAddress { get; set; } = string.Empty;
        public decimal DistanceKm { get; set; }
        public string? ShipperName { get; set; }
        public int? ShipperId { get; set; }
        public decimal ShippingFee { get; set; }
        public List<ShipperOrderItemDto> OrderItems { get; set; } = new();
        public bool CanConfirmPickup { get; set; }
        public bool CanConfirmArrival { get; set; }
        public int PickupCountdownSeconds { get; set; }
        public int ArrivalCountdownSeconds { get; set; }
        public bool BuyerConfirmedReceipt { get; set; }
        public bool AwaitingCash { get; set; }
        public bool AwaitingTransferConfirm { get; set; }
    }

    public class ShipperActionDto
    {
        public string? Note { get; set; }
        public string? FailureReason { get; set; }
        public string? ProofNote { get; set; }
    }

    public class ShipperStatsDto
    {
        public int TodayCompleted { get; set; }
        public decimal TodayIncome { get; set; }
        public int MonthCompleted { get; set; }
        public decimal MonthIncome { get; set; }
        public int ActiveShipments { get; set; }
        public decimal PendingCodAmount { get; set; }
        public decimal SuccessRate { get; set; }
        public decimal Rating { get; set; } = 4.8m;
    }

    public class ShipperOrderItemDto
    {
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
