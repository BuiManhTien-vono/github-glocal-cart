using System.Security.Cryptography;
using System.Text;
using GlocalCart.API.Data;
using GlocalCart.API.DTOs.Payments;
using GlocalCart.API.Enums;
using GlocalCart.API.Models;
using GlocalCart.API.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace GlocalCart.API.Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _config;
        private readonly string _merchantId;
        private readonly string _secretKey;
        private readonly string _bankId;
        private readonly string _bankAccount;
        private readonly string _accountName;

        public PaymentService(AppDbContext db, IConfiguration config)
        {
            _db = db;
            _config = config;
            
            var settings = _config.GetSection("PaymentSettings");
            _merchantId = settings["MerchantId"] ?? "MERCHANT_001";
            _secretKey = settings["SecretKey"] ?? "default_secret";
            _bankId = settings["BankId"] ?? "vietinbank";
            _bankAccount = settings["BankAccount"] ?? "1133666688888";
            _accountName = settings["AccountName"] ?? "CONG TY DEMO";
        }

        public async Task<PaymentInitiateResponseDto> InitiatePaymentAsync(int orderId)
        {
            var order = await _db.Orders
                .Include(o => o.Buyer)
                .FirstOrDefaultAsync(o => o.Id == orderId)
                ?? throw new KeyNotFoundException("Không tìm thấy đơn hàng.");

            long timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
            string orderNumber = order.OrderNumber;
            decimal amount = order.TotalAmount;

            // 1. Tạo chữ ký HMAC-SHA256: MerchantId|OrderId|Amount|Timestamp
            string rawData = $"{_merchantId}|{orderNumber}|{(int)amount}|{timestamp}";
            string signature = GenerateHmacHash(rawData, _secretKey);

            // 2. Tạo VietQR URL
            // Định dạng: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<DESCRIPTION>&accountName=<NAME>
            string description = Uri.EscapeDataString($"Thanh toan {orderNumber}");
            string qrUrl = $"https://img.vietqr.io/image/{_bankId}-{_bankAccount}-compact2.png?amount={(int)amount}&addInfo={description}&accountName={Uri.EscapeDataString(_accountName)}";

            return new PaymentInitiateResponseDto
            {
                MerchantId = _merchantId,
                OrderId = orderNumber,
                Amount = amount,
                Timestamp = timestamp,
                Signature = signature,
                VietQrUrl = qrUrl
            };
        }

        public async Task<bool> ProcessCallbackAsync(WebhookRequestDto callback, string signature)
        {
            // 1. Kiểm tra chữ ký từ Gateway (Ngược lại: Gateway ký, BE xác minh)
            string rawData = $"{callback.MerchantId}|{callback.OrderId}|{(int)callback.Amount}|{callback.Timestamp}";
            string expectedSignature = GenerateHmacHash(rawData, _secretKey);

            if (signature != expectedSignature)
            {
                return false;
            }

            // 2. Tìm đơn hàng
            var order = await _db.Orders
                .Include(o => o.Payment)
                .FirstOrDefaultAsync(o => o.OrderNumber == callback.OrderId);
            
            if (order == null) return false;

            // 3. Cập nhật trạng thái thanh toán và đơn hàng
            if (callback.Status == "PAID")
            {
                if (order.Payment == null)
                {
                    order.Payment = new Payment
                    {
                        OrderId = order.Id,
                        Method = PaymentMethod.ElectronicBankTransfer,
                        Amount = callback.Amount,
                        TransactionRef = callback.TransactionId,
                        Status = PaymentStatus.Completed,
                        CreatedAt = DateTime.UtcNow
                    };
                }
                else
                {
                    order.Payment.Status = PaymentStatus.Completed;
                    order.Payment.TransactionRef = callback.TransactionId;
                    order.Payment.UpdatedAt = DateTime.UtcNow;
                }

                order.Status = OrderStatus.Shipped; // Tự động chuyển sang Shipped sau khi thanh toán thành công
                
                // Lưu log
                _db.OrderLogs.Add(new OrderLog
                {
                    OrderId = order.Id,
                    Status = order.Status,
                    Note = $"Thanh toán thành công qua VietQR. GD: {callback.TransactionId}",
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync();
            return true;
        }

        private string GenerateHmacHash(string data, string key)
        {
            byte[] keyBytes = Encoding.UTF8.GetBytes(key);
            byte[] dataBytes = Encoding.UTF8.GetBytes(data);

            using (var hmac = new HMACSHA256(keyBytes))
            {
                byte[] hashBytes = hmac.ComputeHash(dataBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }
    }
}
