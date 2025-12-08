<?php
require_once '../../Backend/db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email'], $_POST['password'])) {
    $email  = trim($_POST['email']);
    $pass   = $_POST['password'];
    $remember = isset($_POST['remember']) && $_POST['remember'] === '1';

    // Validate password
    if (strlen($pass) < 8 || !preg_match('/^[A-Za-z0-9.\-_\?\!\$]+$/', $pass)) {
        header("Location: Login.html?error=invalid");
        exit;
    }

    $stmt = $conn->prepare("SELECT id, first_name, last_name, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 1) {
        $user = $res->fetch_assoc();
        if (password_verify($pass, $user['password'])) {
            // Start session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['first_name'] = $user['first_name'];
            $_SESSION['last_name']  = $user['last_name'];
            $_SESSION['name'] = trim($user['first_name'] . ' ' . $user['last_name']);

            // Set cookies if "Remember me" checked
            if ($remember) {
                $exp = time() + (86400 * 30); // 30 days
                setcookie("user_email", $email, $exp, "/");
                setcookie("user_id", $user['id'], $exp, "/");
            }

            header("Location: ../homePage/homePage.php");
            exit;
        }
    }

    header("Location: Login.html?error=invalid");
    exit;
}
header("Location: Login.html");