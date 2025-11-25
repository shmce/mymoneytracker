<?php
/*  ONE-PLACE CONNECTION  */
session_start();

$host = 'localhost';
$user = 'root';
$pass = '';          // ← change if your MySQL has a password
$db   = 'mymoney_tracker';

$conn = new mysqli($host, $user, $pass, $db);
if ($conn->connect_error) {
    http_response_code(500);
    die(json_encode(['error' => 'Connection failed: ' . $conn->connect_error]));
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

/*  NEW: full database export (users + accounts + tx + logs)  */
if (isset($_GET['export']) && $_GET['export'] == '1') {
    header('Content-Type: application/json; charset=utf-8');

    $out = [];

    // users
    $res = $conn->query("SELECT id,name,email,gender,dob,created_at,updated_at FROM users");
    $out['users'] = $res->fetch_all(MYSQLI_ASSOC);

    // accounts
    $res = $conn->query("SELECT id,user_id,platform,platformNumber,availableAssets,created_at,updated_at FROM accounts");
    $out['accounts'] = $res->fetch_all(MYSQLI_ASSOC);

    // transactions
    $res = $conn->query("SELECT id,user_id,tx_type,account,account_from,account_to,amount,description,tx_datetime,created_at,updated_at FROM transactions");
    $out['transactions'] = $res->fetch_all(MYSQLI_ASSOC);

    // run_logs
    $res = $conn->query("SELECT id,run_datetime,log_message,user_id,created_at,updated_at FROM run_logs");
    $out['run_logs'] = $res->fetch_all(MYSQLI_ASSOC);

    // default_accounts (handy for the recipient)
    $res = $conn->query("SELECT platform,platformNumber,availableAssets FROM default_accounts");
    $out['default_accounts'] = $res->fetch_all(MYSQLI_ASSOC);

    echo json_encode($out, JSON_PRETTY_PRINT);
    exit;
}