# IoT Smart Monitoring

Ứng dụng giám sát cảm biến và điều khiển 3 relay bằng **ESP8266, MQTT, Next.js, React và TypeScript**. Giao diện và API backend nằm trong cùng dự án.

## 1. Chạy dự án

Cần Node.js 20 trở lên và npm.

```bash
npm install
```

Tạo `.env.local` từ `.env.example` nếu chưa có:

```powershell
Copy-Item .env.example .env.local
```

Điền cấu hình MQTT của bạn, không đưa mật khẩu lên Git:

```dotenv
DB_DRIVER=memory
MQTT_URL=mqtt://127.0.0.1:1883
MQTT_USERNAME=YOUR_MQTT_USER
MQTT_PASSWORD="YOUR_MQTT_PASSWORD"
```

`127.0.0.1` dùng khi backend và Mosquitto cùng máy. ESP phải dùng IP LAN của máy broker. Sau khi đổi `.env.local`, khởi động lại server.

```bash
npm run dev
```

- Dashboard: http://localhost:3000
- Tài liệu và thử API trực tiếp: http://localhost:3000/docs
- Postman Collection: http://localhost:3000/iot.postman_collection.json

Đăng nhập bằng tài khoản HoanIOT và mật khẩu đã cấu hình. Nếu PowerShell chặn `npm.ps1`, có thể dùng `npm.cmd run dev`.

Các lệnh khác:

```bash
npm run typecheck
node scripts/check-mqtt-control.cjs
npm run build
npm start
```

`npm start` chạy bản production đã build. Kiểm thử MQTT dùng client giả lập, không điều khiển relay thật.

## 2. Cấu trúc thư mục

```text
IOT/
├── app/                         Giao diện React và API Next.js
│   ├── page.tsx                 Đăng nhập, dashboard, cảm biến, lịch sử, hồ sơ
│   ├── layout.tsx               Khung HTML, metadata, CSS chung
│   ├── globals.css              Kiểu dáng và giao diện responsive
│   ├── LiveChart.tsx            Biểu đồ SVG và tooltip cảm biến
│   ├── Pagination.tsx           Phân trang bảng dữ liệu
│   ├── docs/                    Trang tài liệu và thử API tại /docs
│   └── api/
│       ├── auth/                Đăng nhập, đăng ký
│       ├── sensors/             Dữ liệu live, mới nhất, lịch sử, biểu đồ
│       ├── devices/             Trạng thái các thiết bị
│       ├── leds/                Đọc và điều khiển relay qua MQTT
│       ├── actions/             Nhật ký bật/tắt
│       └── schedules/           Lưu/xóa cấu hình lịch hẹn
├── lib/                         Logic dùng chung của backend/giao diện
├── data/account.json            Tài khoản cố định với mật khẩu băm và salt
├── database/                    Schema và script cập nhật MySQL
├── scripts/                     Kiểm tra database, MQTT, cấu hình broker
├── public/                      Tài nguyên tải trực tiếp, Postman Collection
├── .env.example                 Mẫu biến môi trường
├── .env.local                   Cấu hình riêng của máy, được Git bỏ qua
├── package.json                 Thư viện và lệnh npm
├── package-lock.json            Phiên bản chính xác của dependencies
├── next.config.mjs              Cấu hình Next.js
├── tsconfig.json                Cấu hình TypeScript và alias @/
└── HUONG-DAN-*.md                Tài liệu sử dụng và kết nối
```

`node_modules/` chứa thư viện npm. `.next-dev/` và `.next/` chứa file tự sinh khi chạy dev/build; không sửa trực tiếp hoặc đưa lên Git.

### Vai trò các file trong lib

| File | Chức năng |
| --- | --- |
| `telemetry.ts` | Kết nối MQTT, nhận JSON cảm biến, kiểm tra giá trị và lưu vào RAM/MySQL. |
| `mqtt-control.ts` | Gửi lệnh relay, chờ ACK tối đa 8 giây, xử lý lỗi và ngăn lệnh đồng thời trên cùng thiết bị. |
| `devices.ts` | Đọc thiết bị/lịch sử; chỉ ghi trạng thái và nhật ký sau ACK. |
| `sensors.ts` | Đọc dữ liệu cảm biến từ RAM hoặc MySQL. |
| `mysql.ts` | Tạo và tái sử dụng pool kết nối theo các biến DB_*. |
| `store.ts` | Kiểu dữ liệu, kho RAM, thêm lịch sử và phân trang API. |
| `demo-sensors.ts` | Sinh 61 mốc × 3 cảm biến, mỗi mốc cách 5 giây; kiểm tra dữ liệu mới trong 15 giây. |
| `auth.ts` | Kiểm tra đăng nhập bằng tài khoản cố định hoặc tài khoản đã đăng ký trong RAM. |
| `api-docs.ts` | Danh sách endpoint và request mẫu cho trang /docs. |

### Database và công cụ

- `database/create-database.sql`: tạo các bảng `users`, `devices`, `sensors`, `data_sensors`, `action`; khởi tạo ba thiết bị và ba cảm biến.
- `database/remove-action-details.sql`: cập nhật cấu trúc bảng lịch sử của database cũ.
- `scripts/check-database.mjs`: kiểm tra kết nối MySQL.
- `scripts/check-mqtt-control.cjs`: kiểm thử ACK, timeout, đăng ký lại topic và lệnh đồng thời.
- `scripts/configure-mosquitto.ps1`: chạy bằng Administrator để sao lưu, áp dụng `hoan.conf` vào cấu hình service, cấp quyền đọc `passwd` và mở cổng MQTT cho mạng nội bộ.

## 3. Luồng hoạt động

### Cảm biến

```text
DHT11 + LDR → ESP8266 → Mosquitto: hoan/sensor/telemetry
    → lib/telemetry.ts → RAM hoặc MySQL
    → GET /api/sensors/live → page.tsx → LiveChart.tsx
```

Sketch gửi `temperature`, `humidity`, `light` mỗi 5 giây khi đặt `telemetryInterval = 5000`. Backend gán thời gian nhận bản tin. Giao diện tải cập nhật mỗi 5 giây, biểu đồ hiển thị khoảng 5 phút gần nhất và mốc trục thời gian cách 1 phút.

Nếu MQTT chưa kết nối hoặc thiếu mẫu mới của bất kỳ cảm biến nào quá 15 giây, API live trả dữ liệu mô phỏng với `source: "demo"`; giao diện ghi rõ “Dữ liệu mô phỏng”. Khi MQTT có đủ dữ liệu mới, web tự chuyển sang `source: "mqtt"`. Dữ liệu mô phỏng không được ghi vào kho dữ liệu thật.

`/api/sensors/latest`, `/history` và `/[id]/chart` đọc kho dữ liệu thật; có thể trống dù dashboard đang hiển thị mô phỏng. Subscriber MQTT khởi động khi `/api/sensors/live` được gọi và cần tiến trình Next.js tiếp tục chạy để thu thập.

### Điều khiển relay

```text
Nút web / Postman / docs → POST /api/leds/control → lib/devices.ts
    → lib/mqtt-control.ts → hoan/device/control → ESP8266
    → hoan/device/ack → backend ghi trạng thái và lịch sử → response
```

Lệnh mẫu: `{"deviceId":1,"action":"ON"}`. ACK mẫu: `{"deviceId":1,"action":"ON","status":"SUCCESS"}`.

Chỉ ghi trạng thái khi có ACK. Không có ACK sau 8 giây thì API báo lỗi; không giả lập điều khiển khi mất MQTT. Bật/tắt tất cả gửi lần lượt từng thiết bị, có thể hoàn thành một phần nếu một thiết bị lỗi.

ACK xác nhận ESP đã xử lý lệnh, chưa chứng minh bóng đèn thực sự sáng. Sketch hiện khớp ACK theo thiết bị và action, chưa có mã lệnh riêng; tránh điều khiển đồng thời từ nhiều nguồn.

## 4. Thử API trên trang docs local

1. Chạy `npm run dev`.
2. Mở http://localhost:3000/docs.
3. Chọn endpoint bên trái.
4. Sửa đường dẫn, query hoặc body JSON nếu cần.
5. Bấm **Gửi yêu cầu** để xem HTTP status, thời gian và response JSON.

Không cần cài Postman để dùng trang này. Trang không tự gửi lệnh khi mở. Các API điều khiển tác động đến relay thật; chỉ bấm khi mạch đã sẵn sàng. Với đăng nhập, thay `{{password}}` trong ô JSON bằng mật khẩu của bạn.

## 5. Thử bằng Postman

1. Chạy web ở localhost:3000.
2. Trong Postman, chọn **Import** và nhập file [iot.postman_collection.json](public/iot.postman_collection.json).
3. Trong Variables của collection, đặt `baseUrl` là `http://localhost:3000`; điền `password` nếu thử tài khoản. Không lưu mật khẩu thật vào bản collection đưa lên Git.
4. Chọn request và bấm **Send**. Body JSON và Content-Type đã được chuẩn bị.

Nên thử theo thứ tự: **sensors/live → devices/status → leds/control → actions/history**. Hai request GET đầu chỉ đọc dữ liệu; `leds/control` gửi lệnh thực sự xuống relay.

Ví dụ điều khiển LED 1:

```http
POST http://localhost:3000/api/leds/control
Content-Type: application/json
```

```json
{
  "led_id": 1,
  "state": "ON"
}
```

Đổi thành `OFF` để tắt. Nếu thành công, response có `mqtt.published: true`, `mqtt.acknowledged: true`, thông tin `device` và `action`. Nếu không có ACK, response HTTP 503 kèm `message`.

## 6. Danh sách API

| Method | Endpoint | Chức năng / body |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ "username": "HoanIOT", "password": "..." }` |
| POST | `/api/auth/register` | `{ "name": "...", "email": "...", "password": "...", "confirmPassword": "..." }` |
| GET | `/api/sensors/live` | Dashboard, trạng thái MQTT, dữ liệu thật/mô phỏng |
| GET | `/api/sensors/latest` | Giá trị mới nhất trong kho thật |
| GET | `/api/sensors/history?page=1&limit=20` | Lịch sử cảm biến, hỗ trợ `from`/`to` |
| GET | `/api/sensors/1/chart` | Biểu đồ một cảm biến, hỗ trợ `from`/`to` |
| GET | `/api/devices/status` | Trạng thái ba LED |
| GET | `/api/leds/1` | Trạng thái một LED |
| PATCH | `/api/leds/1/toggle` | Đảo trạng thái LED |
| POST | `/api/leds/control` | `{ "led_id": 1, "state": "ON" }` |
| POST | `/api/leds/control-all` | `{ "state": "OFF" }` |
| GET | `/api/actions/history?page=1&limit=20` | Nhật ký các lệnh đã xác nhận |
| GET | `/api/schedules` | Danh sách lịch hẹn |
| PUT | `/api/schedules` | `{ "deviceId": 1, "time": "20:30", "state": "OFF" }` |
| DELETE | `/api/schedules/:id` | Xóa lịch theo id trả về khi tạo |

`[id]` trong thư mục route là tham số động. Sensor id: 1 = nhiệt độ, 2 = độ ẩm, 3 = ánh sáng. Device id: 1–3. `from`/`to` dùng YYYY-MM-DD. History hỗ trợ `page` và `limit` (tối đa 100 mỗi request).

## 7. Lưu trữ và phạm vi hiện tại

- `DB_DRIVER=memory`: cảm biến, thiết bị, lịch sử ở RAM, mất khi tiến trình khởi động lại.
- `DB_DRIVER=mysql`: lưu cảm biến, trạng thái thiết bị và lịch sử trong MySQL. Xem [hướng dẫn database](HUONG-DAN-DATABASE.md).
- Tài khoản cố định lưu mật khẩu băm trong `data/account.json`; tài khoản đăng ký mới lưu trong RAM.
- Phiên đăng nhập hiện trả token demo; các API chưa bắt buộc Bearer token và chưa có phân quyền hoàn chỉnh.
- Hồ sơ và liên kết dự án lưu trong localStorage của trình duyệt.
- API lịch hẹn chỉ lưu/xóa cấu hình; chưa có bộ thực thi lịch tự động.
- Lệnh MQTT từ công cụ ngoài web chưa tự đồng bộ trạng thái lên web.
- Một số ô thống kê trên giao diện còn dùng giá trị cố định; bảng cảm biến/lịch sử tải lúc đăng nhập, chưa cập nhật định kỳ như biểu đồ.

Xem [hướng dẫn kết nối ESP8266/MQTT](HUONG-DAN-KET-NOI.md) để đối chiếu chân cảm biến, topic, Serial và cấu hình broker. Arduino IDE có thể đóng sau khi nạp code; mạch vẫn cần nguồn và Wi-Fi.
