<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Include database connection
include 'db_connect.php';

// Get request body
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['platformNumber']) || empty($input['platformNumber'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing platformNumber']);
    exit;
}

$platformNumber = $input['platformNumber'];
$userId = $_SESSION['user_id'];

try {
    // First, verify that this account belongs to the user
    $verifyStmt = $conn->prepare("SELECT id FROM accounts WHERE platformNumber = ? AND user_id = ?");
    $verifyStmt->bind_param("si", $platformNumber, $userId);
    $verifyStmt->execute();
    $result = $verifyStmt->get_result();

    if ($result->num_rows === 0) {
        http_response_code(403);
        echo json_encode(['error' => 'Account not found or does not belong to this user']);
        $verifyStmt->close();
        exit;
    }

    // Delete the account
    $deleteStmt = $conn->prepare("DELETE FROM accounts WHERE platformNumber = ? AND user_id = ?");
    $deleteStmt->bind_param("si", $platformNumber, $userId);

    if ($deleteStmt->execute()) {
        http_response_code(200);
        echo json_encode(['ok' => true, 'platformNumber' => $platformNumber]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete account']);
    }

    $deleteStmt->close();
    $verifyStmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

$conn->close();
?>
