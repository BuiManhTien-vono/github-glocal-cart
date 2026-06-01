using System.Collections.Concurrent;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using GlocalCart.BankGateway.Models;

namespace GlocalCart.BankGateway.Services
{
    /// <summary>
    /// Service chính của Bank Gateway.
    /// Mô phỏng quy trình xử lý giao dịch của ngân hàng:
    /// 1. Nhận yêu cầu xác minh chuyển khoản từ merchant (GlocalCart API)
    /// 2. Xác minh chữ ký HMAC của merchant
    /// 3. Tạo bản ghi giao dịch nội bộ
    /// 4. Sau một khoảng delay → gọi webhook ngược về merchant với kết quả
    /// </summary>
    public class GatewayService
    {
        private readonly IConfiguration _config;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly ILogger<GatewayService> _logger;

        // In-memory "database" — mô phỏng bảng giao dịch của ngân hàng
        private static readonly ConcurrentDictionary<string, TransactionRecord> _transactions = new();
        private static readonly ConcurrentDictionary<string, BillRecord> _bills = new();

        private readonly string _secretKey;
        private readonly string _glocalCartApiUrl;
        private readonly int _delayMs;
        private readonly bool _autoApprove;
        private readonly string _gatewayName;
        private readonly string _bankId;
        private readonly string _bankAccount;
        private readonly string _accountName;

        public GatewayService(IConfiguration config, IHttpClientFactory httpClientFactory, ILogger<GatewayService> logger)
        {
            _config = config;
            _httpClientFactory = httpClientFactory;
            _logger = logger;

            var settings = config.GetSection("GatewaySettings");
            _secretKey = settings["SecretKey"] ?? "default_secret";
            _glocalCartApiUrl = settings["GlocalCartApiUrl"] ?? "http://localhost:5100";
            _delayMs = int.TryParse(settings["AutoProcessDelayMs"], out var d) ? d : 5000;
            _autoApprove = bool.TryParse(settings["AutoApprove"], out var a) ? a : true;
            _gatewayName = settings["GatewayName"] ?? "VietBank Simulator";
            _bankId = settings["BankId"] ?? "mb";
            _bankAccount = settings["BankAccount"] ?? "0968085005";
            _accountName = settings["AccountName"] ?? "BUI MANH TIEN";
        }

        public CreateBillResponse CreateBill(CreateBillRequest request)
        {
            if (!VerifyBillSignature(request))
            {
                _logger.LogWarning("[{Gateway}] Invalid create-bill signature for order {OrderId}",
                    _gatewayName, request.OrderId);
                throw new InvalidOperationException("Chu ky create-bill khong hop le.");
            }

            var billId = $"BILL-{request.OrderId}";
            var bill = _bills.AddOrUpdate(
                request.OrderId,
                _ => new BillRecord
                {
                    BillId = billId,
                    MerchantId = request.MerchantId,
                    OrderId = request.OrderId,
                    Amount = request.Amount,
                    Status = "CREATED",
                    CreatedAt = DateTime.UtcNow
                },
                (_, existing) =>
                {
                    if (existing.Amount != request.Amount || existing.MerchantId != request.MerchantId)
                    {
                        throw new InvalidOperationException("Bill da ton tai nhung khong khop so tien hoac merchant.");
                    }

                    return existing;
                });

            var description = Uri.EscapeDataString($"Thanh toan {request.OrderId}");
            var qrUrl =
                $"https://img.vietqr.io/image/{_bankId}-{_bankAccount}-compact2.png?amount={(int)request.Amount}&addInfo={description}&accountName={Uri.EscapeDataString(_accountName)}";

            _logger.LogInformation("[{Gateway}] Created bill {BillId} for order {OrderId}",
                _gatewayName, bill.BillId, bill.OrderId);

            return new CreateBillResponse
            {
                BillId = bill.BillId,
                MerchantId = bill.MerchantId,
                OrderId = bill.OrderId,
                Amount = bill.Amount,
                Timestamp = request.Timestamp,
                VietQrUrl = qrUrl,
                BankId = _bankId,
                BankAccount = _bankAccount,
                AccountName = _accountName
            };
        }

        /// <summary>
        /// Xử lý yêu cầu xác minh chuyển khoản từ merchant.
        /// </summary>
        public TransferAcceptedResponse ProcessTransfer(TransferRequest request)
        {
            // 1. Verify merchant signature
            if (!VerifyMerchantSignature(request))
            {
                _logger.LogWarning("🔴 [{Gateway}] Chữ ký merchant không hợp lệ cho đơn {OrderId}",
                    _gatewayName, request.OrderId);
                throw new InvalidOperationException("Chữ ký merchant không hợp lệ.");
            }

            // 2. Tạo transaction ID nội bộ
            if (!_bills.TryGetValue(request.OrderId, out var bill)
                || bill.MerchantId != request.MerchantId
                || bill.Amount != request.Amount)
            {
                throw new InvalidOperationException("Khong tim thay bill hop le cho giao dich nay.");
            }

            bill.Status = "PROCESSING";

            var transactionId = "BANK-" + Guid.NewGuid().ToString("N")[..12].ToUpper();

            // 3. Lưu bản ghi giao dịch
            var record = new TransactionRecord
            {
                TransactionId = transactionId,
                MerchantId = request.MerchantId,
                OrderId = request.OrderId,
                Amount = request.Amount,
                Status = "PROCESSING",
                ReceivedAt = DateTime.UtcNow
            };
            _transactions[transactionId] = record;

            _logger.LogInformation(
                "🟡 [{Gateway}] Nhận giao dịch {TxId} | Đơn: {OrderId} | Số tiền: {Amount:N0}₫ | Đang xử lý...",
                _gatewayName, transactionId, request.OrderId, request.Amount);

            // 4. Nếu AutoApprove → chạy background task để gọi webhook sau delay
            if (_autoApprove)
            {
                _ = Task.Run(async () => await ProcessAndCallbackAsync(transactionId, "PAID"));
            }

            return new TransferAcceptedResponse
            {
                TransactionId = transactionId,
                Status = "PROCESSING",
                Message = $"Giao dịch đang được xử lý bởi {_gatewayName}. Kết quả sẽ được gửi qua webhook."
            };
        }

        /// <summary>
        /// Admin chủ động resolve một giao dịch (cho trường hợp AutoApprove = false).
        /// </summary>
        public async Task<TransactionRecord?> ManualResolveAsync(string transactionId, string status)
        {
            if (!_transactions.TryGetValue(transactionId, out var record))
                return null;

            if (record.Status != "PROCESSING")
                throw new InvalidOperationException($"Giao dịch đã được xử lý: {record.Status}");

            await ProcessAndCallbackAsync(transactionId, status);
            return _transactions.GetValueOrDefault(transactionId);
        }

        /// <summary>
        /// Lấy danh sách tất cả giao dịch.
        /// </summary>
        public IEnumerable<TransactionRecord> GetAllTransactions() =>
            _transactions.Values.OrderByDescending(t => t.ReceivedAt);

        /// <summary>
        /// Lấy chi tiết một giao dịch.
        /// </summary>
        public TransactionRecord? GetTransaction(string transactionId) =>
            _transactions.GetValueOrDefault(transactionId);

        /// <summary>
        /// Xử lý giao dịch và gọi webhook về GlocalCart API.
        /// </summary>
        private async Task ProcessAndCallbackAsync(string transactionId, string status)
        {
            if (!_transactions.TryGetValue(transactionId, out var record))
                return;

            try
            {
                // Delay mô phỏng thời gian ngân hàng xử lý
                var jitter = Random.Shared.Next(-1000, 3000); // ±1~3s jitter cho realistic
                var actualDelay = Math.Max(1000, _delayMs + jitter);

                _logger.LogInformation(
                    "⏳ [{Gateway}] Giao dịch {TxId} — đang xử lý ({Delay}ms)...",
                    _gatewayName, transactionId, actualDelay);

                await Task.Delay(actualDelay);

                // Cập nhật trạng thái
                record.Status = status;
                record.ProcessedAt = DateTime.UtcNow;
                if (_bills.TryGetValue(record.OrderId, out var bill))
                {
                    bill.Status = status;
                }

                // Tạo webhook payload
                var timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                var payload = new WebhookPayload
                {
                    MerchantId = record.MerchantId,
                    OrderId = record.OrderId,
                    Amount = record.Amount,
                    TransactionId = transactionId,
                    Timestamp = timestamp,
                    Status = status
                };

                // Tạo HMAC signature
                var rawData = $"{payload.MerchantId}|{payload.OrderId}|{(int)payload.Amount}|{payload.Timestamp}";
                var signature = GenerateHmacHash(rawData, _secretKey);

                // Gọi webhook về GlocalCart API
                var client = _httpClientFactory.CreateClient();
                var webhookUrl = $"{_glocalCartApiUrl}/api/payments/webhook";

                var json = JsonSerializer.Serialize(payload);
                using var request = new HttpRequestMessage(HttpMethod.Post, webhookUrl)
                {
                    Content = new StringContent(json, Encoding.UTF8, "application/json")
                };
                request.Headers.Add("X-Signature", signature);

                _logger.LogInformation(
                    "📡 [{Gateway}] Gửi webhook → {Url} | TxId: {TxId} | Status: {Status}",
                    _gatewayName, webhookUrl, transactionId, status);

                var response = await client.SendAsync(request);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    record.WebhookResult = $"✅ HTTP {(int)response.StatusCode} — Webhook thành công";
                    _logger.LogInformation(
                        "✅ [{Gateway}] Webhook thành công cho {TxId} | HTTP {Code}",
                        _gatewayName, transactionId, (int)response.StatusCode);
                }
                else
                {
                    record.WebhookResult = $"❌ HTTP {(int)response.StatusCode} — {responseBody}";
                    _logger.LogError(
                        "❌ [{Gateway}] Webhook thất bại cho {TxId} | HTTP {Code} | Body: {Body}",
                        _gatewayName, transactionId, (int)response.StatusCode, responseBody);
                }
            }
            catch (Exception ex)
            {
                record.Status = "ERROR";
                record.WebhookResult = $"💥 Exception: {ex.Message}";
                _logger.LogError(ex,
                    "💥 [{Gateway}] Lỗi xử lý giao dịch {TxId}",
                    _gatewayName, transactionId);
            }
        }

        /// <summary>
        /// Xác minh chữ ký HMAC của merchant.
        /// </summary>
        private bool VerifyMerchantSignature(TransferRequest request)
        {
            return VerifySignature(request.MerchantId, request.OrderId, request.Amount, request.Timestamp, request.Signature);
        }

        private bool VerifyBillSignature(CreateBillRequest request)
        {
            return VerifySignature(request.MerchantId, request.OrderId, request.Amount, request.Timestamp, request.Signature);
        }

        private bool VerifySignature(string merchantId, string orderId, decimal amount, long timestamp, string signature)
        {
            var callbackTime = DateTimeOffset.FromUnixTimeSeconds(timestamp);
            if (DateTimeOffset.UtcNow - callbackTime > TimeSpan.FromMinutes(15)
                || callbackTime - DateTimeOffset.UtcNow > TimeSpan.FromMinutes(5))
            {
                return false;
            }

            var rawData = $"{merchantId}|{orderId}|{(int)amount}|{timestamp}";
            var expected = GenerateHmacHash(rawData, _secretKey);
            var expectedBytes = Encoding.UTF8.GetBytes(expected);
            var actualBytes = Encoding.UTF8.GetBytes(signature.ToLowerInvariant());

            return expectedBytes.Length == actualBytes.Length
                && CryptographicOperations.FixedTimeEquals(expectedBytes, actualBytes);
        }

        /// <summary>
        /// Tạo HMAC-SHA256 hash.
        /// </summary>
        private static string GenerateHmacHash(string data, string key)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var dataBytes = Encoding.UTF8.GetBytes(data);
            using var hmac = new HMACSHA256(keyBytes);
            var hashBytes = hmac.ComputeHash(dataBytes);
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}
