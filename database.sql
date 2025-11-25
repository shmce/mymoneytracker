-- 1) create database (only if it does not yet exist)
CREATE DATABASE IF NOT EXISTS mymoney_tracker
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;

USE mymoney_tracker;

-- 2) users table
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(120) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  gender     VARCHAR(20),
  dob        DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 3) accounts table
CREATE TABLE IF NOT EXISTS accounts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  platform        VARCHAR(60) NOT NULL,
  platformNumber  VARCHAR(60) NOT NULL,
  availableAssets DECIMAL(12,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4) run_logs table
CREATE TABLE IF NOT EXISTS run_logs (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  run_datetime DATETIME NOT NULL,
  log_message  TEXT NOT NULL,
  user_id      INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5) transactions table (store user transactions)
CREATE TABLE IF NOT EXISTS transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  tx_type VARCHAR(20) NOT NULL,
  account VARCHAR(120),
  account_from VARCHAR(120),
  account_to VARCHAR(120),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  tx_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);