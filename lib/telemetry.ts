import mqtt, { type MqttClient } from 'mqtt';
import { db } from './store';
import { getPool, usesMysql } from './mysql';

const state = globalThis as typeof globalThis & { telemetryClient?: MqttClient; telemetryQueue?: Promise<void>; telemetryError?: string };
export function startTelemetry() {
  if (!process.env.MQTT_URL || state.telemetryClient) return;
  const client = state.telemetryClient = mqtt.connect(process.env.MQTT_URL, {
    username: process.env.MQTT_USERNAME, password: process.env.MQTT_PASSWORD,
    clientId: `iot-web-${process.pid}`, reconnectPeriod: 5000,
  });
  client.on('connect', () => client.subscribe('hoan/sensor/telemetry'));
  client.on('error', () => { state.telemetryError = 'Không kết nối được MQTT.'; });
  client.on('message', (_topic, payload) => {
    state.telemetryQueue = (state.telemetryQueue || Promise.resolve()).then(async () => {
      const data = JSON.parse(payload.toString());
      const values = [data.temperature, data.humidity, data.light];
      if (!values.every(v => typeof v === 'number' && Number.isFinite(v)) || data.humidity < 0 || data.humidity > 100 || data.light < 0) return;
      if (usesMysql()) {
        const connection = await getPool().getConnection();
        try {
          await connection.beginTransaction();
          for (let i = 0; i < 3; i++) {
            await connection.execute('INSERT INTO data_sensors (sensor_id,value) VALUES (?,?)', [i + 1, values[i]]);
            await connection.execute('UPDATE sensors SET last_value=?,status=1,last_updated=UTC_TIMESTAMP(3) WHERE sensor_id=?', [values[i], i + 1]);
          }
          await connection.commit();
        } catch (error) { await connection.rollback(); throw error; }
        finally { connection.release(); }
      } else {
        const timestamp = new Date().toISOString();
        const nextId = Math.max(0, ...db.sensors.map(row => row.id)) + 1;
        values.forEach((value, i) => db.sensors.push({ id: nextId + i, sensorId: i + 1, sensor: ['Nhiệt độ', 'Độ ẩm', 'Ánh sáng'][i], unit: ['°C', '%', 'lux'][i], value, timestamp }));
        db.sensors.splice(0, Math.max(0, db.sensors.length - 6000));
      }
      state.telemetryError = undefined;
    }).catch(() => { state.telemetryError = 'Không đọc hoặc lưu được bản tin cảm biến.'; });
  });
}
export function telemetryStatus() {
  return { source: process.env.MQTT_URL ? 'mqtt' : usesMysql() ? 'database' : 'memory', connected: Boolean(state.telemetryClient?.connected), error: state.telemetryError || null };
}
