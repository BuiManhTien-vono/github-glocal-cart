namespace GlocalCart.BankGateway.Models
{
    /// <summary>
    /// Trạng thái giao dịch nội bộ của Bank Gateway.
    /// Mô phỏng một bản ghi trong DB của ngân hàng.
    /// </summary>
    public class TransactionRecord
    {
        public string TransactionId { get; set; } = string.Empty;
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = "PROCESSING"; // PROCESSING, PAID, FAILED
        public DateTime ReceivedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ProcessedAt { get; set; }
        public string? WebhookResult { get; set; }
    }

    public class BillRecord
    {
        public string BillId { get; set; } = string.Empty;
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Status { get; set; } = "CREATED";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

    public class CreateBillRequest
    {
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public long Timestamp { get; set; }
        public string Signature { get; set; } = string.Empty;
    }

    public class CreateBillResponse
    {
        public string BillId { get; set; } = string.Empty;
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public long Timestamp { get; set; }
        public string VietQrUrl { get; set; } = string.Empty;
        public string BankId { get; set; } = string.Empty;
        public string BankAccount { get; set; } = string.Empty;
        public string AccountName { get; set; } = string.Empty;
    }

    /// <summary>
    /// Response trả về cho GlocalCart API khi nhận request xử lý.
    /// </summary>
    public class TransferAcceptedResponse
    {
        public string TransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = "PROCESSING";
        public string Message { get; set; } = string.Empty;
    }

    /// <summary>
    /// DTO để admin chủ động trigger kết quả cho một giao dịch.
    /// </summary>
    public class ManualResolveRequest
    {
        public string TransactionId { get; set; } = string.Empty;
        public string Status { get; set; } = "PAID"; // PAID or FAILED
    }

    /// <summary>
    /// Payload webhook gửi ngược về GlocalCart API.
    /// Phải khớp cấu trúc WebhookRequestDto bên API chính.
    /// </summary>
    public class WebhookPayload
    {
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string TransactionId { get; set; } = string.Empty;
        public long Timestamp { get; set; }
        public string Status { get; set; } = "PAID";
    }
}
