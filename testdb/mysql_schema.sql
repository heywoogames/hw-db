-- MySQL Schema for User Management

-- Drop table if exists to avoid conflicts
DROP TABLE IF EXISTS `user`;

-- Create user table
CREATE TABLE `user` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `username_UNIQUE` (`username` ASC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comments to table and columns
ALTER TABLE `user` COMMENT = '用户信息表';