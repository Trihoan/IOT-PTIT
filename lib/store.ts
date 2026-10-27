export type Device = { id: number; name: string; status: boolean; lastUpdated: string };
export type SensorRecord = { id: number; sensorId: number; sensor: string; value: number; unit: string; timestamp: string };
export type ActionRecord = { id: number; deviceId: number; device: string; actionType: 'ON' | 'OFF'; timestamp: string };

const g = globalThis as typeof globalThis & { iotState?: { devices: Device[]; sensors: SensorRecord[]; actions: ActionRecord[]; schedules: Array<Record<string, unknown>>; nextActionId: number } };
export const db = g.iotState ??= {
  devices: [1, 2, 3].map((id) => ({ id, name: `LED ${id}`, status: false, lastUpdated: new Date().toISOString() })),
  sensors: [],
  actions: [], schedules: [], nextActionId: 1,
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

