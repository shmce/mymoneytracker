<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$stmt = $conn->prepare("SELECT id, tx_type, account, account_from, account_to, amount, description, tx_datetime
                        FROM transactions
                        WHERE user_id = ?
                        ORDER BY tx_datetime DESC, id DESC");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$res = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode($res);
?>
