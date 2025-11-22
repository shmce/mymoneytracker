<?php
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die('Unauthorized');
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data)) {
    http_response_code(400);
    die('Bad JSON');
}

$stmt = $conn->prepare("UPDATE accounts
                        SET availableAssets = ?
                        WHERE platformNumber = ? AND user_id = ?");
foreach ($data as $acc) {
    $stmt->bind_param("dsi", $acc['availableAssets'],
                            $acc['platformNumber'],
                            $_SESSION['user_id']);
    $stmt->execute();
}
echo 'ok';