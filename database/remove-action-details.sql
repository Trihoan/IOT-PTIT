-- Chon dung database truoc khi chay. Xoa user_id, triggered_by, status
-- khoi bang action, giu lai ID, thiet bi, lenh ON/OFF va thoi gian.
-- Sao luu truoc: du lieu trong cac cot bi xoa se khong khoi phuc duoc.
SET SESSION group_concat_max_len = 100000;
SELECT GROUP_CONCAT(DISTINCT CONCAT('DROP FOREIGN KEY `', REPLACE(constraint_name,'`','``'), '`') SEPARATOR ', ')
INTO @foreign_keys
FROM information_schema.key_column_usage
WHERE table_schema=DATABASE() AND table_name='action'
AND column_name IN ('user_id','triggered_by','status') AND referenced_table_name IS NOT NULL;
SET @sql=IF(@foreign_keys IS NULL,'SELECT 1',CONCAT('ALTER TABLE `action` ',@foreign_keys));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SELECT GROUP_CONCAT(CONCAT('DROP COLUMN `',column_name,'`') SEPARATOR ', ')
INTO @columns_to_drop
FROM information_schema.columns
WHERE table_schema=DATABASE() AND table_name='action' AND column_name IN ('user_id','triggered_by','status');
SET @sql=IF(@columns_to_drop IS NULL,'SELECT 1',CONCAT('ALTER TABLE `action` ',@columns_to_drop));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
