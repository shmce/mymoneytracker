# MyMoney Tracker – Multi-user version

## Prerequisites
- PHP ≥ 7.4
- MySQL / MariaDB
- Any web-server (XAMPP, MAMP, WAMP, Laravel-Serve, etc.)

## Quick start for new developers

1. Clone / download this repo into your web-root (`htdocs`, `www`, etc.).
2. Open phpMyAdmin (usually http://localhost/phpmyadmin).
3. Click the **"Import"** tab ➜ choose `database.sql` ➜ press **Go**.  
   (This creates the database `mymoney_tracker` and all tables.)
4. Edit `db_connect.php` and **only** change these if your MySQL settings differ:
   ```php
   $host = 'localhost';
   $user = 'root';
  pass = '';          // add your password if you have one
   $db   = 'mymoney_tracker';