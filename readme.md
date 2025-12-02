## MyMoney Tracker — Multi-user (local development)

Lightweight personal finance tracker intended for local development with XAMPP/WAMP/MAMP.

Contents: frontend pages (HTML/CSS/JS) under `Frontend/`, backend PHP under `Backend/`, and DB schema in `SQL/database.sql`.

## Prerequisites

- PHP (7.4+ recommended)
- MySQL / MariaDB
- Web server (XAMPP on Windows is recommended for local testing)

## Quick start (Windows + XAMPP)

1. Place the project folder inside your web root (e.g. `C:\xampp\htdocs\`).
2. Start Apache and MySQL from the XAMPP Control Panel.
3. Import the database schema:
   - Option A — phpMyAdmin (GUI): open http://localhost/phpmyadmin, go to the `Import` tab, choose `SQL/database.sql`, click `Go`.
   - Option B — CLI (PowerShell):
     ```powershell
     mysql -u root < "C:\xampp\htdocs\SQL\database.sql"
     ```
   This creates the `mymoney_tracker` database with the needed tables (`users`, `accounts`, `transactions`).
4. Configure DB connection if needed: edit `Backend/db_connect.php` and set your MySQL credentials. By default the project expects:
   ```php
   $host = 'localhost';
   $user = 'root';
   $pass = ''; // set this if your MySQL root has a password
   $db   = 'mymoney_tracker';
   ```

## Run and test

1. Open the signup page in your browser: `http://localhost/Frontend/SignupPage/signUp.html` and register a user.
2. Login at `http://localhost/Frontend/loginPage/Login.html`.
3. Successful login redirects to `Frontend/homePage/homePage.html` and the greeting shows the first name.

## Notes for developers

- API endpoints are under `Backend/` (e.g. `getProfile.php`, `saveProfile.php`, `getAccounts.php`). They expect session-based auth (`$_SESSION['user_id']`).
- Profile fields store `first_name` and `last_name` separately. Many frontend pages accept either `name` (compatibility) or `first_name`/`last_name` explicitly.
- If you change the DB structure, update `SQL/database.sql` and the backend queries accordingly.

## Troubleshooting

- "Unknown column 'first_name'" — means your database schema is out-of-date; re-import `SQL/database.sql` or run the migration to add `first_name`/`last_name`.
- "Table ... doesn't exist" — ensure you imported `database.sql` successfully and that MySQL is running.

If you'd like, I can add a small script to auto-import the SQL from the project using a Node/PHP helper, or provide step-by-step screenshots for phpMyAdmin.

---
Project maintained locally; update this README if you add new DB fields or move files.
