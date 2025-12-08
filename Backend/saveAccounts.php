<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON or empty body']);
    exit;
}

if (empty($data)) {
    http_response_code(400);
    echo json_encode(['error' => 'No accounts provided']);
    exit;
}

try {
    $stmt = $conn->prepare("UPDATE accounts
                            SET availableAssets = ?
                            WHERE platformNumber = ? AND user_id = ?");
    
    if ($stmt === false) {
        throw new Exception('Failed to prepare update statement: ' . $conn->error);
    }

    foreach ($data as $acc) {
        if (!isset($acc['platformNumber']) || !isset($acc['availableAssets'])) {
            http_response_code(400);
            echo json_encode(['error' => 'Missing required fields: platformNumber and availableAssets']);
            $stmt->close();
            exit;
        }

        $stmt->bind_param("dsi", 
            $acc['availableAssets'],
            $acc['platformNumber'],
            $_SESSION['user_id']
        );
        
        if (!$stmt->execute()) {
            $stmt->close();
            throw new Exception('Failed to update account: ' . $stmt->error);
        }
    }
    
    $stmt->close();
    echo json_encode(['success' => true, 'message' => 'Accounts updated successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}