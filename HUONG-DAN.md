# Hướng dẫn chạy và đăng nhập hệ thống IoT

## 1. Chuẩn bị

- Cài Node.js phiên bản 22.9 trở lên.
- Mở Terminal hoặc PowerShell tại thư mục dự án `IOT`.

## 2. Cài đặt và chạy

Chạy các lệnh sau lần đầu tiên:

```bash
npm install
npm run dev:be
# Mở terminal khác tại thư mục gốc:
npm run dev:fe
```

Khi Terminal báo máy chủ đã sẵn sàng, mở trình duyệt tại:

```text
http://localhost:3000
```

Để dừng ứng dụng, quay lại Terminal và nhấn `Ctrl + C`.

## 3. Đăng nhập

Ở màn hình đăng nhập, nhập:

- **Tên đăng nhập:** `HoanIOT`.
- **Mật khẩu:** dùng mật khẩu đã yêu cầu khi tạo tài khoản.

Bấm **Đăng nhập** để vào bảng điều khiển. Tài khoản HoanIOT được lưu cố định trong `BE/src/data/account.json` với mật khẩu băm scrypt; không mất khi khởi động lại server và không cần MySQL. API kiểm tra đúng mật khẩu trước khi đăng nhập. Phiên đăng nhập vẫn là phiên demo; chưa có cơ chế phân quyền API.

## 4. Tạo tài khoản demo

Nếu muốn dùng màn hình đăng ký:

1. Bấm **Đăng ký ngay**.
2. Nhập họ tên, email, mật khẩu và xác nhận mật khẩu.
3. Mật khẩu cần có ít nhất 6 ký tự; hai ô mật khẩu phải giống nhau.
4. Bấm **Tạo tài khoản**.

Đăng ký sẽ tạo phiên đăng nhập demo và chuyển vào ứng dụng. Dữ liệu tài khoản chỉ nằm trong bộ nhớ của tiến trình máy chủ, nên sẽ mất khi khởi động lại server.

## 5. Sử dụng các màn hình

- **Bảng điều khiển:** xem trạng thái thiết bị, bật/tắt từng LED hoặc dùng nút Bật tất cả/Tắt tất cả.
- **Cảm biến dữ liệu:** xem các bản ghi mẫu, lọc theo cảm biến và xuất CSV.
- **Lịch sử hoạt động:** tìm kiếm/lọc sự kiện bật tắt và xuất CSV.
- **Hồ sơ cá nhân:** lưu thông tin và liên kết trong trình duyệt; sau khi lưu có thể bấm mở link hoặc chuột phải để sao chép địa chỉ.
- Bấm biểu tượng đăng xuất ở góc dưới thanh bên để đăng xuất.

## 6. Nếu trang không mở được

- Kiểm tra Terminal vẫn đang chạy `npm run dev:be` và `npm run dev:fe` và không báo lỗi.
- Đảm bảo mở đúng `http://localhost:3000`.
- Nếu cổng 3000 đã được ứng dụng khác sử dụng, Next.js sẽ báo địa chỉ/cổng khác trong Terminal; mở địa chỉ được báo.
- Nếu vừa tải mã nguồn về máy mới, chạy `npm install` trước `npm run dev:be` và `npm run dev:fe`.

## Lưu ý

Đây là bản demo học tập. API dùng dữ liệu trong bộ nhớ; trạng thái và nhật ký được đặt lại khi server khởi động lại. MQTT, ESP32 và cơ sở dữ liệu thật chưa được cấu hình. Không dùng mật khẩu thật hoặc thông tin cá nhân nhạy cảm trong bản demo này.

## 7. Database MySQL

Xem [HUONG-DAN-DATABASE.md](./HUONG-DAN-DATABASE.md) để tạo database mới, xóa người thực hiện/kết quả lệnh khỏi bảng action của database cũ và cấu hình kết nối. Chế độ memory vẫn là mặc định. Khi chọn MySQL, thiết bị, action và dữ liệu cảm biến được đọc từ database; đăng nhập và lịch hẹn vẫn là demo.


