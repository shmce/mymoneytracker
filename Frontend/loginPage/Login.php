<?php
require_once '../../Backend/db_connect.php';

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email']) && isset($_POST['password'])) {
    $email = $_POST['email'];
    $pass  = $_POST['password'];

    // Server-side validation: require at least 8 characters and only allowed characters
    if (strlen($pass) < 8) {
        header("Location: Login.html?error=pwd_short");
        exit;
    }

    // Allowed characters: letters, numbers and . - _ ? ! $
    if (!preg_match('/^[A-Za-z0-9.\-_%\?\!\$]+$/', $pass)) {
        // Note: '%' included to be safe for patterns, but we primarily allow . - _ ? ! $
        header("Location: Login.html?error=pwd_chars");
        exit;
    }

    $sql = "SELECT id, first_name, last_name, password FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 1) {
        $user = $res->fetch_assoc();
        if (password_verify($pass, $user['password'])) {
            // Session already started in db_connect.php
            $_SESSION['user_id'] = $user['id'];
            // Set both parts and combined name
            $first = $user['first_name'] ?? '';
            $last = $user['last_name'] ?? '';
            $_SESSION['first_name'] = $first;
            $_SESSION['last_name'] = $last;
            $_SESSION['name'] = trim($first . ' ' . $last);
            header("Location: ../homePage/homePage.html");
            exit;
        }
    }
    
    // Invalid credentials - redirect back with error
    header("Location: Login.html?error=invalid");
    exit;
} else {
    // No POST data - redirect to login page
    header("Location: Login.html");
    exit;
}
?>