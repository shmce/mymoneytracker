<?php
require_once '../../Backend/db_connect.php';   // gives $conn

header('Content-Type: text/plain'); // Use text/plain to avoid HTML injection

// Get and sanitize input
$first_name = trim($_POST['first_name'] ?? '');
$last_name  = trim($_POST['last_name'] ?? '');
$name       = trim($first_name . ' ' . $last_name);
$email      = trim($_POST['email'] ?? '');
$password   = $_POST['password'] ?? '';
$confirm_password = $_POST['confirm_password'] ?? '';
$gender     = $_POST['gender'] ?? '';
$dobMonth   = $_POST['dob_month'] ?? '';
$dobDay     = $_POST['dob_day'] ?? '';
$dobYear    = $_POST['dob_year'] ?? '';

// Validate password match
if ($password !== $confirm_password) {
    http_response_code(400);
    echo "Passwords do not match.";
    exit;
}

// Normalize, lowercase and validate email
$email = trim(strtolower($email));
if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo "Invalid email address.";
    exit;
}

// Server-side password validation: length and allowed characters
if (strlen($password) < 8) {
    http_response_code(400);
    echo "Password must be at least 8 characters long.";
    exit;
}
// Allow only alphanumeric and these special characters: . - _ ? ! $
if (!preg_match('/^[A-Za-z0-9.\-_\?\!\$]+$/', $password)) {
    http_response_code(400);
    echo "Password contains invalid characters. Only letters, numbers and the characters . - _ ? ! $ are allowed.";
    exit;
}

// Validate required fields
if (empty($first_name) || empty($last_name)) {
    http_response_code(400);
    echo "First name and last name are required.";
    exit;
}

try {
    // Check for existing account with same (lowercased) email
    $checkSql = "SELECT id FROM users WHERE email = ? LIMIT 1";
    $checkStmt = $conn->prepare($checkSql);
    if (!$checkStmt) {
        throw new Exception('Database error (prepare check): ' . $conn->error);
    }
    $checkStmt->bind_param("s", $email);
    
    if (!$checkStmt->execute()) {
        $checkStmt->close();
        throw new Exception('Database error (execute check): ' . $checkStmt->error);
    }
    
    $result = $checkStmt->get_result();
    if ($result && $result->num_rows > 0) {
        // Email already in use
        $checkStmt->close();
        http_response_code(400);
        echo "Email already in use. Please choose a different email.";
        exit;
    }
    $checkStmt->close();

    // Hash password and prepare date of birth
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $dob = '';
    if (!empty($dobYear) && !empty($dobMonth) && !empty($dobDay)) {
        $dob = "$dobYear-$dobMonth-$dobDay";
    }

    // Insert new user
    $sql = "INSERT INTO users (first_name, last_name, email, password, gender, dob)
        VALUES (?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Database error (prepare insert): ' . $conn->error);
    }
    
    $stmt->bind_param("ssssss", $first_name, $last_name, $email, $hash, $gender, $dob);
    
    if (!$stmt->execute()) {
        $stmt->close();
        throw new Exception('Database error (execute insert): ' . $stmt->error);
    }
    
    $stmt->close();

    $user_id = $conn->insert_id;

    // Verify user was created successfully
    if (!$user_id) {
        http_response_code(500);
        echo "Error creating user account. Please try again.";
        exit;
    }

    /*  AUTO-LOGIN AFTER REGISTER  */
    $_SESSION['user_id'] = $user_id;
    // store both combined name and separate parts in session for compatibility
    $_SESSION['name'] = $name;
    $_SESSION['first_name'] = $first_name;
    $_SESSION['last_name'] = $last_name;
    
    // SET COOKIES (30 days)
    setcookie("user_email", $email, time() + (86400 * 30), "/");
    setcookie("user_id", $user_id, time() + (86400 * 30), "/");
    
    // Return success response (will be handled by JavaScript)
    http_response_code(200);
    echo "success";
    exit;
    
} catch (Exception $e) {
    http_response_code(500);
    echo "Server error. Please try again.";
    error_log("Signup error: " . $e->getMessage());
    exit;
}
?>