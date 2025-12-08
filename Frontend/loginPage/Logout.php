<?php
// logout.php
require_once '../../Backend/db_connect.php'; // starts session

// Destroy session
session_unset();
session_destroy();

// Delete cookies
setcookie("user_email", "", time() - 3600, "/");
setcookie("user_id", "", time() - 3600, "/");

// Prevent caching of this page and prevent back-button access
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");

header("Location: Login.html");
exit;