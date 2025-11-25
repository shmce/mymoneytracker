<?php
require_once '../../Backend/db_connect.php';   // gives $conn

$name     = $_POST['name'];
$email    = $_POST['email'];
$password = $_POST['password'];
$gender   = $_POST['gender'] ?? '';
$dobMonth = $_POST['dob_month'];
$dobDay   = $_POST['dob_day'];
$dobYear  = $_POST['dob_year'];

if ($password !== $_POST['confirm_password']) {
    die("Passwords do not match.");
}

$hash  = password_hash($password, PASSWORD_DEFAULT);
$dob   = "$dobYear-$dobMonth-$dobDay";

$sql = "INSERT INTO users (name, email, password, gender, dob)
        VALUES (?, ?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("sssss", $name, $email, $hash, $gender, $dob);
$stmt->execute();
$stmt->close();

$user_id = $conn->insert_id;

// Verify user was created successfully
if (!$user_id) {
    die("Error creating user account. Please try again.");
}

/*  AUTO-LOGIN AFTER REGISTER  */
$_SESSION['user_id'] = $user_id;
$_SESSION['name']    = $name;
header("Location: ../homePage/homePage.html");
exit;
?>