using System.ComponentModel.DataAnnotations;

namespace GlocalCart.API.DTOs.Payments
{
    public class VietQrResponseDto
    {
        public string OrderNumber { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string QrUrl { get; set; } = string.Empty;
        public string CheckoutUrl { get; set; } = string.Empty; // URL to the actual payment gateway if needed
    }

    public class PaymentInitiateResponseDto
    {
        public string MerchantId { get; set; } = string.Empty;
        public string OrderId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public long Timestamp { get; set; }
        public string Signature { get; set; } = string.Empty;
        public string VietQrUrl { get; set; } = string.Empty;
    }

    public class WebhookRequestDto
    {
        [Required]
        public string MerchantId { get; set; } = string.Empty;

        [Required]
        public string OrderId { get; set; } = string.Empty;

        [Required]
        public decimal Amount { get; set; }

        public string TransactionId { get; set; } = string.Empty;

        [Required]
        public long Timestamp { get; set; }
        
        public string Status { get; set; } = "PAID"; // "PAID", "FAILED"
    }

    public class PaymentStatusDto
    {
        public int OrderId { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Method { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string? TransactionRef { get; set; }
        public bool CanInitiatePayment { get; set; }
        public bool CanConfirmTransfer { get; set; }
        public bool IsPaid { get; set; }
    }
}
