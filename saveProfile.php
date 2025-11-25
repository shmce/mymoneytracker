<?php
require_once 'db_connect.php'; // expects session_start() and $conn

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$name = isset($data['name']) ? trim($data['name']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$gender = isset($data['gender']) ? trim($data['gender']) : null;
$dob = isset($data['dob']) && $data['dob'] !== '' ? trim($data['dob']) : null; // expect YYYY-MM-DD or null

// Basic validation
if ($email !== null && $email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

$userId = $_SESSION['user_id'];

// Update statement - update provided fields
$sql = "UPDATE users SET name = ?, email = ?, gender = ?, dob = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    http_response_code(500);
    echo json_encode(['error' => 'DB prepare failed']);
    exit;
}

$stmt->bind_param('ssssi', $name, $email, $gender, $dob, $userId);
$exec = $stmt->execute();
if (!$exec) {
    http_response_code(500);
    echo json_encode(['error' => 'DB update failed']);
    $stmt->close();
    exit;
}

$stmt->close();

echo json_encode(['success' => true]);
?>