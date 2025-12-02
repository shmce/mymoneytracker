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
    die("Passwords do not match.");
}

$hash  = password_hash($password, PASSWORD_DEFAULT);
$dob   = "$dobYear-$dobMonth-$dobDay";

$sql = "INSERT INTO users (first_name, last_name, email, password, gender, dob)
    VALUES (?, ?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ssssss", $first_name, $last_name, $email, $hash, $gender, $dob);
$stmt->execute();
$stmt->close();

$user_id = $conn->insert_id;

// Verify user was created successfully
if (!$user_id) {
    die("Error creating user account. Please try again.");
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