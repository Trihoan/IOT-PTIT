import mqtt, { type MqttClient, type ISubscriptionMap } from 'mqtt';

type Pending = { action: string; resolve: () => void; reject: (error: Error) => void };
const state = globalThis as typeof globalThis & {
  controlClient?: MqttClient;
  pendingCommands?: Map<number, Pending>;
};
const pending = state.pendingCommands ??= new Map<number, Pending>();

function getClient() {
  if (!process.env.MQTT_URL) throw new Error('Chưa cấu hình MQTT_URL.');
  if (state.controlClient) return state.controlClient;
  const client = state.controlClient = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USERNAME, password: process.env.MQTT_PASSWORD,
    clientId: `iot-control-${process.pid}`, reconnectPeriod: 5000, connectTimeout: 5000,
  });
  client.on('error', () => { /* Connection failures are reported by the command timeout. */ });
  client.on('message', (topic, payload, packet) => {
    if (topic !== 'hoan/device/ack' || packet.retain) return;
    try {
      const ack = JSON.parse(payload.toString());
      const command = pending.get(Number(ack.deviceId));
      if (!command || ack.action !== command.action) return;
      if (ack.status === 'SUCCESS') command.resolve();
      else command.reject(new Error('Mạch báo không thực hiện được lệnh.'));
    } catch { /* Ignore malformed acknowledgements. */ }
  });
  return client;
}

export async function commandDevice(id: number, on: boolean) {
  if (pending.has(id)) throw new Error('Thiết bị đang xử lý một lệnh khác.');
  const client = getClient();
  const action = on ? 'ON' : 'OFF';
  await new Promise<void>((resolve, reject) => {
    let finished = false;
    let published = false;
    const finish = (error?: Error) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      client.removeListener('connect', send);
      pending.delete(id);
      if (error) reject(error); else resolve();
    };
    const timer = setTimeout(() => finish(new Error('Không nhận được xác nhận từ mạch sau 8 giây. Kiểm tra nguồn, Wi-Fi và MQTT.')), 8000);
    // Register the expected ACK before publishing, and only accept it after sending.
    pending.set(id, { action, resolve: () => { if (published) finish(); }, reject: error => { if (published) finish(error); } });
    const send = () => {
      if (finished) return;
      // Force a fresh SUBACK: MQTT.js otherwise returns [] for a cached subscription.
      const topics: ISubscriptionMap = { 'hoan/device/ack': { qos: 0 } };
      topics.resubscribe = true;
      client.subscribe(topics, (error, granted) => {
        if (finished) return;
        if (error || !granted?.length || granted.some(item => Number(item.qos) === 128)) {
          finish(new Error('Không thể đăng ký nhận xác nhận MQTT.')); return;
        }
        published = true;
        client.publish('hoan/device/control', JSON.stringify({ deviceId: id, action }), { qos: 0, retain: false }, error => {
          if (error) finish(new Error('Không thể gửi lệnh MQTT.'));
        });
      });
    };
    if (client.connected) send(); else client.once('connect', send);
  });
}
