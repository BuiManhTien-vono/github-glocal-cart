namespace GlocalCart.API.Enums
{
    /// <summary>
    /// Trạng thái đơn hàng (theo UML Class Diagram)
    /// </summary>
    public enum OrderStatus
    {
        Unshipped,     // Chưa giao cho vận chuyển
        Pending,       // Đang chờ xử lý
        Shipped,       // Đã gửi hàng
        Complete,      // Hoàn thành
        Canceled,      // Đã hủy
        RefundApplied  // Đã áp dụng hoàn tiền
    }
}
