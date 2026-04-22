# Yêu cầu Kiến trúc & Nghiệp vụ Hệ thống GlocalCart

Dưới đây là tổng hợp toàn bộ những nội dung chính, nghiệp vụ cốt lõi và các yêu cầu kỹ thuật cần thiết để xây dựng nền tảng thương mại điện tử **GlocalCart** dựa theo tài liệu phân tích đã cung cấp.

---

## 1. Tổng quan dự án

- **Tên dự án**: GlocalCart.
- **Định hướng**: Nền tảng Thương mại Điện tử Đa nền tảng theo mô hình **Marketplace (Multi-vendor)**.
- **Mục tiêu**: Người dùng vừa có thể đóng vai trò mua hàng (Buyer), vừa có thể đóng vai trò bán hàng (Seller) trên cùng một tài khoản và nền tảng.

---

## 2. Đối tượng Người dùng & Phân cấp Chức năng

Hệ thống xoay quanh 3 nhóm người dùng chính yếu:

### 2.1. Khách (Guest)
Người dùng vãng lai chưa cấu hình tài khoản cá nhân:
- **Khám phá sản phẩm**: Xem danh sách theo danh mục, tìm kiếm, lọc nội dung, xem chi tiết và đọc đánh giá.
- **Giỏ hàng tạm thời**: Thêm/bớt số lượng, xóa thông tin sản phẩm tự do trong phiên truy cập.
- **Yêu cầu Xác thực**: Bắt buộc tạo tài khoản hoặc đăng nhập khi muốn thanh toán đặt hàng hoặc đăng bán sản phẩm.

### 2.2. Thành viên (Member)
Người dùng đã xác thực hệ thống, có thể thao tác đồng thời 2 vai trò song song:

**Vai trò Người mua (Buyer)**
- **Quản lý Tài khoản**: Đăng ký, đăng nhập và quản lý Profile cơ bản.
- **Giỏ hàng**: Đồng bộ dữ liệu giỏ hàng tạm thời từ phiên Guest sang giỏ hàng cá nhân chính thức.
- **Tiến hành Đặt hàng**: Thiết lập địa chỉ nhận hàng, lựa chọn phương thức thanh toán (chỉ mô phỏng).
- **Quản lý Đơn hàng**: Theo dõi trạng thái đơn hàng (`Pending` -> `Shipped` -> `Delivered` hoặc `Cancelled`).
- **Tương tác**: Có quyền hủy đơn khi chưa vận chuyển, viết Rating & Review khi đơn hàng đã thành công (trạng thái Delivered).

**Vai trò Người bán (Seller)**
- **Mở tính năng Bán hàng**: Đăng ký kích hoạt thành Seller tại tài khoản hiện có.
- **Quản trị Sản phẩm cá nhân**: Đăng tải mặt hàng (tên, giá, hình ảnh..), cập nhật nội dung, tạm ẩn hoặc mở bán lại sản phẩm.
- **Quản lý Giao dịch Bán**: Theo dõi các đơn khách mua hàng của mình. Xử lý từ chối/hủy đơn trước khi vận chuyển để xử lý sự cố.
- **Kiểm soát Tồn kho**: Chủ động cập nhật và duy trì số lượng tồn kho hợp lệ. 

### 2.3. Quản trị viên (Admin)
Người vận hành, giám sát dữ liệu nền tảng:
- **Quản trị Hệ thống**: Khởi tạo phân luồng danh mục sản phẩm, quản lý User và cấp quyền Seller.
- **Kiểm duyệt**: Theo dõi các sản phẩm của Seller, chủ động ẩn hoặc khóa tài khoản vi phạm.
- **Điều phối Giao dịch**: Theo dõi tổng quan kho hàng và dòng đời ngoại lệ đơn hàng; can thiệp ghi đè cập nhật trạng thái nếu cần bảo trì.

---

## 3. Kiến trúc Hệ thống & Ngăn xếp Công nghệ (Tech Stack)

Hệ thống được thiết kế hướng tiếp cận 3 tầng (3-tier) thống nhất mã nguồn đa hệ điều hành:

- **Frontend (Giao diện Mobile)**:
  - Framework: **React Native** kết hợp nền tảng **Expo**.
  - Quản trị State & Local Storage: Sử dụng **Context API**, kết hợp **AsyncStorage/SecureStore** trong cache giỏ hàng và JWT.
  
- **Backend (API Data Processing)**:
  - Nền tảng: **C# ASP.NET Core**
  - Mô hình tiếp cận: **RESTful API**.
  
- **Cơ sở dữ liệu (Database)**:
  - Hệ quản trị DBMS: **SQL Server** .

---

## 4. Các Yêu cầu Phi chức năng Quan trọng

- **Hiệu năng hoạt động**: Tối ưu tốc độ tải và query các thao tác cốt lõi.
- **Tính chịu lỗi (Fault Tolerance) & Log Error**: Bọc cơ chế `try-catch` xuyên suốt, ngăn chia xử lý Error rõ ràng giữa BE (Ghi Log) và FE (Báo Alert thông minh).
- **Tính bảo mật**: Phân quyền Role Account và Authentication API minh bạch, an toàn qua Token Secure.
- **Tính nhất quán CSDL**: Kho hàng (kho DB) và Trạng thái App/Đơn luôn khớp thời gian thực.
- **Tính bảo trì Mã nguồn**: Quy tắc không code "Black-box", ngay cả khi dùng AI Copilot hỗ trợ cũng phải đảm bảo comment hiểu logic để có khả năng thuyết trình.

---

## 5. Giới hạn Phạm vi Thực hiện Đồ án (In/Out-of-Scope)

- **In-Scope (Phạm vi triển khai)**: Đảm bảo luồng giao dịch 2 chiều Buyer-Seller thông suốt, cơ chế duyệt Admin, cấu hình hoàn chỉnh các trạng thái vòng đời đặt đơn chuẩn hóa `Pending -> Shipped -> Delivered`.
- **Out-of-Scope (Phạm vi từ chối)**: Không phát triển cổng thanh toán qua thẻ tín dụng/ví điện tử tiền cấu thực; không nhúng luồng Streaming Live Video nạp vào Server; không áp dụng máy học AI khuyến nghị; không phân tính toán tiền vận chuyển hay chiết khấu phức tạp ra đối tác thứ ba.
