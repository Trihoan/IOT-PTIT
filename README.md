# IoT Smart Monitoring

Ứng dụng giám sát nhiệt độ, độ ẩm, ánh sáng và điều khiển 3 đèn bằng Next.js, React và TypeScript. Có thể chạy không cần MQTT hoặc kết nối ESP8266 qua broker MQTT.

## 1. Chạy dự án

Cần Node.js 22.9 trở lên và npm. FE và BE là hai ứng dụng riêng, quản lý bằng npm workspaces.

Tại thư mục gốc `IOT`, cài thư viện một lần:

```powershell
npm install
```

Nếu chưa có file cấu hình, tạo từ mẫu:

```powershell
Copy-Item FE/.env.example FE/.env.local
Copy-Item BE/.env.example BE/.env.local
```

Cấu hình `FE/.env.local`:

```dotenv
API_URL=http://127.0.0.1:4000
```

Cấu hình `BE/.env.local` để chạy không cần MQTT:

```dotenv
PORT=4000
DB_DRIVER=memory
MQTT_SIMULATION=true
```

Chạy FE và BE cùng lúc tại thư mục gốc:

```powershell
npm run dev
```

Nhấn Ctrl+C để dừng cả hai. Hoặc mở hai terminal để chạy riêng:

```powershell
# Terminal 1: backend
npm run dev:be
```

```powershell
# Terminal 2: frontend
npm run dev:fe
```

- Giao diện FE: http://localhost:3000
- Trang thử API: http://localhost:3000/docs
- API BE trực tiếp: http://127.0.0.1:4000/api/devices/status
- Postman Collection: http://localhost:3000/iot.postman_collection.json

Có thể chạy riêng trong từng thư mục bằng `cd FE` hoặc `cd BE`, rồi `npm run dev`. Nhấn Ctrl+C để dừng từng phần. Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd`.

FE chuyển các yêu cầu `/api/*` tới BE theo `API_URL` trong `FE/next.config.mjs`. Trình duyệt gọi cùng địa chỉ FE, không cần cấu hình CORS. Phải chạy cả hai để đăng nhập và sử dụng dữ liệu. BE chạy độc lập để thử bằng Postman hoặc phục vụ mạch MQTT.

Đăng nhập bằng tài khoản `HoanIOT` và mật khẩu đã cấu hình. Khi `MQTT_SIMULATION=true`, bật/tắt và lịch sử dùng RAM, cảm biến dùng dữ liệu mẫu; không gửi lệnh đến mạch thật.

### Kết nối MQTT thật

Sửa `BE/.env.local` rồi khởi động lại BE:

```dotenv
PORT=4000
DB_DRIVER=memory
MQTT_SIMULATION=false
MQTT_URL=mqtt://127.0.0.1:1883
MQTT_USERNAME=YOUR_MQTT_USER
MQTT_PASSWORD="YOUR_MQTT_PASSWORD"
```

`127.0.0.1` dùng khi BE và Mosquitto cùng máy. ESP8266 dùng IP LAN của broker. Xem [hướng dẫn kết nối](HUONG-DAN-KET-NOI.md).

### Kiểm tra và build

Chạy tại thư mục gốc:

```powershell
npm run typecheck
npm test
npm run build
```

Sau build, mở hai terminal và chạy `npm run start:be`, `npm run start:fe`. Đổi `API_URL` cần build lại FE trước khi chạy production.

`npm test` kiểm tra offline, MQTT bằng client giả lập và toàn bộ API qua HTTP; không điều khiển mạch thật. Có thể chạy riêng trong BE bằng `npm test`; kiểm tra MySQL bằng `npm run check:database`.

## 2. Cấu trúc thư mục

```text
IOT/
├── FE/                            Frontend Next.js / React
│   ├── app/
│   │   ├── page.tsx               Điểm vào giao diện
│   │   ├── layout.tsx             Khung HTML và CSS
│   │   ├── globals.css
│   │   └── docs/                  Trang thử API
│   ├── src/
│   │   ├── App.tsx                Khung ứng dụng
│   │   ├── screens/               Login, Dashboard, Sensors, History, Profile
│   │   ├── components/            Biểu đồ, phân trang, thành phần dùng chung
│   │   ├── hooks/                 Gọi API và quản lý trạng thái
│   │   ├── api-docs.ts            Request mẫu cho trang docs
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── public/                    Postman Collection
│   ├── .env.example               Địa chỉ BE
│   ├── next.config.mjs            Chuyển /api sang BE
│   ├── tsconfig.json
│   └── package.json
├── BE/                            Backend Node.js / TypeScript
│   ├── src/
│   │   ├── server.ts              HTTP server và bảng định tuyến
│   │   ├── api/                   Các API đăng nhập, cảm biến, đèn, lịch sử
│   │   ├── lib/                   MQTT, MySQL, dữ liệu mẫu, xử lý nghiệp vụ
│   │   └── data/account.json      Tài khoản cố định
│   ├── database/                  SQL tạo và cập nhật MySQL
│   ├── scripts/                   Chạy dev và kiểm thử
│   ├── .env.example               PORT, MQTT, MySQL
│   ├── tsconfig.json
│   └── package.json
├── package.json                   Lệnh chạy và npm workspaces
├── package-lock.json              Khóa phiên bản thư viện
└── README.md
```

FE không chứa API backend, MQTT hoặc MySQL. BE không phụ thuộc Next.js hoặc React. Dữ liệu mẫu được sinh duy nhất trong `BE/src/lib/demo-sensors.ts`, rồi gửi qua API cho FE.

Sửa màn hình trong `FE/src/screens`; sửa cách FE tải dữ liệu trong `FE/src/hooks/useIotDashboard.ts`. Sửa nghiệp vụ ở `BE/src/lib`; sửa API ở `BE/src/api` và đăng ký đường dẫn mới trong `BE/src/server.ts`.

`FE/app/page.tsx` hiển thị `FE/src/App.tsx`. Năm màn hình chuyển bằng menu trong cùng trang `/`. `FE/.next-dev`, `FE/.next`, `BE/dist` và `node_modules` là file tự sinh.

Bảng cảm biến có ô tìm thời gian theo giờ địa phương, nhập `HH:mm` hoặc `HH:mm:ss`. Nhật ký thiết bị cho chọn 5, 10, 50 hoặc 100 bản ghi mỗi trang; đổi bộ lọc hoặc số bản ghi sẽ về trang đầu.

## 3. Luồng dữ liệu

### Không có MQTT

```text
Nút bật/tắt → API LED → BE/src/lib/devices.ts → trạng thái và lịch sử trong RAM
Dữ liệu cảm biến mẫu → API cảm biến → useIotDashboard.ts → các màn hình
```

Khi `MQTT_SIMULATION=true`, thiết bị và lịch sử dùng RAM, cảm biến dùng dữ liệu mẫu kể cả khi `DB_DRIVER=mysql`. Các API điều khiển trả `mqtt.published=false` và `mqtt.acknowledged=false`; trạng thái đèn trên web không tác động đến mạch thật.

### Có MQTT

```text
DHT11 + LDR → ESP8266 → hoan/sensor/telemetry
    → BE/src/lib/telemetry.ts → RAM hoặc MySQL → API cảm biến
    → FE/src/hooks/useIotDashboard.ts → giao diện

Nút bật/tắt → API LED → hoan/device/control → ESP8266
    → hoan/device/ack → lưu trạng thái và lịch sử
```

- Giao diện lấy dữ liệu cảm biến mỗi 5 giây. Subscriber MQTT khởi động khi gọi `/api/sensors/live`.
- Nếu MQTT chưa kết nối hoặc thiếu dữ liệu mới của một cảm biến quá 15 giây, API live trả dữ liệu mẫu với `source: "demo"`.
- Khi có đủ dữ liệu mới, API live chuyển sang `source: "mqtt"`.
- Khi `MQTT_SIMULATION=false`, API điều khiển chỉ lưu trạng thái sau ACK; quá 8 giây không có ACK thì trả HTTP 503. Mất kết nối không tự chuyển điều khiển sang RAM.
- Bật/tắt tất cả gửi lần lượt từng đèn; có thể hoàn thành một phần nếu một đèn lỗi.

Lệnh MQTT: `{"deviceId":1,"action":"ON"}`. ACK: `{"deviceId":1,"action":"ON","status":"SUCCESS"}`.

## 4. Thử API

Mở http://localhost:3000/docs, chọn endpoint, sửa JSON nếu cần rồi bấm **Gửi yêu cầu**. Hoặc nhập [Postman Collection](FE/public/iot.postman_collection.json) và đặt `baseUrl=http://localhost:3000`.

Thử theo thứ tự: `sensors/live` → `devices/status` → `leds/control` → `actions/history`.

Ví dụ bật đèn 1:

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

Đổi `ON` thành `OFF` để tắt. Response thành công có `device`, `action` và trạng thái gửi MQTT. Khi `MQTT_SIMULATION=false`, yêu cầu điều khiển sẽ gửi lệnh đến mạch thật.

## 5. Danh sách API

| Method | Endpoint | Chức năng / body |
| --- | --- | --- |
| POST | `/api/auth/login` | `{ "username": "HoanIOT", "password": "..." }` |
| POST | `/api/auth/register` | `{ "name": "...", "email": "...", "password": "...", "confirmPassword": "..." }` |
| GET | `/api/sensors/live` | Dữ liệu biểu đồ, giá trị mới nhất và trạng thái MQTT |
| GET | `/api/sensors/latest` | Giá trị mới nhất của ba cảm biến |
| GET | `/api/sensors/history?page=1&limit=20` | Dữ liệu cảm biến, hỗ trợ `from`/`to` |
| GET | `/api/sensors/1/chart` | Biểu đồ một cảm biến, hỗ trợ `from`/`to` |
| GET | `/api/devices/status` | Trạng thái ba đèn |
| GET | `/api/leds/1` | Trạng thái một đèn |
| PATCH | `/api/leds/1/toggle` | Đảo trạng thái đèn |
| POST | `/api/leds/control` | `{ "led_id": 1, "state": "ON" }` |
| POST | `/api/leds/control-all` | `{ "state": "OFF" }` |
| GET | `/api/actions/history?page=1&limit=20` | Lịch sử bật/tắt |
| GET | `/api/schedules` | Danh sách lịch hẹn |
| PUT | `/api/schedules` | `{ "deviceId": 1, "time": "20:30", "state": "OFF" }` |
| DELETE | `/api/schedules/:id` | Xóa lịch hẹn |

ID cảm biến: `1` = nhiệt độ, `2` = độ ẩm, `3` = ánh sáng. ID đèn: `1–3`. `from`/`to` dùng `YYYY-MM-DD`. API lịch sử hỗ trợ `page`, `limit`, tối đa 100 bản ghi mỗi yêu cầu.

### Vị trí code API

BE đăng ký các URL trong `BE/src/server.ts` và gọi các hàm xử lý tương ứng trong `BE/src/api`. Hàm `GET`, `POST`, `PATCH`, `PUT` hoặc `DELETE` trong file tương ứng với phương thức HTTP. Thư mục `[id]` nhận ID từ URL; ví dụ `/api/leds/1` có `id=1`.

| Thư mục trong `BE/src/api` | File xử lý | Công việc |
| --- | --- | --- |
| `auth` | [login/route.ts](BE/src/api/auth/login/route.ts), [register/route.ts](BE/src/api/auth/register/route.ts) | Đăng nhập và đăng ký |
| `sensors` | [live/route.ts](BE/src/api/sensors/live/route.ts), [latest/route.ts](BE/src/api/sensors/latest/route.ts), [history/route.ts](BE/src/api/sensors/history/route.ts), [[id]/chart/route.ts](BE/src/api/sensors/[id]/chart/route.ts) | Dữ liệu cảm biến và biểu đồ |
| `devices` | [status/route.ts](BE/src/api/devices/status/route.ts) | Đọc trạng thái tất cả đèn |
| `leds` | [[id]/route.ts](BE/src/api/leds/[id]/route.ts), [[id]/toggle/route.ts](BE/src/api/leds/[id]/toggle/route.ts), [control/route.ts](BE/src/api/leds/control/route.ts), [control-all/route.ts](BE/src/api/leds/control-all/route.ts) | Đọc và bật/tắt đèn |
| `actions` | [history/route.ts](BE/src/api/actions/history/route.ts) | Lịch sử bật/tắt |
| `schedules` | [route.ts](BE/src/api/schedules/route.ts), [[id]/route.ts](BE/src/api/schedules/[id]/route.ts) | Đọc, tạo và xóa lịch hẹn |

### Tham số và kết quả từng API

URL BE trực tiếp: `http://127.0.0.1:4000`. Qua FE cũng có thể gọi `http://localhost:3000/api/...` nhờ proxy. Yêu cầu có body gửi JSON với header `Content-Type: application/json`. Các trường bên dưới là bắt buộc, trừ khi ghi là tùy chọn.

**Đăng nhập và đăng ký**

| API | Dữ liệu gửi | Kết quả |
| --- | --- | --- |
| `POST /api/auth/login` | `username`: tên tài khoản hoặc email đã đăng ký; `password`: mật khẩu | HTTP 200: `{ status, token, user }`. Thiếu dữ liệu: 400; sai tài khoản/mật khẩu: 401. |
| `POST /api/auth/register` | `name`, `email`, `password` ít nhất 6 ký tự, `confirmPassword` khớp mật khẩu | HTTP 201: `{ status, token, user }`. Dữ liệu không hợp lệ: 400; tài khoản trùng: 409. |

`user` gồm `id`, `username`, `name`, `email`. Token hiện tại là `demo-session`.

**Cảm biến**

| API | Tham số | Kết quả HTTP 200 |
| --- | --- | --- |
| `GET /api/sensors/live` | Không có | `{ latest, chart, source, connected, error }`; có thêm `simulated: true` khi bật chế độ không MQTT. `latest` chứa giá trị cuối của từng cảm biến, `chart` chứa dữ liệu biểu đồ. `source` là `demo` hoặc `mqtt`. API này không có trường `status`. |
| `GET /api/sensors/latest` | Không có | `{ status, data }`; `data` chứa tối đa 3 bản ghi mới nhất, mỗi cảm biến một bản ghi. |
| `GET /api/sensors/history` | Query tùy chọn: `page`, `limit`, `from`, `to` | `{ status, page, limit, total, data }`; `total` là số bản ghi sau khi lọc ngày và trước phân trang. |
| `GET /api/sensors/:id/chart` | `id`: 1, 2 hoặc 3; query tùy chọn: `from`, `to` | `{ status, sensor: { id, name, unit }, chartData: [{ time, value }] }`. ID không hợp lệ trả 404. Khi không có bản ghi, `name` và `unit` có thể vắng mặt. |

Một bản ghi cảm biến gồm `id`, `sensorId`, `sensor`, `value`, `unit`, `timestamp`. ID 1 = nhiệt độ (°C), 2 = độ ẩm (%), 3 = ánh sáng (lux). Đây là ba đại lượng đo; dashboard tính 2 thiết bị cảm biến và 3 đèn, tổng 5 thiết bị. Hai cảm biến luôn được tính đang hoạt động.

Ví dụ lọc và phân trang:

`GET /api/sensors/history?from=2026-10-28&to=2026-10-28&page=1&limit=20`

`from`/`to` dùng `YYYY-MM-DD`; giới hạn ngày được xử lý theo UTC, `to` tính đến cuối ngày. `page` mặc định 1; `limit` mặc định 20, tối đa 100. Khi không MQTT, các API cảm biến trả dữ liệu mẫu.

**Thiết bị và điều khiển đèn**

| API | Dữ liệu gửi | Kết quả HTTP 200 |
| --- | --- | --- |
| `GET /api/devices/status` | Không có | `{ status, devices }`: danh sách 3 đèn. |
| `GET /api/leds/:id` | `id`: 1–3 | `{ status, device }`; không tìm thấy trả 404. |
| `PATCH /api/leds/:id/toggle` | `id`: 1–3; không cần body | Đảo trạng thái hiện tại, trả `{ status, device, action, mqtt }`. |
| `POST /api/leds/control` | `{ "led_id": 1, "state": "ON" }`; `led_id`: 1–3, `state`: `ON` hoặc `OFF` | `{ status, device, action, mqtt }`. Body không hợp lệ trả 400. |
| `POST /api/leds/control-all` | `{ "state": "OFF" }`; `state`: `ON` hoặc `OFF` | `{ status, devices, actions, mqtt }`. Body không hợp lệ trả 400. |

- `device`: `{ id, name, status, lastUpdated }`; `status` bên trong thiết bị là boolean: `true` = bật, `false` = tắt.
- `action`: `{ id, deviceId, device, actionType, timestamp }`; `actionType` là `ON` hoặc `OFF`.
- `mqtt`: `{ published, acknowledged }`; API `control` có thêm `topic: "hoan/device/control"`.
- Khi `MQTT_SIMULATION=true`, bật/tắt vẫn thành công và được ghi vào RAM; `published` và `acknowledged` đều là `false`.
- Khi dùng MQTT thật, hai cờ là `true` sau ACK. Lỗi gửi lệnh hoặc không nhận ACK trả HTTP 503. API toggle trả 404 khi ID không hợp lệ.

**Lịch sử**

`GET /api/actions/history?page=1&limit=20` trả `{ status, page, limit, total, data }`. Mỗi phần tử của `data` là một `action` như trên, xếp mới nhất trước. API chỉ hỗ trợ phân trang; bộ lọc thiết bị, trạng thái, ngày và tìm kiếm được xử lý trên giao diện với dữ liệu đã tải.

**Lịch hẹn**

| API | Dữ liệu gửi | Kết quả |
| --- | --- | --- |
| `GET /api/schedules` | Không có | HTTP 200: `{ status, data }`, danh sách lịch trong RAM. |
| `PUT /api/schedules` | `{ "deviceId": 1, "time": "20:30", "state": "OFF" }` | HTTP 201: `{ status, schedule }`. `schedule` chứa dữ liệu gửi lên cùng `id` và `enabled: true`. Thiếu dữ liệu trả 400. |
| `DELETE /api/schedules/:id` | ID nhận được khi tạo lịch | HTTP 200: `{ status, deleted }`; không tìm thấy trả 404. |

API tạo lịch hiện chỉ kiểm tra `deviceId` chuyển được thành số nguyên, `time` có giá trị và `state` là `ON`/`OFF`; chưa kiểm tra phạm vi ID hoặc định dạng giờ. Lịch hẹn chưa tự thực thi.

Phản hồi lỗi có dạng `{ "status": "error", "message": "..." }`. Thời gian `timestamp`/`lastUpdated` dùng ISO 8601; giao diện chuyển sang giờ địa phương để hiển thị.

## 6. Lưu trữ và giới hạn

- Chế độ không MQTT: trạng thái đèn và lịch sử mất khi server khởi động lại; dữ liệu cảm biến được sinh theo thời gian.
- Khi tắt chế độ này, `DB_DRIVER=memory` lưu trong RAM; `DB_DRIVER=mysql` lưu cảm biến, thiết bị và lịch sử trong MySQL. Xem [hướng dẫn database](HUONG-DAN-DATABASE.md).
- Tài khoản cố định nằm trong `BE/src/data/account.json`; tài khoản đăng ký mới lưu trong RAM.
- Hồ sơ và liên kết dự án lưu trong localStorage của trình duyệt.
- Token đăng nhập hiện là token demo; API chưa bắt buộc Bearer token hoặc có phân quyền hoàn chỉnh.
- Lịch hẹn chỉ lưu/xóa cấu hình, chưa tự thực thi.
- Dữ liệu cảm biến mẫu cập nhật mỗi 5 giây; lịch sử được cập nhật sau thao tác trên web hoặc khi bấm **Làm mới**.
- Lệnh MQTT gửi từ công cụ ngoài web chưa tự đồng bộ trạng thái thiết bị lên giao diện.
