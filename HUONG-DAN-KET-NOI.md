# Kết nối ESP8266 và cách hoạt động của thư mục IOT

Hướng dẫn đối chiếu với sketch Arduino được gửi ngày 27/10/2026; cập nhật kết nối MQTT ngày 28/10/2026.

## Trạng thái đã cấu hình trên máy này

- Biểu đồ vừa khung, không có bộ chọn khoảng thời gian hay thanh cuộn; hiển thị khoảng 5 phút gần nhất với mốc 1 phút. Rê chuột xem từng mẫu.
- Nếu MQTT mất kết nối hoặc không có đủ dữ liệu mới của cả 3 cảm biến trong 15 giây, biểu đồ và số đo hiện tại dùng dữ liệu mô phỏng, có nhãn "Dữ liệu mô phỏng". Dữ liệu này cập nhật theo bước 5 giây và không ghi vào bộ nhớ telemetry/MySQL. Khi MQTT kết nối và nhận đủ mẫu mới, web tự chuyển sang dữ liệu thật ở lần tải tiếp theo (tối đa khoảng 5 giây). Điều khiển relay vẫn cần MQTT và ACK thật.
- Mosquitto chạy dạng Windows service, nhận kết nối LAN ở cổng 1883. Cấu hình trong hoan.conf đã được áp dụng vào mosquitto.conf (file service đọc), sử dụng đường dẫn tuyệt đối tới passwd.
- Đã cấp quyền đọc passwd cho LocalSystem, tài khoản chạy dịch vụ, và tạo firewall rule IOT-MQTT-LocalSubnet chỉ cho mạng nội bộ.
- Đã tạo .env.local với MQTT_URL=mqtt://127.0.0.1:1883 và tài khoản từ sketch; không đưa file này vào Git. DB_DRIVER hiện là memory.
- Đã xác nhận ESP 192.168.100.186 kết nối broker 192.168.100.247 và API live nhận dữ liệu thật. Nhiệt độ/độ ẩm vẫn bằng 0 từ firmware; ánh sáng thay đổi. Cần kiểm tra DHT riêng.
- Nút điều khiển trên web đã được nối MQTT, chờ ACK tối đa 8 giây rồi mới ghi trạng thái/lịch sử. Kiểm thử giao thức dùng client giả lập, chưa bấm lệnh thử trên relay thực.
- Chạy web bằng npm run dev. Arduino IDE có thể đóng sau khi nạp; ESP vẫn cần nguồn và Wi-Fi. IP máy tính thay đổi thì phải sửa broker IP trong sketch.
- Script scripts/configure-mosquitto.ps1 dùng để áp dụng lại hoan.conf bằng PowerShell Administrator; có sao lưu cấu hình trước khi ghi.

## 1. Luồng hoạt động

ESP8266 đọc DHT11 và LDR → gửi JSON qua Wi-Fi → Mosquitto → backend Next.js trong lib/telemetry.ts → bộ nhớ hoặc MySQL → API /api/sensors/live → giao diện app/page.tsx và app/LiveChart.tsx.

USB dùng để cấp nguồn, nạp chương trình và xem Serial. Website hiện không đọc dữ liệu qua cổng USB/COM.

Chiều điều khiển: website → API → lib/mqtt-control.ts publish hoan/device/control → ESP8266 điều khiển relay → publish hoan/device/ack → backend xác nhận rồi ghi trạng thái và lịch sử. Khi không có ACK sau 8 giây, API báo lỗi. Lệnh bật/tắt tất cả được gửi lần lượt theo từng thiết bị; nếu lỗi giữa chừng, các thiết bị đã xác nhận vẫn giữ thay đổi, cần kiểm tra lại trạng thái. Không dùng MQTT retained cho lệnh điều khiển.

## 2. Arduino đang làm gì?

| Thành phần | Chân / cấu hình | Hoạt động |
|---|---|---|
| DHT11 | D6 | Đọc nhiệt độ và độ ẩm |
| LDR | A0 | Đọc analog; quy đổi tuyến tính thành giá trị ánh sáng 10–1000 |
| Relay 1 | D1 | Sketch dùng HIGH = bật, LOW = tắt |
| Relay 2 | D2 | Tương tự relay 1 |
| Relay 3 | D5 | Tương tự relay 1 |
| Serial | 9600 baud | In log Wi-Fi, MQTT, cảm biến và lệnh |
| Broker trong sketch | 192.168.220.1:1883 | Phải là địa chỉ máy chạy Mosquitto mà ESP truy cập được |

Giá trị ánh sáng là ước lượng theo công thức trong sketch, chưa phải phép đo lux được hiệu chuẩn. Khi DHT đọc lỗi, sketch giữ giá trị cũ; nếu chưa đọc thành công lần nào thì nhiệt độ/độ ẩm có thể vẫn bằng 0.

Sketch khởi tạo relay 1 và 3 HIGH, relay 2 LOW. Cần đối chiếu relay thực tế vì một số module kích mức LOW; khi đó logic bật/tắt sẽ ngược.

Chu kỳ hiện tại là telemetryInterval = 3000, tức 3 giây. Nếu muốn đúng 5 giây, sửa thành:

```cpp
const unsigned long telemetryInterval = 5000;
```

Sau đó nạp lại chương trình. Web đang gọi API mỗi 5000 ms; đổi chu kỳ trên Arduino mới thay đổi chu kỳ đo/gửi của mạch.

| Topic | Chiều | Nội dung |
|---|---|---|
| hoan/sensor/telemetry | ESP → broker → web | temperature, humidity, light, lightStatus |
| hoan/device/control | Bên điều khiển → broker → ESP | deviceId và action ON/OFF, hoặc action ALL_ON/ALL_OFF |
| hoan/device/ack | ESP → broker | deviceId, action, status SUCCESS |

Ví dụ telemetry (chỉ minh họa định dạng, không phải dữ liệu vừa đo):

```json
{"temperature":27.5,"humidity":65,"light":750,"lightStatus":"Sang"}
```

ESP chỉ xác nhận đã chạy digitalWrite; ACK không chứng minh bóng đèn thực sự sáng. Hàm setRelayState có tham số historyId, nhưng mqttCallback hiện không chuyển historyId nhận được vào hàm này, nên chưa đối chiếu được ACK theo lịch sử lệnh.

## 3. Kết nối theo thứ tự

### Bước 1: Xem Serial

Trong Arduino IDE chọn đúng board ESP8266 và cổng COM. Nạp sketch nếu chưa nạp. Mở Serial Monitor ở 9600 baud rồi reset mạch.

Log cần thấy:

```text
[OK] Wi-Fi da ket noi!
[OK] Ket noi MQTT thanh cong!
Subscribe: hoan/device/control
[MQTT TELEMETRY]
```

Nếu Wi-Fi lỗi, đối chiếu ssid/password trong sketch và mạng 2.4 GHz. Máy chạy broker và ESP phải có đường mạng truy cập nhau; cùng Wi-Fi là cách dễ kiểm tra nhất. Mạng khách hoặc chế độ cách ly thiết bị có thể chặn kết nối.

### Bước 2: Kiểm tra IP broker

Trên máy chạy Mosquitto, mở PowerShell và chạy:

```powershell
ipconfig
```

Lấy IPv4 của card Wi-Fi/Ethernet mà ESP có thể truy cập. So sánh với mqtt_broker trong sketch. Không mặc định 192.168.220.1 luôn đúng: nếu IP thực khác, sửa sketch và nạp lại. ESP không dùng 127.0.0.1 để truy cập broker trên máy tính.

### Bước 3: Kiểm tra Mosquitto

```powershell
Get-Service mosquitto
Test-NetConnection 127.0.0.1 -Port 1883
```

Lúc kiểm tra đã thấy service Mosquitto ở trạng thái Running, nhưng điều này chưa xác nhận mạch đăng nhập được. Broker phải lắng nghe địa chỉ LAN và cổng 1883, tài khoản MQTT phải khớp sketch, firewall phải cho kết nối từ mạng nội bộ.

Nếu Mosquitto chỉ lắng nghe loopback, ESP sẽ không vào được. Xem cấu hình listener và xác thực theo tài liệu chính thức: https://mosquitto.org/documentation/authentication-methods/ và https://mosquitto.org/man/mosquitto-conf-5.html . Không chạy thêm broker thứ hai trên cùng cổng khi service đang chiếm cổng.

### Bước 4: Xác nhận mạch gửi dữ liệu

Nếu Mosquitto được cài tại đường dẫn mặc định, chạy trên máy broker:

```powershell
& 'C:\Program Files\mosquitto\mosquitto_sub.exe' -h 127.0.0.1 -p 1883 -u Hoan -P '<MAT_KHAU_MQTT_TRONG_SKETCH>' -t 'hoan/sensor/telemetry' -v
```

Thay chuỗi trong dấu nháy bằng mật khẩu MQTT trong sketch. Nếu broker không lắng nghe loopback, thay 127.0.0.1 bằng IP broker. Khi nhận JSON liên tục mỗi 3 giây (hoặc 5 giây nếu đã sửa sketch), đường ESP → broker đã hoạt động.

### Bước 5: Cấu hình web

Trong thư mục IOT, nếu chưa có .env.local:

```powershell
Copy-Item .env.example .env.local
```

Sửa các biến sau trong .env.local:

```dotenv
DB_DRIVER=memory
MQTT_URL=mqtt://127.0.0.1:1883
MQTT_USERNAME=Hoan
MQTT_PASSWORD="<MAT_KHAU_MQTT_TRONG_SKETCH>"
```

127.0.0.1 chỉ phù hợp khi Next.js và Mosquitto chạy cùng máy và broker nhận kết nối loopback. Nếu khác máy, dùng IP máy broker. Mật khẩu là giá trị thật trong sketch, không giữ nguyên placeholder.

memory vẫn nhận dữ liệu thật từ MQTT nhưng mất dữ liệu khi tiến trình khởi động lại. Muốn lưu lâu dài, tạo database bằng database/create-database.sql rồi cấu hình DB_DRIVER=mysql và các DB_* theo HUONG-DAN-DATABASE.md.

Chạy:

```powershell
npm.cmd install
npm.cmd run dev
```

Nếu đã cài dependencies thì bỏ qua npm.cmd install. Sau khi sửa .env.local phải dừng và chạy lại server.

Mở http://localhost:3000 và đăng nhập. Giao diện gọi /api/sensors/live, API này khởi động MQTT subscriber. Mở riêng http://localhost:3000/api/sensors/live cũng kích hoạt subscriber khi server đang chạy.

Kiểm tra JSON trả về:

- source = mqtt: ứng dụng có cấu hình MQTT_URL.
- connected = true: backend đã kết nối broker; chưa đủ để kết luận mạch đang gửi.
- latest có đủ sensorId 1, 2, 3 và timestamp mới: backend đã nhận và lưu dữ liệu.
- error khác null: có lỗi MQTT hoặc lưu dữ liệu.

Backend gán thời gian nhận bản tin vì payload Arduino không gửi timestamp. lightStatus chưa được lưu; web dùng temperature, humidity, light. Subscriber chỉ bắt đầu khi API live được gọi và cần tiến trình Next.js tiếp tục chạy để thu thập.

### Bước 6: Thử relay độc lập với web

Chỉ thực hiện khi đã sẵn sàng cho relay đổi trạng thái. Lệnh sau thực sự yêu cầu bật relay 1:

```powershell
& 'C:\Program Files\mosquitto\mosquitto_pub.exe' -h 127.0.0.1 -p 1883 -u Hoan -P '<MAT_KHAU_MQTT_TRONG_SKETCH>' -t 'hoan/device/control' -m '{"deviceId":1,"action":"ON"}'
```

Dùng OFF để tắt. Trong một terminal khác, theo dõi xác nhận:

```powershell
& 'C:\Program Files\mosquitto\mosquitto_sub.exe' -h 127.0.0.1 -p 1883 -u Hoan -P '<MAT_KHAU_MQTT_TRONG_SKETCH>' -t 'hoan/device/ack' -v
```

Bản tin ALL_ON hoặc ALL_OFF điều khiển cả ba relay. Backend chỉ xử lý ACK khớp lệnh đang chờ do web gửi; lệnh gửi từ công cụ MQTT bên ngoài chưa tự đồng bộ trạng thái web. Sketch hiện không trả historyId, nên tránh gửi lệnh từ nhiều nguồn đồng thời: ACK chỉ khớp theo deviceId/action, không có mã lệnh riêng.

## 4. Vai trò các file

| File / thư mục | Vai trò |
|---|---|
| app/page.tsx | Đăng nhập, dashboard, bảng cảm biến, lịch sử, hồ sơ; gọi các API |
| app/LiveChart.tsx | Vẽ dữ liệu, mốc thời gian 1 phút, tooltip từng mẫu nhận được |
| app/layout.tsx | Khung trang và metadata |
| app/globals.css | Giao diện |
| app/api/sensors/live/route.ts | Khởi động nhận MQTT; trả latest, chart và trạng thái kết nối |
| lib/telemetry.ts | Kết nối MQTT, subscribe telemetry, kiểm tra JSON, ghi dữ liệu |
| lib/sensors.ts | Đọc dữ liệu từ bộ nhớ hoặc MySQL |
| lib/mysql.ts | Pool kết nối MySQL theo DB_* |
| lib/store.ts | Dữ liệu trong bộ nhớ; không còn khởi tạo cảm biến/lịch sử mẫu |
| lib/devices.ts | Gửi lệnh rồi ghi trạng thái LED và lịch sử sau khi có ACK |
| lib/mqtt-control.ts | Publish lệnh và chờ ACK từ ESP; bỏ ACK retained và xử lý timeout |
| app/api/leds | API điều khiển MQTT, trả lỗi khi không có ACK |
| app/api/actions/history | API đọc nhật ký |
| lib/auth.ts, data/account.json | Kiểm tra đăng nhập; tài khoản cố định dùng hash mật khẩu |
| app/api/schedules | Lưu cấu hình lịch trong bộ nhớ; chưa có bộ thực thi lịch tự động |
| database/create-database.sql | Tạo schema và ba thiết bị/cảm biến |
| scripts/check-database.mjs | Kiểm tra kết nối MySQL |
| .env.local | Cấu hình máy đang chạy; không đưa vào Git |

Hồ sơ và liên kết dự án lưu trong localStorage của trình duyệt. Đăng ký mới lưu trong bộ nhớ; phiên đăng nhập hiện là token demo, chưa có phân quyền API hoàn chỉnh. Bảng cảm biến và lịch sử được tải khi đăng nhập, chưa tự cập nhật định kỳ như biểu đồ; tải lại trang để đọc lại bảng.

Một số README/hướng dẫn cũ còn nói chưa có phần nhận telemetry hoặc có biểu đồ minh họa; đối chiếu mã hiện tại và hướng dẫn này.

## 5. Chẩn đoán nhanh

| Hiện tượng | Kiểm tra |
|---|---|
| Không có Serial | Cáp dữ liệu, COM, đúng board, 9600 baud, reset |
| Wi-Fi không vào | SSID, mật khẩu, Wi-Fi 2.4 GHz |
| MQTT không vào | IP broker, listener LAN, cổng 1883, firewall, user/password |
| MQTT tool nhận được nhưng web trống | .env.local, restart Next.js, mở API live, error, cấu hình MySQL |
| connected=true nhưng latest cũ/trống | Backend kết nối được nhưng ESP có thể chưa publish hoặc subscriber chưa nhận bản tin mới |
| Web báo không nhận ACK | Kiểm tra nguồn ESP, kết nối MQTT, topic control/ack và log Serial |
| Relay chạy ngược | Mức kích HIGH/LOW của module thực tế |
| Nhiệt độ/độ ẩm đứng yên hoặc 0 | DHT đọc lỗi và sketch đang giữ giá trị cũ |
