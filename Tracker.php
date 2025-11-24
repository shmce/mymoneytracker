<?php
/*  ONE-PLACE CONNECTION  */
$host = 'localhost';   // 99 % of local installs
$user = 'root';        // default user in XAMPP / MAMP
$pass = '';            // default password (empty)
$db   = 'mymoney_logs';// the DB we just created

$conn = new mysqli($host, $user, $pass, $db);

/*  Did it work?  */
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

/*  VERY small helper: call it anywhere to save a message  */
function saveLog(string $msg, mysqli $conn) : void
{
    $sql = "INSERT INTO run_logs (run_datetime, log_message) VALUES (NOW(), ?)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $msg);
    $stmt->execute();
    $stmt->close();
}
?>