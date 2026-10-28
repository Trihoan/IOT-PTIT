// Kiểu dữ liệu dùng chung cho các trang.
export type Device = {
  id: number;
  name: string;
  status: boolean;
};

export type Action = {
  id: string;
  device: string;
  action: string;
  status: boolean;
  time: string;
  date: string;
};

export type SensorRow = {
  id: number;
  sensor: string;
  value: number;
  unit: string;
  time: string;
  status: string;
};

export type View = 'dashboard' | 'sensors' | 'history' | 'profile';
