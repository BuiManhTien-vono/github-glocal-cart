# 🛒 GlocalCart - Nền tảng Thương mại Điện tử Đa quốc gia

GlocalCart là một hệ thống thương mại điện tử hiện đại, được thiết kế để kết nối người mua và người bán trên toàn cầu. Dự án tập trung vào trải nghiệm người dùng mượt mà, hệ thống quản lý mạnh mẽ và tích hợp thanh toán bảo mật.

---

## 🚀 Tính năng chính

### 👤 Dành cho Người dùng (Member)
- **Đăng ký/Đăng nhập**: Hệ thống xác thực bảo mật với JWT và ASP.NET Identity.
- **Duyệt sản phẩm**: Tìm kiếm, lọc theo danh mục, xem chi tiết sản phẩm với slider hình ảnh.
- **Giỏ hàng**: Quản lý giỏ hàng thông minh (hỗ trợ đồng bộ từ khách vãng lai sang thành viên).
- **Thanh toán**: Tích hợp thanh toán qua **VietQR** (tự động tạo mã QR chuyển khoản).
- **Đơn hàng**: Theo dõi trạng thái đơn hàng, lịch sử vận chuyển và đánh giá sản phẩm.

### 🏪 Dành cho Người bán (Seller)
- **Quản lý gian hàng**: Đăng tải sản phẩm, cập nhật tồn kho và giá bán.
- **Xử lý đơn hàng**: Tiếp nhận, xác nhận hoặc từ chối đơn hàng từ người mua.
- **Vận chuyển**: Tạo vận đơn và cập nhật trạng thái giao hàng.

### 🛡️ Quản trị viên (Admin)
- **Dashboard**: Thống kê doanh thu, số lượng người dùng, sản phẩm và đơn hàng.
- **Quản lý hệ thống**: Duyệt quyền Seller, khóa/mở khóa tài khoản người dùng hoặc sản phẩm vi phạm.
- **Danh mục**: Quản lý cây danh mục sản phẩm đa cấp.

---

## 🛠️ Công nghệ sử dụng

### Backend (ASP.NET Core API)
- **Framework**: .NET 10.0, ASP.NET Core Web API.
- **Security**: Microsoft ASP.NET Core Identity, JWT Bearer Authentication.
- **Database**: Entity Framework Core (hỗ trợ SQL Server/PostgreSQL, hiện tại dùng InMemory cho Dev).
- **Kiến trúc**: 
    - Standardized API Response (Envelope pattern).
    - Global Exception Middleware (Xử lý lỗi tập trung).
    - Authorization Filters (Phân quyền theo Role và trạng thái tài khoản).
- **Thanh toán**: HMAC-SHA256 Signature Verification cho Webhook thanh toán.

### Frontend (Mobile App)
- **Framework**: React Native, Expo.
- **Ngôn ngữ**: TypeScript.
- **State Management**: Zustand (Cart), Context API (Auth).
- **Networking**: Axios với Interceptors (Tự động gắn Token và unwrap API Response).
- **UI/UX**: Custom Theme, Vector Icons, Lottie Animations.

---

## 📂 Cấu trúc thư mục

```text
Global_Cart/
├── GlocalCart.API/          # Source code Backend (C#)
│   ├── Controllers/         # Các API Endpoints
│   ├── Services/            # Business Logic layer
│   ├── Models/              # Database Entities
│   ├── DTOs/                # Data Transfer Objects
│   └── Middleware/          # Auth & Exception handling
└── GlocalCart.Mobile/       # Source code Mobile App (React Native)
    ├── src/
    │   ├── screens/         # Các màn hình ứng dụng
    │   ├── components/      # UI Components dùng chung
    │   ├── services/        # API Client & Services
    │   └── context/         # Auth & Global State
```

---

## ⚙️ Cài đặt và Chạy thử

### 1. Backend API
```bash
cd "GlocalCart (1).API"
dotnet restore
dotnet run
```
*API sẽ chạy tại: `http://localhost:5100`*

### 2. Mobile App
```bash
cd "GlocalCart (1).Mobile"
npm install
npx expo start
```
*Dùng Expo Go trên điện thoại hoặc Simulator để chạy app.*

---

## 📝 Ghi chú cho Nhà phát triển
- **API Response**: Tất cả response đều tuân thủ format: `{ success, message, data, statusCode }`.
- **Cấu hình IP**: Nếu chạy trên điện thoại thật, hãy cập nhật `BASE_URL` trong `apiClient.ts` theo địa chỉ IP local của máy tính bạn.

---

## 🤝 Liên hệ
- **Project Lead**: Bui Manh Tien
- **Repository**: https://github.com/BuiManhTien-vono/github-glocal-cart

---
⭐ *Hãy nhấn Star nếu bạn thấy dự án này hữu ích!*
