# KẾ HOẠCH CHI TIẾT FRONT-END CHO 3 DEVELOPER (React Native / Expo)
Dựa trên kiến trúc Backend (18 Bảng, 45+ Endpoints) đã hoàn thiện, dưới đây là bản phân chia task cực kỳ chi tiết dành cho 3 Frontend Developer. Việc phân chia này dựa trên nguyên tắc **giảm tối đa sự trùng lặp (overlap) giữa các components và module**.

---

## 👩‍💻 FE1: Core App, Xác thực, Hồ sơ & Khối Admin
**Quy mô nhiệm vụ**: Đóng vai trò là người đặt nền móng kiến trúc chung cho toàn App, quản lý trạng thái đăng nhập và khối lượng quyền lớn nhất (Admin).

### 1. Kiến trúc Core (Khởi tạo cùng team)
- [ ] Khởi tạo dự án bằng Expo (có thể dùng TypeScript).
- [ ] Cấu hình **React Navigation** (Tạo Bottom Tabs, Stack Navigators thống nhất).
- [ ] Thiết lập Global State (Redux Toolkit hoặc Zustand) cho luồng User (Lưu Token/Hồ sơ).
- [ ] Thiết lập Axios Interceptors: Tự động đính kèm `Bearer {token}` vào mỗi request, tự động logout khi mã lỗi 401.

### 2. Luồng Xác thực (Auth)
- [ ] Code màn hình **Splash Screen** & **Onboarding**.
- [ ] Giao diện & Logic **Login / Register**.
- [ ] Gọi API `/api/auth/login` và `/api/auth/register`, lưu Token vào SecureStore.

### 3. Luồng Cá nhân hóa (Profile)
- [ ] Giao diện **Thông tin cá nhân (Profile Tab)**. Gọi API `/api/users/profile`.
- [ ] Logic Update Profile và Đổi mật khẩu.
- [ ] Quản lý Sổ địa chỉ (Address Book): Form thêm/sửa/xóa định vị và chọn địa chỉ mặc định (gọi `/api/users/addresses`).
- [ ] Quản lý Ví/Thanh toán: Giao diện thêm Thẻ tín dụng/Tài khoản Ngân hàng mô phỏng (gọi `/api/users/credit-cards`).
- [ ] Giao diện + gọi API Đăng ký trở thành Người bán (`/api/users/activate-seller`).

### 4. Luồng Quản trị viên (Admin Dashboard)
- [ ] Màn hình **Admin Dashboard** (Xem tổng users, sellers, doanh thu...). 
- [ ] Giao diện Quản lý Danh mục (Thêm, Sửa, Xóa Categories).
- [ ] Duyệt người dùng: Đổi status Account (Active/Banned), duyệt/hủy quyền Seller.
- [ ] Quản lý Cửa hàng: Cho phép Admin khóa (Lock) các sản phẩm vi phạm của Seller.

---

## 👨‍💻 FE2: Shopping Flow, Trưng bày & Thanh toán
**Quy mô nhiệm vụ**: Mang đến trải nghiệm lôi cuốn và mượt mà nhất. Đóng vai trò quyết định vòng đời mua sắm từ lúc khách hàng thấy sản phẩm đến lúc trả tiền.

### 1. Luồng Home & Tìm kiếm (Khám phá)
- [ ] **Home Screen**: Giao diện đẹp mắt với banner, slide, danh mục (Categories).
- [ ] Danh sách sản phẩm nổi bật/mới nhất (Dựa vào CatalogProducts).
- [ ] **Trang Search & Lọc**: Thanh tìm kiếm, component Lọc theo Giá/Categories. Gọi API `/api/products/search`.

### 2. Luồng Chi tiết sản phẩm
- [ ] **Product Details**: Slide ảnh sản phẩm, thông tin mô tả, giá cả, số lượng tồn kho (AvailableItemCount).
- [ ] Hiển thị danh sách đánh giá/Review 5 sao từ người dùng khác.
- [ ] Component chọn Số lượng mua và nút **Add to Cart**. 

### 3. Giỏ hàng đa luồng (Guest & Member)
- [ ] **Cart Screen**: Quản lý state giỏ hàng. 
- [ ] *Logic Guest*: Giỏ hàng lưu offline bằng `AsyncStorage` / `Zustand persist` (Khi user chưa đăng nhập).
- [ ] *Logic Sync*: Khi User vừa đăng nhập xong, đẩy toàn bộ giỏ offile lên DB (Gọi API `/api/cart/sync`).
- [ ] Cập nhật số lượng (+, -), xóa item. Bắt lỗi vượt số lượng tồn kho.

### 4. Luồng Thanh toán (Checkout)
- [ ] Màn hình **Checkout**: Component gộp tóm tắt đơn hàng.
- [ ] Cho phép người dùng chọn 1 trong các địa chỉ giao hàng sẵn có (từ luồng Profile của FE1).
- [ ] Màn hình chọn Phương thức thanh toán (Credit/Bank).
- [ ] Gọi API Tạo Đơn gộp (`/api/orders`). Nếu rỗng tồn kho, báo lỗi. Thành công chuyển hướng sang màn hình Success.

---

## 👨‍💻 FE3: Kênh Người bán (Seller) & Quản lý Đơn hàng
**Quy mô nhiệm vụ**: Thao tác vận hành. Quản trị vòng đời đơn hàng cho cả người bán lẫn người mua, cộng thêm hệ thống notification realtime/pulling.

### 1. Kênh Người bán (Seller Center)
- [ ] **Seller Dashboard**: Nơi tổng hợp các số liệu riêng của Seller.
- [ ] **Quản lý Sản phẩm**: Form đăng bán sản phẩm mới (chọn Categories, nhập stock, hình ảnh...). Gọi API `/api/products` (POST/PUT).
- [ ] Bật/tắt trạng thái hiển thị của sản phẩm (Toggle Visibility).

### 2. Quản lý Đơn hàng (Seller)
- [ ] Danh sách đơn khách đã đặt. Lọc theo trạng thái Pending, Shipped...
- [ ] Màn hình xem chi tiết Order. Nút xác nhận giao hàng / Nút Hủy (Kèm lý do Reject).
- [ ] Giao diện form **Cập nhật Vận chuyển (Shipments)**: Nhập ngày gửi, mã Tracking (Gửi call`/api/orders/{id}/shipment`).
- [ ] Sau khi tạo Shipment, có thể chuyển trạng thái từ Shipped -> Delivered.

### 3. Lịch sử Đơn hàng & Audit (Buyer)
- [ ] Màn hình **Lịch sử mua hàng**: My Orders ở bên phía giao diện Buyer.
- [ ] Giao diện **Theo dõi vận đơn (Order Tracking Flow)**: Dùng timeline component (vertical tracker) để vẽ lại thời gian bằng list `OrderLogs` và `ShipmentLogs`.
- [ ] Giao diện **Đánh giá (Review Form)**: Giao diện Rating 5 sao, chỉ xuất hiện ở các đơn hàng có trạng thái `Complete`.

### 4. Hệ thống Thông báo (Notifications)
- [ ] Màn hình/chuông Notification. Kéo danh sách Notification từ API phía backend.
- [ ] Đánh dấu đã đọc báo cáo tin nhắn (Mark As Read), Hiển thị Badge Count chưa đọc lên App Icon/Tab bar.

---

## 🛠 Lời khuyên Chung để Tránh Hỏng/Xung Đột Code (Cả 3 FE)
1. **Chia UI System rõ ràng**: Trước khi tách việc, 3 người hãy họp lại để thiết kế bộ **UI Component dùng chung** trong thư mục `/src/components/common` (Ví dụ: `Button`, `TextInput`, `Card`, `Header`).
2. **Quy tắc React Navigation**: Lưu toàn bộ tên route ở một file `routes.ts` duy nhất để link chéo giữa các màn hình không bị lỗi typo.
3. **Branching trong Git**: 
   - FE1 rẽ nhánh `feature/auth-and-profile`
   - FE2 rẽ nhánh `feature/shopping-cart`
   - FE3 rẽ nhánh `feature/seller-orders`
4. Base URL duy nhất ở `.env` trỏ vào `http://[IP-MÁY-TÍNH]:5000` (đừng dùng localhost do Expo chạy qua điện thoại/máy ảo cần IP thật mạng LAN).
