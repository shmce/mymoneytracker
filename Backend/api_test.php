<?php
/*  api_test.php  – tiny REST dispatcher for Postman  */
require_once 'db_connect.php';   // gives $conn + session_start()

header('Content-Type: application/json');
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['action'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing action']);
    exit;
}
$action = $input['action'];

/* ---------- 1. REGISTER ---------- */
if ($action === 'register') {
    $name     = trim($input['name']     ?? '');
    $email    = trim($input['email']    ?? '');
    $password = trim($input['password'] ?? '');
    $gender   = trim($input['gender']   ?? '');
    $dob      = $input['dob'] ?? null;

    if (!$name || !$email || !$password) {
        http_response_code(400);
        echo json_encode(['error' => 'name, email, password required']);
        exit;
    }
    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $conn->prepare("INSERT INTO users (name,email,password,gender,dob) VALUES (?,?,?,?,?)");
    $stmt->bind_param('sssss', $name, $email, $hash, $gender, $dob);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(['error' => 'User create failed', 'sql' => $stmt->error]);
        exit;
    }
    $userId = $conn->insert_id;
    $stmt->close();

    /*  NO DEFAULT ACCOUNTS ANY MORE  */

    $_SESSION['user_id'] = $userId;
    $_SESSION['name']    = $name;

    echo json_encode([
        'ok'  => true,
        'user'=> ['id'=>$userId,'name'=>$name,'email'=>$email]
    ]);
    exit;
}

/* ---------- 2. LOGIN ---------- */
if ($action === 'login') {
    $email = $input['email']    ?? '';
    $pass  = $input['password'] ?? '';

    $stmt = $conn->prepare("SELECT id,name,password FROM users WHERE email=?");
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res->num_rows !== 1) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    $user = $res->fetch_assoc();
    if (!password_verify($pass, $user['password'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid credentials']);
        exit;
    }
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['name']    = $user['name'];

    echo json_encode([
        'ok'   => true,
        'user' => ['id'=>$user['id'],'name'=>$user['name'],'email'=>$email]
    ]);
    exit;
}

/* ---------- 3. ADD ACCOUNT (needs login) ---------- */
if ($action === 'addAccount') {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }
    $platform = trim($input['platform'] ?? '');
    $assets   = floatval($input['availableAssets'] ?? 0);

    if (!$platform) {
        http_response_code(400);
        echo json_encode(['error' => 'platform required']);
        exit;
    }
    $platformNumber = 'ACC-' . time() . '-' . rand(1000,9999);

    $stmt = $conn->prepare("INSERT INTO accounts (user_id,platform,platformNumber,availableAssets)
                            VALUES (?,?,?,?)");
    $stmt->bind_param('issd', $_SESSION['user_id'], $platform, $platformNumber, $assets);
    if ($stmt->execute()) {
        echo json_encode(['ok'=>true, 'platformNumber'=>$platformNumber]);
    } else {
        http_response_code(500);
        echo json_encode(['error'=>'Insert failed','sql'=>$stmt->error]);
    }
    $stmt->close();
    exit;
}

/* ---------- unknown action ---------- */
http_response_code(400);
echo json_encode(['error' => 'Unknown action']);