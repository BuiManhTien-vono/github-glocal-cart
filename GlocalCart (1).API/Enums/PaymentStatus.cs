namespace GlocalCart.API.Enums
{
    /// <summary>
    /// Trạng thái thanh toán (theo UML Class Diagram)
    /// </summary>
    public enum PaymentStatus
    {
        Unpaid,     // Chưa thanh toán
        Pending,    // Đang chờ xử lý
        Completed,  // Thành công
        Failed,     // Thất bại
        Declined,   // Bị từ chối
        Canceled,   // Đã hủy
        Abandoned,  // Bỏ dở
        Settling,   // Đang đối soát
        Settled,    // Đã đối soát xong
        Refunded    // Đã hoàn tiền
    }
}
