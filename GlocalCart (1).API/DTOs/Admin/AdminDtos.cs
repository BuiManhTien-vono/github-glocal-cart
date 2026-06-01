namespace GlocalCart.API.DTOs.Admin
{
    public class AdminCategoryDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int? ParentCategoryId { get; set; }
    }

    public class UpdateAccountStatusDto
    {
        public string Status { get; set; } = string.Empty;
    }

    public class AdminUserDto
    {
        public int Id { get; set; }
        public string? UserName { get; set; }
        public string? Email { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string Role { get; set; } = string.Empty;
        public bool IsSeller { get; set; }
        public string AccountStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class AdminOrderDto
    {
        public int Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime OrderDate { get; set; }
        public decimal TotalAmount { get; set; }
        public decimal ShippingFee { get; set; }
        public string BuyerName { get; set; } = string.Empty;
        public string? BuyerEmail { get; set; }
        public string PaymentStatus { get; set; } = string.Empty;
        public AdminOrderPaymentDto? Payment { get; set; }
        public AdminOrderShipmentDto? Shipment { get; set; }
        public List<AdminOrderItemDto> Items { get; set; } = new();
    }

    public class AdminOrderPaymentDto
    {
        public string Method { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? TransactionRef { get; set; }
    }

    public class AdminOrderShipmentDto
    {
        public string Status { get; set; } = string.Empty;
        public DateTime? DeliveredAt { get; set; }
    }

    public class AdminOrderItemDto
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public string ProductName { get; set; } = string.Empty;
        public int SellerId { get; set; }
        public string SellerName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal Subtotal { get; set; }
    }

    public class AdminDashboardDto
    {
        public int TotalUsers { get; set; }
        public int TotalSellers { get; set; }
        public int TotalProducts { get; set; }
        public int TotalOrders { get; set; }
        public decimal TotalRevenue { get; set; }
        public decimal ProductRevenue { get; set; }
        public decimal ShippingRevenue { get; set; }
        public int CompletedOrders { get; set; }
        public int PendingOrders { get; set; }
    }

    public class AdminRevenueDto
    {
        public decimal TotalRevenue { get; set; }
        public int TotalOrders { get; set; }
        public int TotalItems { get; set; }
        public decimal AverageOrder { get; set; }
        public List<AdminRevenueBreakdownDto> ByCategory { get; set; } = new();
        public List<AdminRevenueBreakdownDto> ByProduct { get; set; } = new();
    }

    public class AdminRevenueBreakdownDto
    {
        public string Name { get; set; } = string.Empty;
        public int Quantity { get; set; }
        public decimal Revenue { get; set; }
    }
}
