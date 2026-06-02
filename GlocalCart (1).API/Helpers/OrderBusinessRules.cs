using GlocalCart.API.Enums;
using GlocalCart.API.Models;

namespace GlocalCart.API.Helpers
{
    /// <summary>
    /// Quy tắc nghiệp vụ chung cho đơn hàng, thanh toán và vận chuyển.
    /// </summary>
    public static class OrderBusinessRules
    {
        /// <summary>
        /// COD (CreditCard): seller/shipper xử lý khi chưa trả trước.
        /// Chuyển khoản: bắt buộc ngân hàng xác nhận (Completed).
        /// </summary>
        public static bool CanFulfillOrder(Payment? payment)
        {
            if (payment == null) return false;
            if (payment.Method is PaymentMethod.CashOnDelivery or PaymentMethod.CreditCard) return true;
            return payment.Status == PaymentStatus.Completed;
        }

        public static bool RequiresBankConfirmation(Payment payment) =>
            payment.Method == PaymentMethod.ElectronicBankTransfer;

        public static bool CanInitiateBankPayment(Payment payment) =>
            RequiresBankConfirmation(payment) &&
            payment.Status is PaymentStatus.Unpaid or PaymentStatus.Pending or PaymentStatus.Failed;

        public static bool CanConfirmTransfer(Payment payment) =>
            RequiresBankConfirmation(payment) &&
            payment.Status is PaymentStatus.Unpaid or PaymentStatus.Pending or PaymentStatus.Failed;

        public static void EnsureSellerCanFulfill(Payment? payment)
        {
            if (!CanFulfillOrder(payment))
                throw new InvalidOperationException(
                    "Đơn hàng chưa được thanh toán. Vui lòng chờ ngân hàng xác nhận giao dịch.");
        }
    }
}
