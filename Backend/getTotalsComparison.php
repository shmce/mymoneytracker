<?php
require_once 'db_connect.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$user_id = $_SESSION['user_id'];

// 1) Current total (sum of availableAssets)
$stmt = $conn->prepare("SELECT COALESCE(SUM(availableAssets),0) AS total FROM accounts WHERE user_id = ?");
$stmt->bind_param('i', $user_id);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();
$currentTotal = (float) ($res['total'] ?? 0);
$stmt->close();

// 2) Define periods: this month and previous month
$now = new DateTime();
$startThisMonth = (new DateTime($now->format('Y-m-01')))->format('Y-m-d 00:00:00');
$endThisMonth = $now->format('Y-m-d H:i:s');

$prevMonthDT = (new DateTime($now->format('Y-m-01')))->modify('-1 day');
$startPrevMonth = (new DateTime($prevMonthDT->format('Y-m-01')))->format('Y-m-d 00:00:00');
$endPrevMonth = (new DateTime($prevMonthDT->format('Y-m-t')))->format('Y-m-d 23:59:59');

// 3) This month's income and expenses
$stmt = $conn->prepare("SELECT
    COALESCE(SUM(CASE WHEN tx_type = 'income' THEN amount ELSE 0 END),0) AS income,
    COALESCE(SUM(CASE WHEN tx_type = 'expense' THEN ABS(amount) ELSE 0 END),0) AS expenses
    FROM transactions WHERE user_id = ? AND tx_datetime BETWEEN ? AND ?");
$stmt->bind_param('iss', $user_id, $startThisMonth, $endThisMonth);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();
$thisIncome = (float) ($res['income'] ?? 0);
$thisExpenses = (float) ($res['expenses'] ?? 0);
$stmt->close();

// 4) Previous month's income and expenses
$stmt = $conn->prepare("SELECT
    COALESCE(SUM(CASE WHEN tx_type = 'income' THEN amount ELSE 0 END),0) AS income,
    COALESCE(SUM(CASE WHEN tx_type = 'expense' THEN ABS(amount) ELSE 0 END),0) AS expenses
    FROM transactions WHERE user_id = ? AND tx_datetime BETWEEN ? AND ?");
$stmt->bind_param('iss', $user_id, $startPrevMonth, $endPrevMonth);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();
$prevIncome = (float) ($res['income'] ?? 0);
$prevExpenses = (float) ($res['expenses'] ?? 0);
$stmt->close();

// 5) For total comparison, compute net change since N days ago (default 30 days)
$sinceDate = (new DateTime())->modify('-30 days')->format('Y-m-d 00:00:00');
$stmt = $conn->prepare("SELECT
    COALESCE(SUM(CASE WHEN tx_type = 'income' THEN amount ELSE 0 END),0) AS income,
    COALESCE(SUM(CASE WHEN tx_type = 'expense' THEN ABS(amount) ELSE 0 END),0) AS expenses
    FROM transactions WHERE user_id = ? AND tx_datetime >= ?");
$stmt->bind_param('is', $user_id, $sinceDate);
$stmt->execute();
$res = $stmt->get_result()->fetch_assoc();
$incomeSince = (float) ($res['income'] ?? 0);
$expensesSince = (float) ($res['expenses'] ?? 0);
$stmt->close();

$netSince = $incomeSince - $expensesSince;
$prevTotal = $currentTotal - $netSince;

// Build response
$out = [
    'totalMoney' => $currentTotal,
    'previousTotalMoney' => $prevTotal,
    'monthlyIncome' => $thisIncome,
    'previousMonthlyIncome' => $prevIncome,
    'monthlyExpenses' => $thisExpenses,
    'previousMonthlyExpenses' => $prevExpenses,
    'sinceDays' => 30
];

echo json_encode($out);
?>
