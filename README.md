# IoT Smart Monitoring

Ứng dụng Next.js theo báo cáo IoT: giao diện tối cho đăng nhập/đăng ký, bảng điều khiển, 3 đèn LED, biểu đồ cảm biến, lịch sử hoạt động và hồ sơ. Các nhãn và bố cục được dựng theo các ảnh giao diện trong báo cáo.

## Chạy ứng dụng

Yêu cầu Node.js 20 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. Đăng nhập bằng tài khoản HoanIOT và mật khẩu đã cấu hình; phiên đăng nhập được lưu trong trình duyệt. Dùng `npm run build` để tạo bản production và `npm start` để chạy bản đã build.

## API mẫu

Các API Next.js trả JSON, phục vụ việc thử giao diện và thiết bị mô phỏng:

| Method | Endpoint | Chức năng |
| --- | --- | --- |
| POST | `/api/auth/login` | Tạo phiên đăng nhập demo |
| GET | `/api/sensors/latest` | Giá trị cảm biến mới nhất |
| GET | `/api/sensors/history?page=1&limit=20` | Lịch sử cảm biến phân trang |
| GET | `/api/sensors/1/chart?from=2026-09-01&to=2026-09-23` | Dữ liệu biểu đồ theo cảm biến và khoảng ngày |
| GET | `/api/devices/status` | Trạng thái 3 LED |
| GET | `/api/leds/1` | Trạng thái một LED |
| PATCH | `/api/leds/1/toggle` | Đảo trạng thái LED và ghi nhật ký |
| POST | `/api/leds/control` | Điều khiển LED với `{ "led_id": 1, "state": "ON" }` |
| GET | `/api/actions/history?page=1&limit=20` | Nhật ký bật/tắt phân trang |
| GET, PUT | `/api/schedules` | Liệt kê hoặc thêm lịch `{ "deviceId": 1, "time": "20:30", "state": "OFF" }` |
| DELETE | `/api/schedules/:id` | Xóa lịch |

## Tích hợp triển khai thật

Đây là bộ khung demo chạy độc lập. API hiện dùng dữ liệu mẫu trong bộ nhớ tiến trình nên dữ liệu sẽ trở về mặc định sau khi khởi động lại server hoặc chạy nhiều worker. API đăng nhập chỉ phát token demo, chưa có xác thực/ủy quyền hoặc lưu mật khẩu. Lệnh điều khiển LED được ghi nhật ký và trả về thông tin topic MQTT mô phỏng; chưa có MQTT broker, ESP32 hay cơ sở dữ liệu kết nối. Trước khi dùng thực tế, thay `lib/store.ts` bằng kho dữ liệu bền vững, tích hợp MQTT trong `/api/leds/control` và triển khai xác thực phù hợp.

## MySQL

Xem [hướng dẫn database](./HUONG-DAN-DATABASE.md). Có thể bật DB_DRIVER=mysql để lưu thiết bị và action, đọc dữ liệu cảm biến từ MySQL. Đăng nhập/lịch hẹn vẫn là demo; MQTT chưa kết nối. Phần mô tả dữ liệu trong bộ nhớ ở trên áp dụng khi DB_DRIVER=memory (mặc định).

