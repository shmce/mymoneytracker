<?php
/*  ONE-PLACE CONNECTION  */
session_start();  // Start session for user authentication

$host = 'localhost';
$user = 'root';
$pass = '';          // ← change if your MySQL has a password
$db   = 'mymoney_tracker';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

/*  VERY small helper to save a log row  */
function saveLog(string $msg, mysqli $conn) : void
{
    $sql = "INSERT INTO run_logs (run_datetime, log_message, user_id)
            VALUES (NOW(), ?, ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("si", $msg, $_SESSION['user_id']);
    $stmt->execute();
    $stmt->close();
}
?>