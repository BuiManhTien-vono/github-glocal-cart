namespace GlocalCart.API.Enums
{
    /// <summary>
    /// Trạng thái vận chuyển (theo UML Class Diagram)
    /// </summary>
    public enum ShipmentStatus
    {
        Pending,    // Đang chờ vận chuyển
        Shipped,    // Đang giao
        Delivered,  // Đã giao thành công
        OnHold      // Tạm giữ
    }
}
