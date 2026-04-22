namespace GlocalCart.API.Helpers
{
    /// <summary>
    /// Helper mã hóa mật khẩu dùng BCrypt
    /// </summary>
    public static class PasswordHelper
    {
        /// <summary>
        /// Hash mật khẩu
        /// </summary>
        public static string HashPassword(string password)
        {
            return BCrypt.Net.BCrypt.HashPassword(password);
        }

        /// <summary>
        /// Xác minh mật khẩu với hash đã lưu
        /// </summary>
        public static bool VerifyPassword(string password, string passwordHash)
        {
            return BCrypt.Net.BCrypt.Verify(password, passwordHash);
        }
    }
}
