<?php
require_once 'db_connect.php';   // session_start() + $conn

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die(json_encode(['error' => 'Unauthorized']));
}

$stmt = $conn->prepare("SELECT platformNumber, platform, availableAssets
                        FROM accounts
                        WHERE user_id = ?
                        ORDER BY platform");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$res = $stmt->get_result();

header('Content-Type: application/json');
echo json_encode($res->fetch_all(MYSQLI_ASSOC));
$stmt->close();