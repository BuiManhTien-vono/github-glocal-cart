namespace GlocalCart.API.Helpers
{
    /// <summary>
    /// Chuẩn hóa API Response cho toàn bộ hệ thống.
    /// Frontend luôn nhận cùng format: { success, message, data, statusCode }
    /// </summary>
    public class ApiResponse<T>
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public T? Data { get; set; }
        public int StatusCode { get; set; }
    }

    /// <summary>
    /// Static factory methods để tạo ApiResponse nhanh gọn
    /// </summary>
    public static class ApiResponse
    {
        // === SUCCESS ===

        /// <summary>
        /// Trả về 200 OK với data
        /// </summary>
        public static ApiResponse<T> Ok<T>(T data, string message = "Thao tác thành công.")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                StatusCode = 200
            };
        }

        /// <summary>
        /// Trả về 200 OK chỉ có message (không có data)
        /// </summary>
        public static ApiResponse<object?> Ok(string message = "Thao tác thành công.")
        {
            return new ApiResponse<object?>
            {
                Success = true,
                Message = message,
                Data = null,
                StatusCode = 200
            };
        }

        /// <summary>
        /// Trả về 201 Created với data
        /// </summary>
        public static ApiResponse<T> Created<T>(T data, string message = "Tạo mới thành công.")
        {
            return new ApiResponse<T>
            {
                Success = true,
                Message = message,
                Data = data,
                StatusCode = 201
            };
        }

        // === ERROR ===

        /// <summary>
        /// Trả về lỗi với statusCode tùy chỉnh
        /// </summary>
        public static ApiResponse<object?> Fail(string message, int statusCode = 400)
        {
            return new ApiResponse<object?>
            {
                Success = false,
                Message = message,
                Data = null,
                StatusCode = statusCode
            };
        }

        /// <summary>
        /// Trả về lỗi với generic type (dùng trong service layer)
        /// </summary>
        public static ApiResponse<T> Fail<T>(string message, int statusCode = 400)
        {
            return new ApiResponse<T>
            {
                Success = false,
                Message = message,
                Data = default,
                StatusCode = statusCode
            };
        }

        /// <summary>
        /// 401 Unauthorized
        /// </summary>
        public static ApiResponse<object?> Unauthorized(string message = "Không có quyền truy cập.")
        {
            return Fail(message, 401);
        }

        /// <summary>
        /// 403 Forbidden
        /// </summary>
        public static ApiResponse<object?> Forbidden(string message = "Bị từ chối truy cập.")
        {
            return Fail(message, 403);
        }

        /// <summary>
        /// 404 Not Found
        /// </summary>
        public static ApiResponse<object?> NotFound(string message = "Không tìm thấy tài nguyên.")
        {
            return Fail(message, 404);
        }
    }
}
