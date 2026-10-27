import { commandDevice } from './mqtt-control';
import type { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { getPool, usesMysql } from './mysql';
import { db, addAction, type Device, type ActionRecord } from './store';

export async function getDevices(): Promise<Device[]> {
  if (!usesMysql()) return db.devices;
  const [rows] = await getPool().query<RowDataPacket[]>('SELECT device_id, device_name, status, last_updated FROM devices ORDER BY device_id');
  return rows.map(r => ({ id: r.device_id, name: r.device_name, status: Boolean(r.status), lastUpdated: new Date(r.last_updated).toISOString() }));
}
export async function getActions(): Promise<ActionRecord[]> {
  if (!usesMysql()) return db.actions;
  const [rows] = await getPool().query<RowDataPacket[]>('SELECT a.*, d.device_name FROM `action` a JOIN devices d ON d.device_id=a.device_id ORDER BY a.action_id DESC');
  return rows.map(r => ({ id: r.action_id, deviceId: r.device_id, device: r.device_name, actionType: r.action_type, timestamp: new Date(r.timestamp).toISOString() }));
}
// Only persist a requested state after the ESP acknowledges it.
export async function controlDevice(id: number, state?: boolean) {
  if (!usesMysql()) {
    const device = db.devices.find(d => d.id === id);
    if (!device) return null;
    const next = state ?? !device.status;
    await commandDevice(id, next);
    device.status = next;
    device.lastUpdated = new Date().toISOString();
    return { device, action: addAction(device, device.status) };
  }
  const connection = await getPool().getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute<RowDataPacket[]>('SELECT * FROM devices WHERE device_id=? FOR UPDATE', [id]);
    if (!rows.length) { await connection.rollback(); return null; }
    const next = state ?? !Boolean(rows[0].status);
    await commandDevice(id, next);
    const timestamp = new Date().toISOString();
    await connection.execute('UPDATE devices SET status=?, last_updated=UTC_TIMESTAMP(3) WHERE device_id=?', [next, id]);
    const [result] = await connection.execute<ResultSetHeader>('INSERT INTO `action` (device_id,action_type) VALUES (?,?)', [id, next ? 'ON' : 'OFF']);
    await connection.commit();
    const device: Device = { id, name: rows[0].device_name, status: next, lastUpdated: timestamp };
    const action: ActionRecord = { id: result.insertId, deviceId: id, device: device.name, actionType: next ? 'ON' : 'OFF', timestamp };
    return { device, action };
  } catch (error) { await connection.rollback(); throw error; }
  finally { connection.release(); }
}

export async function controlAllDevices(state: boolean) {
  const devices: Device[] = [];
  const actions: ActionRecord[] = [];
  for (const device of await getDevices()) {
    const result = await controlDevice(device.id, state);
    if (result) { devices.push(result.device); actions.push(result.action); }
  }
  return { devices, actions };
}
