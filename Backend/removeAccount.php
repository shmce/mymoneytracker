<?php
require_once 'db_connect.php'; // session_start() + $conn

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Get request body
$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input) || !isset($input['platformNumber']) || empty(trim($input['platformNumber']))) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid platformNumber']);
    exit;
}

$platformNumber = trim($input['platformNumber']);
$userId = $_SESSION['user_id'];

try {
    // First, verify that this account belongs to the user
    $verifyStmt = $conn->prepare("SELECT id FROM accounts WHERE platformNumber = ? AND user_id = ?");
    
    if ($verifyStmt === false) {
        throw new Exception('Failed to prepare verification query: ' . $conn->error);
    }
    
    $verifyStmt->bind_param("si", $platformNumber, $userId);
    
    if (!$verifyStmt->execute()) {
        $verifyStmt->close();
        throw new Exception('Failed to execute verification query: ' . $verifyStmt->error);
    }
    
    $result = $verifyStmt->get_result();

    if ($result->num_rows === 0) {
        $verifyStmt->close();
        http_response_code(403);
        echo json_encode(['error' => 'Account not found or does not belong to this user']);
        exit;
    }

    $verifyStmt->close();

    // Delete the account
    $deleteStmt = $conn->prepare("DELETE FROM accounts WHERE platformNumber = ? AND user_id = ?");
    
    if ($deleteStmt === false) {
        throw new Exception('Failed to prepare delete statement: ' . $conn->error);
    }
    
    $deleteStmt->bind_param("si", $platformNumber, $userId);

    if (!$deleteStmt->execute()) {
        $deleteStmt->close();
        throw new Exception('Failed to delete account: ' . $deleteStmt->error);
    }

    $deleteStmt->close();
    
    http_response_code(200);
    echo json_encode(['success' => true, 'message' => 'Account deleted successfully', 'platformNumber' => $platformNumber]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
