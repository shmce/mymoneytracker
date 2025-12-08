<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

try {
    $stmt = $conn->prepare("SELECT id, tx_type, account, account_from, account_to, amount, description, tx_datetime
                            FROM transactions
                            WHERE user_id = ?
                            ORDER BY tx_datetime DESC, id DESC");
    
    if ($stmt === false) {
        throw new Exception('Failed to prepare query: ' . $conn->error);
    }
    
    $stmt->bind_param("i", $_SESSION['user_id']);
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Failed to execute query: ' . $stmt->error);
    }
    
    $res = $stmt->get_result();
    $transactions = $res->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    
    echo json_encode($transactions);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
