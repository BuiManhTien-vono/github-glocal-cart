using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using GlocalCart.API.Enums;

namespace GlocalCart.API.Models
{
    /// <summary>
    /// Bảng Payments - Thanh toán mô phỏng (Payment trong UML)
    /// Quan hệ 1-1 với Order
    /// </summary>
    public class Payment
    {
        public int Id { get; set; }

        public int OrderId { get; set; }

        /// <summary>
        /// Phương thức thanh toán (CreditCard / BankTransfer)
        /// </summary>
        public PaymentMethod Method { get; set; }

        /// <summary>
        /// Trạng thái thanh toán chi tiết (theo UML: status: PaymentStatus)
        /// </summary>
        public PaymentStatus Status { get; set; } = PaymentStatus.Unpaid;

        /// <summary>
        /// Số tiền thanh toán (theo UML: amount: double)
        /// </summary>
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }

        /// <summary>
        /// Mã giao dịch tham chiếu (mô phỏng)
        /// </summary>
        [MaxLength(100)]
        public string? TransactionRef { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation
        public Order Order { get; set; } = null!;
    }
}
