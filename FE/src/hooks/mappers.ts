import type { Action, SensorRow } from '../types';

// Chuyển dữ liệu API sang dữ liệu hiển thị.
export function mapActions(records: Array<Record<string, unknown>>): Action[] {
  return records.map((record) => {
    const status = record.actionType === 'ON';
    const timestamp = String(record.timestamp || '');
    return { date: timestamp ? new Date(timestamp).toLocaleDateString('sv-SE') : '', id: `EV-${String(record.id).padStart(4, '0')}`, device: String(record.device || `LED ${record.deviceId}`).replace(/^LED /, 'Đèn LED '), action: status ? 'Bật thiết bị' : 'Tắt thiết bị', status, time: timestamp ? new Date(timestamp).toLocaleTimeString('vi-VN') : '' };
  });
}

export function mapSensors(records: Array<Record<string, unknown>>): SensorRow[] {
  return records.map((record, index) => {
    const sensor = String(record.sensor || 'Cảm biến');
    const timestamp = String(record.timestamp || '');
    return { id: Number(record.id || index), sensor: sensor.startsWith('Cảm biến') ? sensor : `Cảm biến ${sensor.toLowerCase()}`, value: Number(record.value), unit: String(record.unit || ''), time: timestamp ? new Date(timestamp).toLocaleTimeString('vi-VN') : '', status: 'Ổn định' };
  });
}
