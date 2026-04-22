namespace GlocalCart.API.Enums
{
    /// <summary>
    /// Trạng thái tài khoản người dùng (theo UML Class Diagram)
    /// </summary>
    public enum AccountStatus
    {
        Active,        // Hoạt động bình thường
        Blocked,       // Bị khóa tạm thời
        Banned,        // Bị cấm vĩnh viễn
        Compromised,   // Tài khoản bị xâm phạm
        Archived,      // Đã lưu trữ / vô hiệu hóa
        Unknown        // Trạng thái không xác định
    }
}
