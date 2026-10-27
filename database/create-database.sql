-- MySQL 8. Chay bang tai khoan quan tri tren database moi.
CREATE DATABASE IF NOT EXISTS iot_monitoring CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE iot_monitoring;
CREATE TABLE IF NOT EXISTS users (
  user_id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS sensors (
  sensor_id INT AUTO_INCREMENT PRIMARY KEY, sensor_type VARCHAR(100) NOT NULL,
  unit VARCHAR(20) NOT NULL, location VARCHAR(255), status BOOLEAN NOT NULL DEFAULT FALSE,
  last_value DOUBLE NULL, last_updated DATETIME(3) NULL
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS devices (
  device_id INT AUTO_INCREMENT PRIMARY KEY, device_name VARCHAR(100) NOT NULL,
  status BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS data_sensors (
  data_id INT AUTO_INCREMENT PRIMARY KEY, sensor_id INT NOT NULL, value DOUBLE NOT NULL,
  timestamp DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (sensor_id) REFERENCES sensors(sensor_id), INDEX (sensor_id,timestamp)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS `action` (
  action_id INT AUTO_INCREMENT PRIMARY KEY, device_id INT NOT NULL,
  action_type ENUM('ON','OFF') NOT NULL,
  timestamp DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (device_id) REFERENCES devices(device_id),
  INDEX (device_id,timestamp)
) ENGINE=InnoDB;
INSERT IGNORE INTO devices (device_id,device_name) VALUES (1,'LED 1'),(2,'LED 2'),(3,'LED 3');
INSERT IGNORE INTO sensors (sensor_id,sensor_type,unit) VALUES (1,'Nhiệt độ','°C'),(2,'Độ ẩm','%'),(3,'Ánh sáng','lux');
