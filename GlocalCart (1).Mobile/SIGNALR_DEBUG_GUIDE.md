# SignalR Connection Debug Guide

## Lỗi: ENOTFOUND - Failed to complete handshake with the server

### Nguyên nhân chính

1. **Backend API không chạy** trên cổng 5100
2. **IP Address sai** - không phù hợp với mạng hiện tại
3. **Firewall chặn** kết nối
4. **Token xác thực không hợp lệ**

---

## Các bước khắc phục

### 1. Kiểm tra Backend API đã chạy chưa

#### Trên Windows:

```powershell
# Kiểm tra xem cổng 5100 đang nghe không
netstat -ano | findstr :5100

# Nếu không có kết quả, chạy backend
cd "GlocalCart (1).API"
dotnet run --launch-profile "https"
```

#### Trên Mac/Linux:

```bash
# Kiểm tra cổng 5100
lsof -i :5100

# Chạy backend
cd "GlocalCart (1).API"
dotnet run --launch-profile "https"
```

### 2. Tìm IP Address chính xác

#### Trên Windows:

```powershell
ipconfig
```

Tìm dòng "IPv4 Address" trong "Wireless LAN adapter" hoặc "Ethernet adapter"
Ví dụ: `192.168.1.100`

#### Trên Mac:

```bash
ifconfig
```

#### Trên Linux:

```bash
hostname -I
```

### 3. Cập nhật Config

**File:** `GlocalCart (1).Mobile/src/services/api/config.ts`

```typescript
// Nếu dùng localhost (local machine)
export const API_HOST = "localhost";

// Nếu dùng IP thực tế (device khác hoặc emulator)
export const API_HOST = "192.168.1.XXX"; // Thay XXX bằng IP của máy Backend
```

### 4. Kiểm tra CORS được bật

Backend `Program.cs` đã có CORS:

```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.SetIsOriginAllowed(_ => true).AllowAnyMethod().AllowAnyHeader().AllowCredentials();
    });
});
```

Điều này cho phép mọi client kết nối. ✅

### 5. Xác thực Token

Kiểm tra xem token được lưu đúng trong SecureStore:

```typescript
// Trong app khởi chạy
const token = await getSecureItem("auth_token");
console.log("[Auth] Token exists:", !!token);
```

---

## Testing SignalR Connection

### Trên Browser (http://localhost:5100/swagger)

1. Mở Swagger UI
2. Login để lấy JWT token
3. Test endpoint API để xác nhận server chạy bình thường

### Trên Mobile/Emulator

1. Mở Console
2. Xem logs từ `[SignalR]` prefix
3. Kiểm tra URL được tạo: `[Config] Using API_URL: ...`

---

## Thông báo Lỗi Thường Gặp

| Lỗi                  | Nguyên nhân                     | Giải pháp                         |
| -------------------- | ------------------------------- | --------------------------------- |
| `ENOTFOUND`          | Backend không chạy hoặc IP sai  | Kiểm tra backend, cập nhật IP     |
| `401 Unauthorized`   | Token không hợp lệ hoặc hết hạn | Đăng nhập lại                     |
| `403 Forbidden`      | User không có quyền             | Kiểm tra role User trong database |
| `Connection refused` | Firewall chặn hoặc port sai     | Kiểm tra firewall, port 5100      |

---

## Logs để theo dõi

```
[Config] Using API_URL: http://localhost:5100/api
[SignalR] Initializing connection to http://localhost:5100/hubs/delivery
[SignalR] Starting connection...
[SignalR] Connection started successfully
```

Nếu không thấy log trên, SignalR chưa được gọi.

---

## Quick Fix Checklist

- [ ] Backend API đang chạy trên port 5100?
- [ ] IP Address đúng trong config.ts?
- [ ] User đã đăng nhập (có token)?
- [ ] Firewall không chặn port 5100?
- [ ] Network của device và backend cùng LAN?
- [ ] Đã restart app sau khi thay đổi config?

---

## Hỗ trợ thêm

Nếu vẫn không giải quyết được, kiểm tra:

1. Console errors trong VS Code
2. Network tab trong DevTools (nếu web)
3. Backend logs trong terminal
4. Database connection (SQL Server)
