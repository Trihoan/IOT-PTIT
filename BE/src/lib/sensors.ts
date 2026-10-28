import { demoReadings } from './demo-sensors';
import type { RowDataPacket } from 'mysql2/promise';
import { getPool, usesMysql } from './mysql';
import { db, type SensorRecord } from './store';

export async function getSensors(): Promise<SensorRecord[]> {
  if (process.env.MQTT_SIMULATION === 'true') return demoReadings();
  if (!usesMysql()) return db.sensors;
  const [rows] = await getPool().query<RowDataPacket[]>('SELECT ds.*, s.sensor_type, s.unit FROM data_sensors ds JOIN sensors s ON s.sensor_id=ds.sensor_id ORDER BY ds.timestamp,ds.data_id');
  return rows.map(r => ({ id: r.data_id, sensorId: r.sensor_id, sensor: r.sensor_type, value: r.value, unit: r.unit, timestamp: new Date(r.timestamp).toISOString() }));
}
