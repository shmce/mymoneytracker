<?php
require_once 'db_connect.php'; // session + $conn

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$raw = file_get_contents('php://input');
$input = json_decode($raw, true);

if (!is_array($input) || !isset($input['id']) || empty($input['id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing transaction id']);
    exit;
}

$txId = intval($input['id']);
$userId = $_SESSION['user_id'];

try {
    // fetch transaction
    $stmt = $conn->prepare("SELECT id, user_id, tx_type, account, account_from, account_to, amount FROM transactions WHERE id = ?");
    if ($stmt === false) throw new Exception('Failed to prepare query: ' . $conn->error);
    $stmt->bind_param("i", $txId);
    $stmt->execute();
    $res = $stmt->get_result();
    $tx = $res->fetch_assoc();
    $stmt->close();

    if (!$tx) {
        http_response_code(404);
        echo json_encode(['error' => 'Transaction not found']);
        exit;
    }

    if (intval($tx['user_id']) !== intval($userId)) {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    // prepare adjust statement
    $adjustStmt = $conn->prepare("UPDATE accounts SET availableAssets = availableAssets + ? WHERE platformNumber = ? AND user_id = ? AND (availableAssets + ?) >= 0");
    if ($adjustStmt === false) throw new Exception('Failed to prepare balance update: ' . $conn->error);

    $conn->begin_transaction();

    $txType = $tx['tx_type'];
    $amount = floatval($tx['amount']);

    if ($txType === 'expense' || $txType === 'income') {
        // try to determine platformNumber: prefer account_from, else lookup by platform display name
        $platformNumber = null;
        if (!empty($tx['account_from'])) {
            $platformNumber = $tx['account_from'];
        } else if (!empty($tx['account'])) {
            $q = $conn->prepare("SELECT platformNumber FROM accounts WHERE platform = ? AND user_id = ? LIMIT 1");
            if ($q) {
                $q->bind_param("si", $tx['account'], $userId);
                $q->execute();
                $r = $q->get_result();
                $row = $r->fetch_assoc();
                if ($row && isset($row['platformNumber'])) $platformNumber = $row['platformNumber'];
                $q->close();
            }
        }

        if ($platformNumber !== null && $platformNumber !== '') {
            // reverse delta: negate stored amount
            $delta = -1 * $amount;
            $adjustStmt->bind_param("dsid", $delta, $platformNumber, $userId, $delta);
            $adjustStmt->execute();
            if ($adjustStmt->affected_rows === 0) {
                $adjustStmt->close();
                $conn->rollback();
                http_response_code(400);
                echo json_encode(['error' => 'Failed to adjust account balance when deleting transaction.']);
                exit;
            }
        }

    } else if ($txType === 'transfer') {
        $from = $tx['account_from'];
        $to = $tx['account_to'];
        $amt = floatval($amount);

        if ($from) {
            $deltaFrom = $amt; // return to source
            $adjustStmt->bind_param("dsid", $deltaFrom, $from, $userId, $deltaFrom);
            $adjustStmt->execute();
            if ($adjustStmt->affected_rows === 0) {
                $adjustStmt->close();
                $conn->rollback();
                http_response_code(400);
                echo json_encode(['error' => 'Failed to adjust source account balance when deleting transfer.']);
                exit;
            }
        }

        if ($to) {
            $deltaTo = -1 * $amt; // remove from destination
            $adjustStmt->bind_param("dsid", $deltaTo, $to, $userId, $deltaTo);
            $adjustStmt->execute();
            if ($adjustStmt->affected_rows === 0) {
                $adjustStmt->close();
                $conn->rollback();
                http_response_code(400);
                echo json_encode(['error' => 'Failed to adjust destination account balance when deleting transfer.']);
                exit;
            }
        }
    }

    // delete transaction
    $del = $conn->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
    if ($del === false) {
        $conn->rollback();
        throw new Exception('Failed to prepare delete statement: ' . $conn->error);
    }
    $del->bind_param("ii", $txId, $userId);
    if (!$del->execute()) {
        $del->close();
        $conn->rollback();
        throw new Exception('Failed to delete transaction: ' . $del->error);
    }
    $del->close();

    $conn->commit();
    if (isset($adjustStmt) && $adjustStmt) $adjustStmt->close();

    echo json_encode(['success' => true, 'id' => $txId]);

} catch (Exception $e) {
    if ($conn->in_transaction) $conn->rollback();
    http_response_code(500);
    echo json_encode(['error' => 'Server error: ' . $e->getMessage()]);
}

?>
