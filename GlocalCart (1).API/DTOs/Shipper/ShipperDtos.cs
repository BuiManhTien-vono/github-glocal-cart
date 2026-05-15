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
        public string? TrackingNumber { get; set; }
        public string? ShipmentMethod { get; set; }
        public DateTime? ShipmentDate { get; set; }
        public DateTime? EstimatedArrival { get; set; }
        public DateTime? AssignedAt { get; set; }
        public string BuyerName { get; set; } = string.Empty;
        public string BuyerPhone { get; set; } = string.Empty;
        public string DeliveryAddress { get; set; } = string.Empty;
        public string? ShipperName { get; set; }
    }

    public class ShipperActionDto
    {
        public string? Note { get; set; }
    }
}
