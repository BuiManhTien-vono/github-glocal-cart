# GlocalCart Mobile - Hướng Dẫn Dành Cho Frontend Team

Chào mừng đến với dự án **GlocalCart Mobile** (React Native/Expo). Để đảm bảo dự án 3 người cùng code không bị conflict và giữ được tính nhất quán, vui lòng tuân thủ nghiêm ngặt các quy tắc sau:

## 1. Cấu Trúc Thư Mục (Code vào đúng chỗ)

- `src/components/common/`: **NƠI CHỨA UI SYSTEM DÙNG CHUNG**. Chứa `Button`, `Input`, `Card`. Bất cứ ai thiết kế UI cũng phải `import` từ đây thay vì tự custom riêng. Nếu cần Component mới dùng chung (ví dụ: `Header`), tạo ở trong folder này và báo qua Slack/Zalo cho team.
- `src/components/{khối}/`: Khối của ai người nấy tạo component riêng. Ví dụ FE2 làm giỏ hàng thì tạo component con trong `src/components/shop/`. Đừng sửa component của `seller` nếu bạn không phải FE3.
- `src/screens/{Luồng}/`: Các file màn hình hoàn chỉnh (`HomeScreen.tsx`, `LoginScreen.tsx`...).
- `src/theme/colors.ts`: Bảng màu gốc của dự án. Không sử dụng mã HEX thẳng trong inline styles (`color: '#FF0000'`). Luôn dùng `colors.danger` từ file theme.

## 2. Kết Nối API Backend

- Backend đang chạy tại `GlocalCart.API`. Các Endpoint API đều có tiền tố `/api/...`.
- **IP Local**: Không sử dụng `http://localhost:5000` trong chuỗi Axios vì thiết bị ảo/đạo cụ Expo trên điện thoại sẽ không hiểu `localhost` là máy tính. Hãy trỏ thẳng vào IP LAN của Host (Ví dụ: `http://192.168.1.5:5000/api/...`). Tạo file `.env` nội bộ để lưu IP này.

## 3. Quy Tắc Tránh Conflict (Git Rules)

- **Tuyệt đối KHÔNG push thẳng lên nhánh `main`/`master`**.
- Format đặt tên nhánh: `feature/{tên-bạn}-{tên-chức-năng}`. Ví dụ: `feature/fe2-shopping-cart`.
- **Tránh sửa chung 1 file**:
  - `src/navigation/AppNavigator.tsx` là file chung. Khi cần thêm Route mới của mình, báo cho team ghép cùng lúc hoặc họp ghép 1 lần vào cuối ngày.
  - Hàng ngày, luôn checkout xuống nhánh gốc (`main`) và `git pull` bản mới nhất trước khi gộp (merge) nhánh của bạn lên. 

## 4. UI System (Sẵn Sàng Sử Dụng)

Team đã có sẵn 3 Component "chất liệu" cơ bản. Xem code cụ thể trong `src/components/common`:
- `<Button title="Bấm Nào" variant="primary" />` (Có các variant `secondary`, `danger`, `outline`, `disabled`).
- `<Input label="Email" placeholder="..." error="Lỗi rồi" />`
- `<Card elevation={3}> <Text>Nội dung</Text> </Card>` (Box nổi khối).

> **Lời tựa**: Mọi người hãy ưu tiên build màn hình bằng *Mock Data (Dữ liệu tĩnh)* cho UI mượt mà trước, rồi từ từ gọi API thật ghép vào sau. Chúc team code ít bug!
