# Kế Hoạch Phân Chia Công Việc Front-end Mobile (2 Thành Viên)

Dựa trên cấu trúc dự án GlocalCart và các tài liệu hiện có, việc phân chia công việc cho 2 người cần đảm bảo tính độc lập để tránh xung đột code, đồng thời tối ưu hóa tốc độ phát triển. 

Dưới đây là phương án chia việc theo mô hình: **Người dùng (Buyer/Core)** và **Quản trị (Seller/Admin)**.

---

### 👤 Thành viên A: Core App & Trải nghiệm Người mua (Buyer Flow)
**Trọng tâm:** Chịu trách nhiệm về "bộ khung" của ứng dụng và toàn bộ luồng từ lúc khách hàng tìm kiếm đến khi mua hàng thành công.

**1. Nền tảng & Xác thực (Core & Auth):**
- Thiết lập/Bảo trì Navigation (Bottom Tabs, Stacks).
- Quản lý trạng thái toàn cục (Zustand/Redux) cho User và Cart.
- Luồng Đăng nhập, Đăng ký, Quên mật khẩu.
- Màn hình Splash và Giới thiệu (Onboarding).

**2. Luồng Mua sắm (Shopping Flow - TRỌNG TÂM):**
- **Trang chủ (Home Screen):** Banner khuyến mãi, danh sách danh mục tròn, danh sách sản phẩm gợi ý (Daily Discover).
- **Tìm kiếm & Khám phá:** Thanh tìm kiếm, bộ lọc theo giá/danh mục, màn hình kết quả tìm kiếm.
- **Chi tiết sản phẩm:** Xem ảnh, mô tả, chọn số lượng, xem đánh giá của người dùng khác.

**3. Giao dịch & Cá nhân hóa (Transaction & Profile):**
- Giỏ hàng (Cart): Xử lý lưu local (Guest) và đồng bộ API (Member).
- Luồng Thanh toán (Checkout): Địa chỉ, Phương thức thanh toán, Xác nhận.
- Hồ sơ cá nhân: Thông tin tài khoản, Sổ địa chỉ, Lịch sử mua hàng (phía người mua).

---

### 👤 Thành viên B: Hệ thống Quản trị (Seller & Admin Panel)
**Trọng tâm:** Chịu trách nhiệm về các giao diện quản lý, xử lý dữ liệu lớn, các biểu mẫu (forms) và thống kê.

**1. Kênh Người bán (Seller Center):**
- Đăng ký trở thành Người bán.
- Dashboard Seller: Thống kê doanh thu, đơn hàng của Shop.
- Quản lý Sản phẩm (Seller): Thêm mới sản phẩm, Sửa/Ẩn sản phẩm, Quản lý tồn kho.
- Quản lý Đơn hàng (Seller): Tiếp nhận đơn, cập nhật trạng thái vận chuyển, hủy đơn.

**2. Hệ thống Quản trị (Admin Panel):**
- Dashboard Admin: Thống kê toàn hệ thống.
- Quản lý Danh mục (Categories): CRUD danh mục sản phẩm toàn sàn.
- Quản lý Người dùng & Seller: Duyệt yêu cầu làm seller, khóa/mở tài khoản vi phạm.
- Kiểm duyệt Sản phẩm: Khóa các sản phẩm vi phạm chính sách.

**3. Tiện ích & Hỗ trợ kỹ thuật:**
- **Hệ thống Thông báo (Notifications):** Danh sách thông báo đẩy/trong app.
- **Xử lý Hình ảnh:** Logic upload ảnh sản phẩm (cho Seller).
- **Phát triển UI Kit:** Xây dựng các UI Component dùng chung (Buttons, Inputs, Modals, Cards) để đồng bộ giao diện toàn app.

---

### 🚀 Tại sao cách chia này lại "Khoa học"?

1.  **Hạn chế xung đột (Conflict):** Thành viên A làm chủ yếu trong thư mục `src/screens/Shop`, `src/screens/Auth`, `src/screens/Profile`. Thành viên B làm trong `src/screens/Seller` và `src/screens/Admin`. Hai người rất ít khi phải sửa chung một file màn hình.
2.  **Tính nhất quán về Logic:** Thành viên A tập trung vào luồng chuyển đổi (Conversion Flow) - nơi trải nghiệm người dùng là quan trọng nhất. Thành viên B tập trung vào luồng quản trị (CRUD Flow) - nơi tính chính xác của dữ liệu và hiệu quả xử lý được ưu tiên.
3.  **Tái sử dụng Component:** Thành viên B có thể xây dựng các Component dùng chung (ví dụ: một Card sản phẩm linh hoạt) để cả hai cùng sử dụng, giúp giao diện đồng bộ 100%.

### ✅ Trả lời câu hỏi: "Làm xong hết đống này app đã chạy được chưa?"

**Câu trả lời là: HOÀN TOÀN ĐỦ.** 

Sau khi hai bạn hoàn thành các phần trên, ứng dụng sẽ có đầy đủ các trụ cột sau:
1.  **Hệ thống Định danh:** Người dùng có thể đăng ký, đăng nhập và phân quyền (Buyer/Seller/Admin).
2.  **Luồng Kinh doanh chính:** Khách vào xem hàng -> Thêm giỏ -> Thanh toán -> Theo dõi đơn.
3.  **Kênh Vận hành:** Người bán có thể đăng hàng và quản lý đơn khách đặt.
4.  **Kênh Quản trị:** Admin có thể kiểm soát toàn bộ sàn giao dịch.

**Lưu ý quan trọng:** 
- Phần **Trang chủ (Home)** đã được giao cho **Thành viên A** (thuộc mục Shopping Flow). Đây là bộ mặt của App nên cần đầu tư kỹ về UI.
- Để app chạy mượt nhất, hai bạn nên thống nhất sớm về **Base URL** của API trong file `.env` hoặc `apiClient.ts`.
