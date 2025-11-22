<?php
require_once '../db_connect.php';

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
echo "Wrong e-mail or password.";
?>