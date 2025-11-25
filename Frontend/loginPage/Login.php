<?php
require_once '../../Backend/db_connect.php';

// Check if form was submitted
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['email']) && isset($_POST['password'])) {
    $email = $_POST['email'];
    $pass  = $_POST['password'];

    $sql = "SELECT id, name, password FROM users WHERE email = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();

    if ($res->num_rows === 1) {
        $user = $res->fetch_assoc();
        if (password_verify($pass, $user['password'])) {
            // Session already started in db_connect.php
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name']    = $user['name'];
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