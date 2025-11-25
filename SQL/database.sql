-- 1)  wipe & recreate the database so the recipient starts clean
DROP DATABASE IF EXISTS mymoney_tracker;
CREATE DATABASE mymoney_tracker
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_general_ci;
USE mymoney_tracker;

-- 2)  users
CREATE TABLE users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(120) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  gender     VARCHAR(20),
  dob        DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3)  accounts
CREATE TABLE accounts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  platform        VARCHAR(60) NOT NULL,
  platformNumber  VARCHAR(60) NOT NULL,
  availableAssets DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4)  transactions
CREATE TABLE transactions (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  tx_type       VARCHAR(20) NOT NULL,
  account       VARCHAR(120),
  account_from  VARCHAR(120),
  account_to    VARCHAR(120),
  amount        DECIMAL(12,2) NOT NULL,
  description   TEXT,
  tx_datetime   DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at    DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);