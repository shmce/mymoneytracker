<?php
require_once '../../Backend/db_connect.php';   // gives $conn

$first_name = trim($_POST['first_name'] ?? '');
$last_name  = trim($_POST['last_name'] ?? '');
$name       = trim($first_name . ' ' . $last_name);
$email      = $_POST['email'] ?? '';
$password   = $_POST['password'] ?? '';
$gender     = $_POST['gender'] ?? '';
$dobMonth   = $_POST['dob_month'] ?? '';
$dobDay     = $_POST['dob_day'] ?? '';
$dobYear    = $_POST['dob_year'] ?? '';

if ($password !== ($_POST['confirm_password'] ?? '')) {
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

// Check for existing account with same (lowercased) email
$checkSql = "SELECT id FROM users WHERE email = ? LIMIT 1";
$checkStmt = $conn->prepare($checkSql);
if (!$checkStmt) {
    http_response_code(500);
    echo "Database error (prepare). Please try again.";
    exit;
}
$checkStmt->bind_param("s", $email);
$checkStmt->execute();
$result = $checkStmt->get_result();
if ($result && $result->num_rows > 0) {
    // Email already in use
    $checkStmt->close();
    http_response_code(400);
    echo "Email already in use. Please choose a different email.";
    exit;
}
$checkStmt->close();

$hash  = password_hash($password, PASSWORD_DEFAULT);
$dob   = "$dobYear-$dobMonth-$dobDay";

$sql = "INSERT INTO users (first_name, last_name, email, password, gender, dob)
    VALUES (?, ?, ?, ?, ?, ?)";
 $stmt = $conn->prepare($sql);
 if (!$stmt) {
     http_response_code(500);
     echo "Database error (prepare insert). Please try again.";
     exit;
 }
 $stmt->bind_param("ssssss", $first_name, $last_name, $email, $hash, $gender, $dob);
 if (!$stmt->execute()) {
     http_response_code(500);
     echo "Error creating user account. Please try again.";
     $stmt->close();
     exit;
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
header("Location: ../homePage/homePage.html");
exit;
?>