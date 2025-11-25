<?php
require_once 'db_connect.php'; // session + $conn

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!is_array($data) || !isset($data['type'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Bad payload']);
    exit;
}

$type = $data['type'];
$rec = $data['record'] ?? [];

// ensure transactions table exists (best-effort)
try {
    $conn->query("CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        tx_type VARCHAR(20) NOT NULL,
        account VARCHAR(120),
        account_from VARCHAR(120),
        account_to VARCHAR(120),
        amount DECIMAL(12,2) NOT NULL,
        description TEXT,
        tx_datetime DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");
} catch (Exception $e) {
    // ignore - table creation is best-effort
}

// helper to update account balance
function adjustAccountBalance($conn, $platformNumber, $delta) {
    $stmt = $conn->prepare("UPDATE accounts SET availableAssets = availableAssets + ? WHERE platformNumber = ? AND user_id = ?");
    $stmt->bind_param("dsi", $delta, $platformNumber, $_SESSION['user_id']);
    $stmt->execute();
    $stmt->close();
}

// Insert transaction and update balances inside a DB transaction for atomicity
$conn->begin_transaction();
try {
    $insertTx = $conn->prepare("INSERT INTO transactions (user_id, tx_type, account, account_from, account_to, amount, description, tx_datetime)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    if ($insertTx === false) throw new Exception('Failed to prepare insert statement');

    $now = isset($rec['date']) ? date('Y-m-d H:i:s', strtotime($rec['date'])) : date('Y-m-d H:i:s');

    // prepare variable placeholders for bind_param
    $u = $_SESSION['user_id'];
    $txType = $type;
    $acct = null;
    $accFrom = null;
    $accTo = null;
    $amount = 0.0;
    $descVar = '';
    $nowVar = $now;

    if ($type === 'expense') {
        $platformNumber = $rec['platformNumber'] ?? ($rec['account'] ?? '');
        $amount = floatval($rec['amount']) * -1.0; // store as negative
        $descVar = $rec['description'] ?? '';
        $acct = $rec['account'] ?? null;

        $insertTx->bind_param("issssdss", $u, $txType, $acct, $accFrom, $accTo, $amount, $descVar, $nowVar);
        $insertTx->execute();
        if ($insertTx->errno) throw new Exception('Insert failed: '.$insertTx->error);
        // update balance
        if ($platformNumber) adjustAccountBalance($conn, $platformNumber, $amount);

    } else if ($type === 'income') {
        $platformNumber = $rec['platformNumber'] ?? ($rec['account'] ?? '');
        $amount = floatval($rec['amount']);
        $descVar = $rec['description'] ?? '';
        $acct = $rec['account'] ?? null;

        $insertTx->bind_param("issssdss", $u, $txType, $acct, $accFrom, $accTo, $amount, $descVar, $nowVar);
        $insertTx->execute();
        if ($insertTx->errno) throw new Exception('Insert failed: '.$insertTx->error);
        if ($platformNumber) adjustAccountBalance($conn, $platformNumber, $amount);

    } else if ($type === 'transfer') {
        $accFrom = $rec['fromPlatformNumber'] ?? ($rec['from'] ?? '');
        $accTo = $rec['toPlatformNumber'] ?? ($rec['to'] ?? '');
        $amount = floatval($rec['amount']);
        $descVar = $rec['description'] ?? '';

        $insertTx->bind_param("issssdss", $u, $txType, $acct, $accFrom, $accTo, $amount, $descVar, $nowVar);
        $insertTx->execute();
        if ($insertTx->errno) throw new Exception('Insert failed: '.$insertTx->error);
        if ($accFrom) adjustAccountBalance($conn, $accFrom, -$amount);
        if ($accTo) adjustAccountBalance($conn, $accTo, $amount);

    } else {
        throw new Exception('Unknown type');
    }

    $insertTx->close();
    $conn->commit();

} catch (Exception $e) {
    // rollback on any failure
    $conn->rollback();
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
    exit;
}

// return ok + current accounts for the client to refresh UI
$stmt = $conn->prepare("SELECT platformNumber, platform, availableAssets FROM accounts WHERE user_id = ? ORDER BY platform");
$stmt->bind_param("i", $_SESSION['user_id']);
$stmt->execute();
$res = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
$stmt->close();

echo json_encode(['status' => 'ok', 'accounts' => $res]);
?>
