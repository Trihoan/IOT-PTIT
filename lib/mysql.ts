import mysql, { type Pool } from 'mysql2/promise';

const globalDb = globalThis as typeof globalThis & { mysqlPool?: Pool };
export const usesMysql = () => process.env.DB_DRIVER === 'mysql';
export function getPool() {
  if (!usesMysql()) throw new Error('DB_DRIVER must be mysql');
  return globalDb.mysqlPool ??= mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'iot_app', password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'iot_monitoring', timezone: 'Z',
    waitForConnections: true, connectionLimit: 5,
  });
}
