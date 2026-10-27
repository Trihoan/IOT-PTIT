export type Device = { id: number; name: string; status: boolean; lastUpdated: string };
export type SensorRecord = { id: number; sensorId: number; sensor: string; value: number; unit: string; timestamp: string };
export type ActionRecord = { id: number; deviceId: number; device: string; actionType: 'ON' | 'OFF'; timestamp: string };

const g = globalThis as typeof globalThis & { iotState?: { devices: Device[]; sensors: SensorRecord[]; actions: ActionRecord[]; schedules: Array<Record<string, unknown>>; nextActionId: number } };
export const db = g.iotState ??= {
  devices: [1, 2, 3].map((id) => ({ id, name: `LED ${id}`, status: id !== 2, lastUpdated: new Date().toISOString() })),
  sensors: Array.from({ length: 72 }, (_, i) => {
    const sensorId = i % 3 + 1;
    const sensor = [{ sensor: 'Nhiệt độ', unit: '°C', base: 27.5 }, { sensor: 'Độ ẩm', unit: '%', base: 65 }, { sensor: 'Ánh sáng', unit: 'lux', base: 750 }][sensorId - 1];
    const at = new Date(Date.now() - (71 - i) * 20 * 60_000);
    return { id: i + 1, sensorId, sensor: sensor.sensor, value: Number((sensor.base + Math.sin(i / 5) * (sensorId === 3 ? 180 : 3)).toFixed(1)), unit: sensor.unit, timestamp: at.toISOString() };
  }),
  actions: [
    { id: 5, deviceId: 2, device: 'LED 2', actionType: 'OFF', timestamp: new Date(Date.now() - 60 * 60_000).toISOString() },
    { id: 4, deviceId: 3, device: 'LED 3', actionType: 'ON', timestamp: new Date(Date.now() - 2 * 60 * 60_000).toISOString() },
    { id: 3, deviceId: 1, device: 'LED 1', actionType: 'OFF', timestamp: new Date(Date.now() - 3 * 60 * 60_000).toISOString() },
    { id: 2, deviceId: 2, device: 'LED 2', actionType: 'ON', timestamp: new Date(Date.now() - 4 * 60 * 60_000).toISOString() },
    { id: 1, deviceId: 1, device: 'LED 1', actionType: 'ON', timestamp: new Date(Date.now() - 5 * 60 * 60_000).toISOString() },
  ], schedules: [], nextActionId: 6,
};

export function addAction(device: Device, state: boolean) {
  const action: ActionRecord = { id: db.nextActionId++, deviceId: device.id, device: device.name, actionType: state ? 'ON' : 'OFF', timestamp: new Date().toISOString() };
  db.actions.unshift(action);
  return action;
}
export function page<T>(items: T[], request: Request) {
  const url = new URL(request.url); const pageNo = Math.max(1, Number(url.searchParams.get('page') || 1)); const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || 20)));
  return { page: pageNo, limit, total: items.length, data: items.slice((pageNo - 1) * limit, pageNo * limit) };
}

