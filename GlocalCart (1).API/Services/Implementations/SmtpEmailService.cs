using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using System.Text;
using GlocalCart.API.Services.Interfaces;

namespace GlocalCart.API.Services.Implementations
{
    public class SmtpEmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<SmtpEmailService> _logger;

        public SmtpEmailService(IConfiguration config, ILogger<SmtpEmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendPasswordResetOtpAsync(string email, string fullName, string otp)
        {
            var smtp = _config.GetSection("SmtpSettings");
            var host = GetSetting(smtp, "Host", "GLOCALCART_SMTP_HOST");
            var username = GetSetting(smtp, "Username", "GLOCALCART_SMTP_USERNAME");
            var password = GetSetting(smtp, "Password", "GLOCALCART_SMTP_PASSWORD");
            var fromEmail = GetSetting(smtp, "FromEmail", "GLOCALCART_SMTP_FROM_EMAIL");
            var fromName = GetSetting(smtp, "FromName", "GLOCALCART_SMTP_FROM_NAME") ?? "GlocalCart";
            var portValue = GetSetting(smtp, "Port", "GLOCALCART_SMTP_PORT");
            var enableSslValue = GetSetting(smtp, "EnableSsl", "GLOCALCART_SMTP_ENABLE_SSL");

            if (string.IsNullOrWhiteSpace(fromEmail))
                fromEmail = username;

            if (string.IsNullOrWhiteSpace(host) ||
                string.IsNullOrWhiteSpace(username) ||
                string.IsNullOrWhiteSpace(password) ||
                string.IsNullOrWhiteSpace(fromEmail))
            {
                throw new InvalidOperationException("Chưa cấu hình SMTP Gmail. Vui lòng cấu hình SmtpSettings hoặc biến môi trường GLOCALCART_SMTP_USERNAME/GLOCALCART_SMTP_PASSWORD.");
            }

            var safeName = string.IsNullOrWhiteSpace(fullName) ? "ban" : fullName.Trim();
            var htmlBody = BuildPasswordResetEmailHtml(safeName, otp);
            var textBody = $"Xin chao {safeName},\n\nMa OTP khoi phuc mat khau GlocalCart cua ban la: {otp}\nMa co hieu luc trong 5 phut.\n\nNeu ban khong yeu cau, vui long bo qua email nay.";

            using var message = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = "Ma OTP khoi phuc mat khau GlocalCart",
                BodyEncoding = Encoding.UTF8,
                SubjectEncoding = Encoding.UTF8
            };
            message.To.Add(email);
            message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(textBody, Encoding.UTF8, MediaTypeNames.Text.Plain));
            message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, Encoding.UTF8, MediaTypeNames.Text.Html));

            using var client = new SmtpClient(host, int.TryParse(portValue, out var port) ? port : 587)
            {
                EnableSsl = bool.TryParse(enableSslValue, out var ssl) ? ssl : true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
                Credentials = new NetworkCredential(username, password)
            };

            try
            {
                await client.SendMailAsync(message);
                _logger.LogInformation("Password reset OTP email sent to {Email}", email);
            }
            catch (SmtpException ex)
            {
                _logger.LogError(ex, "Failed to send password reset OTP email to {Email}", email);
                throw new InvalidOperationException("Không gửi được OTP qua Gmail. Kiểm tra Gmail App Password và cấu hình SMTP.", ex);
            }
        }

        private static string? GetSetting(IConfiguration section, string key, string envName)
        {
            var value = section[key];
            if (!string.IsNullOrWhiteSpace(value)) return value;
            value = Environment.GetEnvironmentVariable(envName);
            return string.IsNullOrWhiteSpace(value) ? null : value;
        }

        private static string BuildPasswordResetEmailHtml(string fullName, string otp)
        {
            return $"""
            <!doctype html>
            <html>
            <body style="font-family:Arial,sans-serif;background:#f6f7fb;padding:24px;color:#222">
              <div style="max-width:520px;margin:auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #eee">
                <h2 style="margin:0 0 12px;color:#ee4d2d">GlocalCart</h2>
                <p>Xin chao {WebUtility.HtmlEncode(fullName)},</p>
                <p>Ma OTP khoi phuc mat khau cua ban la:</p>
                <div style="font-size:32px;font-weight:800;letter-spacing:6px;color:#ee4d2d;text-align:center;padding:18px;background:#fff4ef;border-radius:10px;margin:20px 0">
                  {otp}
                </div>
                <p>Ma co hieu luc trong <strong>5 phut</strong>. Khong chia se ma nay voi bat ky ai.</p>
                <p style="color:#777;font-size:13px">Neu ban khong yeu cau dat lai mat khau, vui long bo qua email nay.</p>
              </div>
            </body>
            </html>
            """;
        }
    }
}
