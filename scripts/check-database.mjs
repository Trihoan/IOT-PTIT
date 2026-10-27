import mysql from 'mysql2/promise';

if (process.env.DB_DRIVER !== 'mysql') throw new Error('Set DB_DRIVER=mysql in .env.local first.');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1', port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'iot_app', password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'iot_monitoring',
});
try {
  const [rows] = await connection.query('SELECT DATABASE() AS database_name');
  console.log(rows);
  for (const table of ['users', 'devices', 'sensors', 'data_sensors', 'action']) {
    const [columns] = await connection.query('SHOW COLUMNS FROM ??', [table]);
    if (table === 'action' && columns.some(column => ['user_id', 'triggered_by', 'status'].includes(column.Field))) {
      throw new Error('Run database/remove-action-details.sql to update the old action table.');
    }
    console.log(`${table}: OK`);
  }
} finally { await connection.end(); }
