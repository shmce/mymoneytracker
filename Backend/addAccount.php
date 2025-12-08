<?php
require_once 'db_connect.php'; // session + $conn

header('Content-Type: application/json');

// Allow simple diagnostics for preflight requests (helps when page is served cross-origin)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // If you need CORS, uncomment the next line and set appropriate origin
    // header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
    http_response_code(200);
    echo json_encode(['ok' => true, 'method' => 'OPTIONS']);
    exit;
}

// Only allow POST for creating accounts
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed', 'allowed' => 'POST']);
    exit;
}

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Accept JSON body or traditional form POST
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);
if (!is_array($data)) {
    // Fallback to $_POST for form-encoded submissions
    if (!empty($_POST)) {
        $data = $_POST;
    } else {
        // Nothing parseable
        http_response_code(400);
        echo json_encode(['error' => 'Bad JSON or empty POST body', 'raw' => $raw]);
        exit;
    }
}

$platform = trim($data['platform'] ?? '');
$platformNumber = trim($data['platformNumber'] ?? '');
$availableAssets = isset($data['availableAssets']) ? floatval($data['availableAssets']) : 0.0;

if ($platform === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Platform (account name) required']);
    exit;
}

if ($platformNumber === '') {
    $platformNumber = 'ACC-' . time() . '-' . rand(1000,9999);
}

try {
    $stmt = $conn->prepare("INSERT INTO accounts (user_id, platformNumber, platform, availableAssets)
                           VALUES (?, ?, ?, ?)");
    
    if ($stmt === false) {
        throw new Exception('Failed to prepare insert statement: ' . $conn->error);
    }
    
    $stmt->bind_param("issd", $_SESSION['user_id'], $platformNumber, $platform, $availableAssets);
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Failed to create account: ' . $stmt->error);
    }
    
    $stmt->close();

    // return the created account
    $res = $conn->prepare("SELECT platformNumber, platform, availableAssets FROM accounts WHERE id = ?");
    
    if ($res === false) {
        throw new Exception('Failed to prepare select statement: ' . $conn->error);
    }
    
    $lastId = $conn->insert_id;
    $res->bind_param("i", $lastId);
    
    if (!$res->execute()) {
        $res->close();
        throw new Exception('Failed to retrieve created account: ' . $res->error);
    }
    
    $r = $res->get_result()->fetch_assoc();
    $res->close();
    
    if (!$r) {
        throw new Exception('Account created but could not be retrieved');
    }
    
    echo json_encode($r);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>
