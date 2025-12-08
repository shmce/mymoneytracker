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

// Support either separate first/last name or a single `name` value for compatibility
$first_name = isset($data['first_name']) ? trim($data['first_name']) : null;
$last_name = isset($data['last_name']) ? trim($data['last_name']) : null;
$name = isset($data['name']) ? trim($data['name']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$gender = isset($data['gender']) ? trim($data['gender']) : null;
$dob = isset($data['dob']) && $data['dob'] !== '' ? trim($data['dob']) : null; // expect YYYY-MM-DD or null

// If first/last not provided but `name` is, split it
if (($first_name === null || $first_name === '') && $name) {
    $parts = preg_split('/\s+/', $name);
    $first_name = array_shift($parts);
    $last_name = implode(' ', $parts);
}
// Ensure not null values passed to the query
$first_name = $first_name ?? '';
$last_name = $last_name ?? '';

// Basic validation
if ($email !== null && $email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

$userId = $_SESSION['user_id'];

try {
    // Update statement - store first_name and last_name separately
    $sql = "UPDATE users SET first_name = ?, last_name = ?, email = ?, gender = ?, dob = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    
    if ($stmt === false) {
        throw new Exception('Failed to prepare update statement: ' . $conn->error);
    }
    
    $stmt->bind_param('sssssi', $first_name, $last_name, $email, $gender, $dob, $userId);
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Failed to update profile: ' . $stmt->error);
    }
    
    $stmt->close();

    // Update session cache for name parts
    $_SESSION['first_name'] = $first_name;
    $_SESSION['last_name'] = $last_name;
    $_SESSION['name'] = trim($first_name . ' ' . $last_name);

    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}
?>