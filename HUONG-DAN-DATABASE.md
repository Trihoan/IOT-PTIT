# Tạo database và kết nối MySQL

## 1. Chuẩn bị

Cài MySQL Server 8 và MySQL Workbench, khởi động dịch vụ MySQL. Trong PowerShell ở thư mục IOT chạy `npm.cmd install`.

## 2. Database mới

Trong Workbench kết nối bằng tài khoản quản trị, mở `BE/database/create-database.sql` và Execute toàn bộ. Script tạo database `iot_monitoring`, các bảng users, sensors, devices, data_sensors, action; khởi tạo 3 LED và 3 loại cảm biến.

Bảng `action` chỉ lưu `action_id`, `device_id`, `action_type` (ON/OFF), `timestamp`. Không lưu người thực hiện hoặc kết quả lệnh. `devices.status` vẫn giữ để lưu trạng thái bật/tắt thiết bị.

Tạo tài khoản kết nối ứng dụng bằng SQL sau, thay mật khẩu trước khi chạy:

```sql
CREATE USER 'iot_app'@'127.0.0.1' IDENTIFIED BY 'THAY_MAT_KHAU_CUA_BAN';
GRANT SELECT, INSERT, UPDATE, DELETE ON iot_monitoring.* TO 'iot_app'@'127.0.0.1';
```

Nếu tài khoản đã có, dùng ALTER USER thay CREATE USER.

## 3. Cập nhật database cũ

Sao lưu trước khi chạy vì giá trị trong các cột bị xóa sẽ mất. Chọn đúng database làm default schema trong Workbench, mở và chạy `BE/database/remove-action-details.sql`. Script tự bỏ khóa ngoại liên quan rồi xóa `user_id`, `triggered_by`, `status` khỏi bảng `action`, giữ các bản ghi và cột còn lại. Có thể chạy lại mà không xóa trùng. Nếu bảng cũ tên `actions`, đổi tên bảng trong script và truy vấn tại `BE/src/lib/devices.ts` cho thống nhất.

Không chạy script thêm action.status của phiên bản cũ. Schema tạo mới không tự thay đổi các bảng đã có; database cũ cần chạy migration ở trên trước khi điều khiển thiết bị.

## 4. Kết nối ứng dụng

```powershell
Copy-Item BE/.env.example BE/.env.local
```

Sửa `BE/.env.local`:

```dotenv
MQTT_SIMULATION=false
DB_DRIVER=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=iot_monitoring
DB_USER=iot_app
DB_PASSWORD=THAY_MAT_KHAU_CUA_BAN
```

Nếu mật khẩu chứa #, đặt giá trị trong dấu nháy kép. File BE/.env.local đã được gitignore. Sau khi đổi cấu hình phải khởi động lại server.

Kiểm tra kết nối với Node.js 20.12 trở lên:

```powershell
node --env-file=BE/.env.local BE/scripts/check-database.mjs
npm.cmd run dev:be
# Terminal khác: npm.cmd run dev:fe
```

Mở http://localhost:3000. Bật/tắt từng LED hoặc dùng Bật tất cả/Tắt tất cả ở dashboard. Mỗi thiết bị có một bản ghi lịch sử; thao tác tất cả xử lý lần lượt từng thiết bị.

```sql
USE iot_monitoring;
SELECT * FROM `action` ORDER BY action_id DESC;
SELECT * FROM devices;
```

Khởi động lại server để kiểm tra trạng thái và lịch sử vẫn còn. Đặt `DB_DRIVER=memory` để chạy demo không cần MySQL. Khi chọn MySQL, lỗi kết nối không tự chuyển về dữ liệu demo.

## 5. Phạm vi hiện tại

API thiết bị, điều khiển, lịch sử action và đọc cảm biến hỗ trợ MySQL. Điều khiển hiện vẫn là mô phỏng, chưa gửi MQTT đến ESP8266. Database mới chưa có dữ liệu đo; biểu đồ ở dashboard vẫn là minh họa. Trang cảm biến chỉ còn thống kê và bảng dữ liệu, lịch sử chỉ còn bảng sự kiện.

Tài khoản HoanIOT được lưu bằng mật khẩu băm tại BE/src/data/account.json, không phụ thuộc MySQL. Đăng ký mới và lịch hẹn vẫn dùng bộ nhớ; phiên đăng nhập vẫn là demo. Hồ sơ và liên kết dự án lưu trong localStorage của trình duyệt đang dùng, không đồng bộ qua máy khác. Sau khi lưu, bấm liên kết để mở tab mới hoặc chuột phải chọn sao chép địa chỉ liên kết; dùng Chỉnh sửa liên kết để sửa URL.

Sketch ESP8266 dùng hoan/sensor/telemetry, hoan/device/control, hoan/device/ack. ESP kết nối Mosquitto, không kết nối trực tiếp MySQL; tiến trình backend nhận telemetry và ACK chưa được triển khai.

## 6. Khắc phục lỗi

- ECONNREFUSED: kiểm tra dịch vụ MySQL, địa chỉ và cổng.
- Access denied: kiểm tra user, mật khẩu và host trong GRANT.
- Unknown database/table/column: chạy schema hoặc migration trong đúng database.
- Field user_id/triggered_by/status doesn't have a default value: database cũ chưa chạy migration xóa cột.
- Cảm biến trống: chưa có dữ liệu đo trong database mới.
- PowerShell chặn npm.ps1: dùng npm.cmd.
