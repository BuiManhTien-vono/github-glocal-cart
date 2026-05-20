# 📦 Thiết kế giao diện Shipper Portal – GlocalCart

> **Tài liệu luồng & giao diện chi tiết cho Shipper**  
> Dựa trên backend đã có API `/api/shipper/*` và role `Shipper`

---

## 1. Vì sao nên tách UI Shipper?

| Portal         | Đối tượng | Mục tiêu chính |
|----------------|-----------|----------------|
| `/` (shop)     | Buyer     | Mua hàng, giỏ hàng, checkout |
| `/seller/*`    | Seller    | Đóng gói, tạo vận đơn |
| `/admin/*`     | Admin     | Quản trị toàn hệ thống |
| **`/shipper/*`** | Shipper   | **Nhận đơn → giao → xác nhận** |

> Shipper không cần: duyệt sản phẩm, giỏ hàng, thanh toán.  
> Shipper chỉ cần: danh sách vận đơn, địa chỉ, SĐT, nút **Nhận / Đã giao**.

### ✅ Gợi ý triển khai UI

- **WebUI** – thêm route `#/shipper/*` (giống seller, mobile-friendly)
- **Next.js** – `src/app/shipper/layout.tsx` (guard role === 'Shipper')
- Hoặc App Mobile / PWA (tối ưu cho shipper ngoài đường)

> Hiện tại đang mở WebUI → chọn `#/shipper` hoặc Next.js đồng bộ.

---

## 2. Luồng tổng thể (cả hệ thống)

```mermaid
sequenceDiagram
    participant Buyer
    participant Backend
    participant Seller
    participant Shipper

    Buyer->>Backend: Đặt hàng (COD/CK)
    Backend->>Seller: Tạo vận đơn (Pending)
    Seller->>Backend: POST /orders/{id}/shipment
    Backend->>Shipper: GET available (Pending)
    Shipper->>Backend: accept shipment (Shipped)
    Backend->>Seller/Buyer: Thông báo
    Shipper->>Backend: deliver (Complete)
    Backend->>Buyer: Hoàn thành

Trạng thái then chốt
Giai đoạn	Order	Payment	Shipment
Vừa đặt	Pending	Unpaid / Paid (CK)	—
Bank xác nhận (CK)	Pending	Paid	—
Seller tạo vận đơn	Shipped	Paid / COD	Unshipped (chưa shipper)
Shipper nhận	Shipped	Paid / COD	Shipped (có ShipperId)
Shipper giao xong	Complete	COD → Paid	Delivered
3. Luồng chi tiết phía Shipper (UI)
3.1. Đăng nhập & vào portal
text
/shipper/login (hoặc /login redirect theo role)
       ↓
POST /api/Auth/login → JWT + role "Shipper"
       ↓
Nếu role ≠ Shipper → từ chối / chuyển về shop
       ↓
/shipper/dashboard
Tài khoản test (đã seed):

shipper / Shipper@123

Guard mọi trang shipper:

Có token JWT

user.role === 'Shipper' (hoặc Admin nếu cho phép xem thử)

3.2. Cấu trúc màn hình đề xuất
text
/shipper
├── /dashboard       ← Tổng quan hôm nay
├── /available       ← Đơn chờ nhận (chính)
├── /delivering      ← Đơn đang giao
├── /history         ← Đã giao
├── /shipment/:id    ← Chi tiết + Nhận / Giao
└── /profile         ← Đổi mật khẩu
Bottom nav (mobile-first)
Tab	Icon	API (GET)
Chờ nhận	📦	/api/shipper/shipments/available
Đang giao	🚚	/api/shipper/shipments/mine
Tài khoản	👤	profile
3.3. Màn Chờ nhận (/shipper/available)
API:
GET /api/shipper/shipments/available?page=1&pageSize=20

Mỗi card hiển thị:

Mã đơn: orderNumber

Địa chỉ: deliveryAddress (rút gọn 2 dòng)

Người nhận + SĐT: buyerName, buyerPhone (có nút gọi tel:)

Tiền thu hộ (nếu COD): totalAmount + badge COD

Mã vận đơn: trackingNumber

ETA: estimatedArrival

Hành động:

Tap card → /shipper/shipment/:id

Nút “Nhận đơn” → POST /api/shipper/shipments/{id}/accept
Body: { "note": "..." }

✅ Sau khi nhận thành công:

Toast: “Đã nhận đơn #…”

Chuyển sang tab Đang giao hoặc mở chi tiết đơn vừa nhận

Backend chỉ trả đơn đã thanh toán đủ điều kiện (CK Completed, COD được phép)

3.4. Màn Đang giao (/shipper/delivering)
API:
GET /api/shipper/shipments/mine

Mỗi card hiển thị:

Như trên + thời gian nhận: assignedAt

Badge trạng thái: ShipmentStatus = Shipped

Hành động chính:

📞 Gọi khách → tel:{buyerPhone}

🗺️ Chỉ đường → mở Google Maps với deliveryAddress

✅ Xác nhận đã giao → modal → POST /api/shipper/shipments/{id}/deliver
Body: { "note": "Giao tận tay, khách đã nhận" }

✅ Sau deliver:

Đơn biến mất khỏi “Đang giao”

Backend gửi thông báo push/in-app cho buyer

3.5. Màn Chi tiết vận đơn (/shipper/shipment/:id)
API:
GET /api/shipper/shipments/{id}

Layout gợi ý:

text
┌─────────────────────────────────┐
│ #GC-123456789        [Shipped]  │
├─────────────────────────────────┤
│ Người nhận: Nguyễn Văn A        │
│   0912 xxx xxx        [Gọi]     │
│   123 Lê Lợi, Q.1, HCM          │
│                     [Mở bản đồ] │
├─────────────────────────────────┤
│ Vận đơn: VNPOST123              │
│ Phương thức: Standard           │
│ Tổng tiền: 1.500.000 ₫          │
│ (COD: thu khi giao)             │
├─────────────────────────────────┤
│   [ Nhận đơn ] hoặc [ Đã giao ] │
└─────────────────────────────────┘
Hiển thị nút dựa trên trạng thái:

Điều kiện	Hiển thị
shipperId == null	Nhận đơn
shipperId == me && status == Shipped	Đã giao
status == Delivered	read-only (xem)
3.6. Dashboard (phase 2 – tùy chọn)
Thống kê từ danh sách hiện có:

Số đơn chờ nhận hôm nay

Số đơn đang giao

Số đơn đã giao (cần GET history hoặc filter Delivered)

4. Luồng tương tác với Buyer & Seller
Buyer (shop thường)
Theo dõi đơn: GET /api/orders, GET /api/orders/{id}/logs

Khi shipper accept → log + notification: “Đang được giao bởi …”

Khi deliver → Complete (có thể đánh giá sản phẩm)

Buyer không vào portal shipper

Seller
Xem đơn seller: GET /api/orders/seller

Sau thanh toán OK → Tạo vận đơn: POST /api/orders/{id}/shipment

Không được đánh dấu “Đã giao” (shipper làm)

Seller UI thêm trạng thái vận đơn:

Chờ shipper (Pending)

Shipper đang giao (Shipped + tên shipper)

Đã giao (Complete)

Admin
Có thể dùng cùng API shipper (Authorize Roles = Shipper, Admin)

Hoặc xem tất cả shipment trong admin (phase sau)

5. Map API – Cheat sheet
Hành động	Method	Endpoint
Đăng nhập	POST	/api/Auth/login
Danh sách chờ nhận	GET	/api/shipper/shipments/available
Đơn đang giao	GET	/api/shipper/shipments/mine
Chi tiết	GET	/api/shipper/shipments/{id}
Nhận đơn	POST	/api/shipper/shipments/{id}/accept
Giao xong	POST	/api/shipper/shipments/{id}/deliver
Thông báo (tùy chọn)	GET	/api/notifications
Header mọi request:
Authorization: Bearer {token}

6. Sắp xếp file nếu làm trên WebUI (gợi ý cụ thể)
text
GlocalCart(1).WebUI/
├── css/pages/
│   └── shipper.css
├── js/pages/
│   ├── shipper-login.js
│   ├── shipper-available.js
│   ├── shipper-delivering.js
│   ├── shipper-detail.js
│   └── shipper-dashboard.js
├── js/
│   ├── api.js (thêm shipperApi.*)
│   └── router.js (register /shipper/*)
api.js – thêm shipper API
js
shipper: {
  getAvailable: (page) => GET('/shipper/shipments/available?page=' + page),
  getMine: (page) => GET('/shipper/shipments/mine?page=' + page),
  getDetail: (id) => GET('/shipper/shipments/' + id),
  accept: (id, note) => POST('/shipper/shipments/' + id + '/accept', { note }),
  deliver: (id, note) => POST('/shipper/shipments/' + id + '/deliver', { note })
}
Sau login
js
if (role === 'Shipper') {
  router.navigate('/shipper/available')
}
7. UX / Quy tắc nghiệp vụ trên UI
Quy tắc	Mô tả
Refresh	Pull-to-refresh hoặc nút làm mới trên 2 tab chính
Xác nhận	2 bước trước “Đã giao” (tránh bấm nhầm)
COD	Hiển thị rõ “Thu tiền mặt: X ₫” trước khi deliver
Lỗi API	Hiển thị message từ envelope { success, message }
Offline (phase 2)	Queue hành động deliver khi có mạng lại
Hiển thị đơn	Không hiện đơn chưa thanh toán (CK) – backend đã lọc
8. Lộ trình triển khai đề xuất
Phase	Nội dung	Ưu tiên
1	Login shipper + guard + 2 list (available / mine) + accept / deliver	⭐ Bắt buộc
2	Chi tiết + gọi điện + maps + dashboard đơn giản	🔥 Cao
3	Lịch sử đã giao, tìm theo mã đơn, thông báo real-time	📌 Trung bình
4	GPS check-in khi deliver, ảnh POD (proof of delivery)	✨ Tùy chọn (cần API mới)
9. Kết luận
✅ Có thể và nên làm UI riêng cho Shipper

Tách route /shipper/*

Guard role Shipper

Chỉ gọi API shipper

✅ Luồng chuẩn:

Seller tạo vận đơn → Shipper thấy trong Chờ nhận → Nhận → Đang giao → Đã giao → Buyer/Seller nhận thông báo, đơn Complete