# Kế Hoạch Phân Phối Công Việc Dự Án GlocalCart
**Đội ngũ:** 5 thành viên (2 Backend, 3 Frontend)
**Mục tiêu:** Chia để trị các modules, giảm thiểu sự phụ thuộc chéo (cross-dependency) và tránh xung đột code (merge conflict).

---

## 1. PHÂN CÔNG BACKEND (ASP.NET Core & SQL Server)
Hai Backend Developer (BE1 và BE2) cần thống nhất **Thiết kế Cơ sở dữ liệu (ERD)** và **Chuẩn Cấu trúc API (RESTful, Middleware bắt lỗi)** trước khi bắt tay vào code.

### 👤 BE1: Quản trị Hệ thống, Xác thực & Tương tác
**Vai trò:** Đảm bảo hệ thống hoạt động bảo mật, quản lý luồng dữ liệu nền tảng và người dùng.
- **Thiết lập Core:** Cấu hình chuẩn kết nối database, Dependency Injection, JWT Bearer Authentication & xử lý Role (Guest, Buyer, Seller, Admin).
- **Module User & Auth:** API Đăng ký, Đăng nhập, Quản lý Profile, Đổi mật khẩu.
- **Module Admin:** API quản lý Danh mục (Categories), API kiểm duyệt/khóa tài khoản, API khóa sản phẩm.
- **Module Tương tác:** API Đánh giá & Phản hồi (Rating & Review) sau khi mua hàng.

### 👤 BE2: Quy trình Thương mại & Giao dịch
**Vai trò:** Quản lý toàn bộ vòng đời sản phẩm và tiến trình mua bán (Shopping Flow).
- **Module Sản phẩm:** API CRUD Sản phẩm cho Seller, API Tìm kiếm/Lọc/Xem danh sách sản phẩm cho Guest & Buyer.
- **Module Giỏ hàng & Tồn kho:** API Giỏ hàng (Đồng bộ giỏ hàng từ Guest lên Database khi đăng nhập), API cập nhật tồn kho an toàn.
- **Module Đơn hàng (Orders):** API Tạo đơn hàng (Checkout), API cập nhật trạng thái đơn (Pending -> Shipped -> Delivered/Cancelled).
- **Module Quản lý đơn Seller:** API liệt kê đơn khách hàng đặt, API Từ chối/Hủy đơn.

---

## 2. PHÂN CÔNG FRONTEND (React Native & Expo)
Ba Frontend Developer (FE1, FE2, FE3) cần thống nhất **Cấu trúc thư mục**, **Chỉnh sửa Theme chung (Màu sắc, Typography)**, và **Tạo các UI Component tái sử dụng (Button, Input, Card)** trước. 

### 👤 FE1: Core App, Xác Thực & Admin Panel
**Vai trò:** Xây dựng "bộ khung" của ứng dụng và các luồng quản trị.
- **Thiết lập Khung (Core):** Cài đặt React Navigation, Redux/Context API cho trạng thái Auth toàn cục. Cấu hình Axios Interceptors gán token.
- **Luồng Xác thực:** Màn hình Splash, Đăng nhập, Đăng ký, Quên mật khẩu.
- **Luồng Hồ sơ (Profile):** Màn hình thông tin cá nhân, cài đặt tài khoản, đăng ký làm Seller.
- **Luồng Admin:** Các màn hình quản trị nội bộ dành cho Admin (Duyệt/Quản lý danh mục, Quản lý User/Sản phẩm vi phạm).

### 👤 FE2: Khám Phá Sản Phẩm & Luồng Mua Hàng
**Vai trò:** Phụ trách trải nghiệm của Guest và Buyer.
- **Luồng Khám phá:** Màn hình Trang chủ (Home), Màn hình Danh mục, Thanh tìm kiếm và bộ Lọc sản phẩm.
- **Luồng Chi tiết:** Màn hình Chi tiết sản phẩm (Hình ảnh, mô tả) + Giao diện đọc Nhận xét & Đánh giá.
- **Luồng Giỏ hàng (Cart):** Màn hình Giỏ hàng (Xử lý lưu tạm bằng AsyncStorage khi chưa đăng nhập và fetch API khi đã đăng nhập).
- **Luồng Thanh toán (Checkout):** Màn hình nhập địa chỉ giao hàng, phương thức thanh toán mô phỏng và Xác nhận đặt hàng.

### 👤 FE3: Quản Lý Bán Hàng (Seller Center) & Theo Dõi Đơn Hàng
**Vai trò:** Phụ trách trải nghiệm của Seller và tính năng Tracking giao dịch.
- **Khu vực của Seller:** Màn hình Trang tổng quan (Seller Dashboard) quản lý nghiệp vụ.
- **Quản lý Sản phẩm Seller:** Form Đăng sản phẩm mới, Danh sách sản phẩm của tôi, Cập nhật thông tin/tồn kho.
- **Quản lý Đơn của Seller:** Màn hình tiếp nhận đơn đặt hàng của khách, Xử lý giao hàng / Từ chối (Lý do).
- **Luồng Lịch sử đơn hàng (Buyer):** Màn hình "Đơn hàng của tôi" (Tra cứu tiến trình Pending -> Delivered), Form đánh giá sản phẩm.

---

## 3. CHIẾN LƯỢC TRÁNH XUNG ĐỘT (Conflict Prevention)

Để 5 người chạy song song dự án mượt mà:
1. **API Contract First (Mocking Data)**
   - BE và FE phải họp thống nhất JSON Schema (Input/Output) bằng Swagger/Postman trước khi viết code.
   - FE có thể dùng dữ liệu giả (Mock JSON) để thiết kế UI mà không cần đợi BE song API.
2. **Quy trình Git / GitHub (Git Flow)**
   - Không ai code thẳng vào `main`. Mỗi task tạo nhánh riêng biệt (VD: `feature/fe2-shopping-cart`, `feature/be1-auth`).
   - FE mỗi người nhận 1 luồng màn hình riêng biệt -> Tránh sửa chung 1 file màn hình gây conflict. Mọi người import Component dùng chung thay vì tự copy HTML/CSS.
3. **Thống Nhất Biến Môi Trường (.env)**
   - Đảm bảo File cấu hình `.env` không đẩy lên Git. Các quy ước đường dẫn API cần được lưu trong hằng số định tuyến.
