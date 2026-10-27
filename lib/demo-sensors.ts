import type { SensorRecord } from './store';

// Presentation data only: never write these samples to the telemetry store/database.
export function demoReadings(now = Date.now()): SensorRecord[] {
  const end = Math.floor(now / 5000) * 5000;
  return Array.from({ length: 61 }, (_, index) => {
    const time = end - (60 - index) * 5000;
    const phase = time / 60000;
    const values = [
      27 + Math.sin(phase * .7) * 1.8 + Math.sin(phase * 2.1) * .3,
      65 + Math.sin(phase * .5 + 1) * 6,
      600 + Math.sin(phase * .8 + 2) * 180 + Math.cos(phase * 2) * 25,
    ];
    return values.map((value, i) => ({
      id: time / 5000 * 3 + i, sensorId: i + 1,
      sensor: ['Nhiệt độ', 'Độ ẩm', 'Ánh sáng'][i], unit: ['°C', '%', 'lux'][i],
      value: Number(value.toFixed(1)), timestamp: new Date(time).toISOString(),
    }));
  }).flat();
}

export function hasFreshSensors(records: SensorRecord[], now = Date.now()) {
  return [1, 2, 3].every(id => records.some(row => row.sensorId === id && Number.isFinite(row.value)
    && now - Date.parse(row.timestamp) >= 0 && now - Date.parse(row.timestamp) <= 15000));
}
