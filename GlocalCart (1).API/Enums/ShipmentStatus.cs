namespace GlocalCart.API.Enums
{
    /// <summary>
    /// Trạng thái vận chuyển (theo UML Class Diagram)
    /// </summary>
    public enum ShipmentStatus
    {
        Pending,    // Chờ lấy hàng (chưa có shipper)
        Shipped,    // Chờ giao hàng (đã lấy hàng, đang đi giao)
        Delivered,  // Đã giao thành công
        OnHold,     // Tạm giữ
        Arrived,    // Đã đến nơi, chờ xác nhận nhận hàng / thanh toán
        Accepted    // Shipper đã nhận đơn, chờ lấy hàng tại seller
    }
}
