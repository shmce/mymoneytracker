<?php
require_once 'db_connect.php';   // session_start() + $conn

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT first_name, last_name, email, gender, dob, created_at FROM users WHERE id = ? LIMIT 1");
    
    if ($stmt === false) {
        throw new Exception('Failed to prepare query: ' . $conn->error);
    }
    
    $stmt->bind_param("i", $_SESSION['user_id']);
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Failed to execute query: ' . $stmt->error);
    }
    
    $res = $stmt->get_result();
    $data = $res->fetch_assoc();
    $stmt->close();
    
    if ($data) {
        // Build compatibility fields: `name` as full name and include first/last separately
        $data['first_name'] = $data['first_name'] ?? '';
        $data['last_name'] = $data['last_name'] ?? '';
        $data['name'] = trim($data['first_name'] . ' ' . $data['last_name']);
        // dob may be NULL; return as-is (YYYY-MM-DD) so client can parse
        echo json_encode($data);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Profile not found']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
