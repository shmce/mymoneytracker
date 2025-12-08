<?php
/**
 * Authentication check script
 * Include this at the top of protected pages to ensure user is logged in
 */
require_once 'db_connect.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    // Prevent caching
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Cache-Control: post-check=0, pre-check=0", false);
    header("Pragma: no-cache");
    header("Expires: 0");
    
    // Redirect to login
    header("Location: ../loginPage/Login.html");
    exit;
}

// Set cache-control headers for protected pages
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");
?>

