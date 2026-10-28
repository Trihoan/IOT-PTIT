import type { Device, View } from './types';

export const initialDevices: Device[] = [{ id: 1, name: 'Đèn LED 1', status: false }, { id: 2, name: 'Đèn LED 2', status: false }, { id: 3, name: 'Đèn LED 3', status: false }];

export const paths: Record<View, string> = { dashboard: 'Bảng điều khiển', sensors: 'Cảm biến dữ liệu', history: 'Lịch sử hoạt động', profile: 'Hồ sơ cá nhân' };
