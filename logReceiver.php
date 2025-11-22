<?php
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    die('Unauthorized');
}

if (empty($_POST['log'])) {
    http_response_code(400);
    die('No log message');
}
saveLog($_POST['log'], $conn);   // function already in db_connect.php
echo 'logged';