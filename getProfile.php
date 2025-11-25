<?php
require_once 'db_connect.php';   // session_start() + $conn

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$stmt = $conn->prepare("SELECT name, email, gender, dob, created_at FROM users WHERE id = ? LIMIT 1");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$res = $stmt->get_result();
$data = $res->fetch_assoc();

header('Content-Type: application/json');
if ($data) {
    // dob may be NULL; return as-is (YYYY-MM-DD) so client can parse
    echo json_encode($data);
} else {
    http_response_code(404);
    echo json_encode(['error' => 'Profile not found']);
}

$stmt->close();
?>
