namespace GlocalCart.BankGateway.Models
{
    /// <summary>
    /// Request từ GlocalCart API gửi sang Bank Gateway khi buyer xác nhận đã chuyển khoản.
    /// </summary>
    public class TransferRequest
    {
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public long Timestamp { get; set; }
        public string Signature { get; set; } = string.Empty;
    }
}
