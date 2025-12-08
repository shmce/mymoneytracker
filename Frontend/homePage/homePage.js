// Destructure Vue functions
const { createApp, ref, onMounted, onUnmounted, reactive, computed, watch } = Vue;

createApp({
    setup() {
        // Sidebar Navigation
        const activeNav = ref('Dashboard');
        const navItems = ref([
            { name: 'Dashboard', icon: 'home' },
            { name: 'Records', icon: 'file-text' },
            { name: 'Transactions', icon: 'repeat' },
            { name: 'Settings', icon: 'settings' },
        ]);

        // Data Properties
        const currentInput = ref('0');
        const selectedAccount = ref(null);
        const transferToAccount = ref(null);
        const currentDateTime = ref('');
        const keypadKeys = ref(['1','2','3','4','5','6','7','8','9','.','0','<']);

        // Accounts and Totals
        const accounts = ref([]);
        const totalMoney = ref(0);
        const totalChangePercent = ref(null);
        const totalChangePositive = ref(null);
        const monthlyIncome = ref(0);
        const incomeChangePercent = ref(null);
        const incomeChangePositive = ref(null);
        const monthlyExpenses = ref(0);
        const expensesChangePercent = ref(null);
        const expensesChangePositive = ref(null);
        const userName = ref('');
        const initialIncome = ref(0);
        const initialExpenses = ref(0);
        const previousMonthlyIncome = ref(0);
        const previousMonthlyExpenses = ref(0);
        const previousMonthCalculated = ref(false); // Flag to calculate previous month only once
        
        // Transaction tabs and lists
        const activeTab = ref('expense');
        const tabs = ref([
            { key: 'expense', label: 'Expense' },
            { key: 'income', label: 'Income' },
            { key: 'transfer', label: 'Transfer' },
        ]);
        const expenseTransactions = ref([]);
        const incomeTransactions = ref([]);
        const transferTransactions = ref([]);
        const filterAccount = ref('');
        const filterMonth = ref('');
        const availableMonths = ref([]);

        const toNumber = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            const s = String(val).replace(/[^0-9.-]/g, '');
            return Number(s) || 0;
        };

        const loadAccountsFromServer = async () => {
            try {
                const res = await fetch('../../Backend/getAccounts.php', { credentials: 'include' });
                if (!res.ok) {
                    let errorMsg = 'Failed to load accounts';
                    try {
                        const data = await res.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch (e) {
                        // Response is not JSON, use status text
                        errorMsg = res.statusText || errorMsg;
                    }
                    throw new Error(errorMsg);
                }
                accounts.value = await res.json();
            } catch (e) {
                console.error('Could not load accounts from server', e);
                // Set empty array on error to prevent UI issues
                accounts.value = [];
            }
        };

        const loadProfileFromServer = async () => {
            try {
                const res = await fetch('../../Backend/getProfile.php', { credentials: 'include' });
                if (!res.ok) {
                    let errorMsg = 'Failed to load profile';
                    try {
                        const data = await res.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch (e) {
                        errorMsg = res.statusText || errorMsg;
                    }
                    throw new Error(errorMsg);
                }
                const data = await res.json();
                // Prefer explicit first_name from API; fall back to combined `name` and extract first word
                const first = (data.first_name || '').trim();
                if (first) {
                    userName.value = first;
                } else {
                    const fullName = (data.name || '').trim();
                    const firstName = fullName.split(/\s+/).filter(Boolean)[0] || fullName;
                    userName.value = firstName;
                }
            } catch (e) {
                console.error('Could not load profile from server', e);
                // Set default name on error
                userName.value = 'User';
            }
        };

         const computeTotals = async () => {
            try {
                const res = await fetch('../../Backend/getTotalsComparison.php', { credentials: 'include' });
                if (!res.ok) {
                    let errorMsg = 'Failed to fetch totals';
                    try {
                        const data = await res.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch (e) {
                        errorMsg = res.statusText || errorMsg;
                    }
                    throw new Error(errorMsg);
                }
                const data = await res.json();

                totalMoney.value = Number(data.totalMoney) || 0;
                monthlyIncome.value = Number(data.monthlyIncome) || 0;
                monthlyExpenses.value = Number(data.monthlyExpenses) || 0;

                const prevTotal = Number(data.previousTotalMoney) || 0;
                if (prevTotal === 0) {
                    totalChangePercent.value = 0;
                    totalChangePositive.value = null;
                } else {
                    const p = ((totalMoney.value - prevTotal) / Math.abs(prevTotal)) * 100;
                    totalChangePercent.value = Number(p.toFixed(1));
                    totalChangePositive.value = p >= 0;
                }

                const prevIncome = Number(data.previousMonthlyIncome) || 0;
                previousMonthlyIncome.value = prevIncome;
                if (prevIncome === 0) {
                    incomeChangePercent.value = 0;
                    incomeChangePositive.value = null;
                } else {
                    const ip = ((monthlyIncome.value - prevIncome) / Math.abs(prevIncome)) * 100;
                    incomeChangePercent.value = Number(ip.toFixed(1));
                    incomeChangePositive.value = ip >= 0;
                }

                const prevExpenses = Number(data.previousMonthlyExpenses) || 0;
                previousMonthlyExpenses.value = prevExpenses;
                if (prevExpenses === 0) {
                    expensesChangePercent.value = 0;
                    expensesChangePositive.value = null;
                } else {
                    const ep = ((monthlyExpenses.value - prevExpenses) / Math.abs(prevExpenses)) * 100;
                    expensesChangePercent.value = Number(ep.toFixed(1));
                    expensesChangePositive.value = monthlyExpenses.value < prevExpenses;
                }
            } catch (e) {
                console.error('Could not load totals comparison', e);
                // Fallback: calculate from accounts
                totalMoney.value = accounts.value.reduce((s,a) => s + toNumber(a.availableAssets), 0);
                try {
                    const res2 = await fetch('../../Backend/getTransactions.php', { credentials: 'include' });
                    if (!res2.ok) {
                        let errorMsg = 'Failed to fetch transactions';
                        try {
                            const data = await res2.json();
                            if (data && data.error) errorMsg = data.error;
                        } catch (e2) {
                            errorMsg = res2.statusText || errorMsg;
                        }
                        throw new Error(errorMsg);
                    }
                    const txs = await res2.json();
                    monthlyIncome.value = txs.filter(t=>t.tx_type==='income').reduce((s,t)=>s+toNumber(t.amount),0);
                    monthlyExpenses.value = txs.filter(t=>t.tx_type==='expense').reduce((s,t)=>s+Math.abs(toNumber(t.amount)),0);
                } catch (e2) {
                    console.error('Could not load transactions for totals fallback', e2);
                }
            }
        };

         // Load and format transactions from server
        const loadTransactions = async () => {
            try {
                const res = await fetch('../../Backend/getTransactions.php', { credentials: 'include' });
                if (!res.ok) {
                    let errorMsg = 'Failed to fetch transactions';
                    try {
                        const data = await res.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch (e) {
                        errorMsg = res.statusText || errorMsg;
                    }
                    throw new Error(errorMsg);
                }
                const txs = await res.json();

                // Separate transactions by type and format amounts for display
                expenseTransactions.value = txs.filter(t => t.tx_type === 'expense').map(t => ({
                    ...t,
                    amount: formatCurrency(Math.abs(toNumber(t.amount)))
                }));

                incomeTransactions.value = txs.filter(t => t.tx_type === 'income').map(t => ({
                    ...t,
                    amount: formatCurrency(toNumber(t.amount))
                }));

                transferTransactions.value = txs.filter(t => t.tx_type === 'transfer').map(t => ({
                    ...t,
                    amount: formatCurrency(toNumber(t.amount))
                }));

                // Extract available months from transactions
                const months = new Set();
                txs.forEach(t => {
                    if (t.tx_datetime) {
                        const date = new Date(t.tx_datetime);
                        const monthStr = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                        months.add(monthStr);
                    }
                });
                availableMonths.value = Array.from(months);

                // Calculate numeric monthly totals so Home matches Transaction page
                monthlyIncome.value = txs
                    .filter(t => t.tx_type === 'income')
                    .reduce((s, t) => s + toNumber(t.amount), 0);

                monthlyExpenses.value = txs
                    .filter(t => t.tx_type === 'expense')
                    .reduce((s, t) => s + Math.abs(toNumber(t.amount)), 0);

                // Recalculate percentages using stored previous values
                if (previousMonthlyIncome.value === 0) {
                    incomeChangePercent.value = monthlyIncome.value > 0 ? 100 : 0;
                    incomeChangePositive.value = monthlyIncome.value > 0 ? true : null;
                } else {
                    const ip = ((monthlyIncome.value - previousMonthlyIncome.value) / Math.abs(previousMonthlyIncome.value)) * 100;
                    incomeChangePercent.value = Number(ip.toFixed(1));
                    incomeChangePositive.value = ip >= 0;
                }

                if (previousMonthlyExpenses.value === 0) {
                    expensesChangePercent.value = monthlyExpenses.value > 0 ? 100 : 0;
                    expensesChangePositive.value = monthlyExpenses.value > 0 ? false : null; // For expenses, increase is bad, so positive change is red
                } else {
                    const ep = ((monthlyExpenses.value - previousMonthlyExpenses.value) / Math.abs(previousMonthlyExpenses.value)) * 100;
                    expensesChangePercent.value = Number(ep.toFixed(1));
                    expensesChangePositive.value = monthlyExpenses.value < previousMonthlyExpenses.value;
                }

            } catch (e) {
                console.error('Could not load transactions', e);
                // Set empty arrays on error to prevent UI issues
                expenseTransactions.value = [];
                incomeTransactions.value = [];
                transferTransactions.value = [];
            }
        };

        // storage listener: reload transactions when changed in other pages
        window.addEventListener('storage', async (e)=>{
            if (e.key === 'myMoneyAccounts' || e.key === 'myMoneyTransactions') {
                await loadAccountsFromServer();
                await computeTotals();
                await loadTransactions();
                updateChartData();
                renderChart();
            }
        });

        // Add Account modal
        const showAddAccount = ref(false);
        const newAccount = reactive({ platform: '', accountType: '', inputPlatform: '', availableAssets: 0 });
        const openAddAccount = ()=>{ newAccount.platform=''; newAccount.accountType=''; newAccount.inputPlatform=''; newAccount.availableAssets=0; showAddAccount.value=true; };
        const closeAddAccount = ()=>{ showAddAccount.value=false; };

        // Remove Account modal
        const showRemoveAccountModal = ref(false);
        const selectedForRemove = ref('');
        const accountToRemove = ref('');
        const removeAccountName = ref('');

        const selectAccountForRemove = (platformNumber) => {
            selectedForRemove.value = selectedForRemove.value === platformNumber ? '' : platformNumber;
        };

        const openRemoveAccountModal = (platformNumber, accountName) => {
            accountToRemove.value = platformNumber;
            removeAccountName.value = accountName;
            showRemoveAccountModal.value = true;
        };

        const closeRemoveAccountModal = () => {
            showRemoveAccountModal.value = false;
            accountToRemove.value = '';
            removeAccountName.value = '';
        };

        const confirmRemoveAccount = async () => {
            if (!accountToRemove.value) return;
            try {
                const res = await fetch('../../Backend/removeAccount.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ platformNumber: accountToRemove.value })
                });
                
                let errorMsg = 'Error removing account';
                if (!res.ok) {
                    try {
                        const data = await res.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch (e) {
                        errorMsg = res.statusText || errorMsg;
                    }
                    alert(errorMsg);
                    return;
                }
                
                // Verify success response
                try {
                    const data = await res.json();
                    if (data && data.error) {
                        alert(data.error);
                        return;
                    }
                } catch (e) {
                    // Response might not be JSON, continue anyway if status is OK
                }
                
                closeRemoveAccountModal();
                selectedForRemove.value = '';
                await loadAccountsFromServer();
                await computeTotals();
                await loadTransactions();
            } catch (err) {
                console.error('Remove account error:', err);
                const msg = (err && err.message) ? err.message : 'Network error. Please check your connection.';
                alert('Error removing account: ' + msg);
            }
        };
        const saveNewAccount = async ()=>{
            if (!newAccount.platform) { 
                alert('Please enter an account name.'); 
                return; 
            }
            const payload = { 
                platform: newAccount.platform, 
                platformNumber: newAccount.platformNumber || '', 
                availableAssets: Number(newAccount.availableAssets) || 0 
            };
            try {
                const res = await fetch('../../Backend/addAccount.php', { 
                    method: 'POST', 
                    credentials: 'include', 
                    headers: {'Content-Type':'application/json'}, 
                    body: JSON.stringify(payload) 
                });
                
                let data = null;
                let errorMsg = 'Could not save account';
                
                try { 
                    data = await res.json(); 
                } catch(e) { 
                    // Response is not JSON
                    if (!res.ok) {
                        errorMsg = res.statusText || `Server returned ${res.status}`;
                        alert('Could not save account: ' + errorMsg);
                        return;
                    }
                }

                if (!res.ok) {
                    errorMsg = (data && data.error) ? data.error : `Server returned ${res.status}`;
                    alert('Could not save account: ' + errorMsg);
                    console.error('Add account failed', res.status, data);
                    return;
                }

                if (data && data.platformNumber) {
                    await loadAccountsFromServer();
                    await computeTotals();
                    showAddAccount.value=false;
                } else {
                    errorMsg = (data && data.error) ? data.error : 'Unexpected server response';
                    alert('Could not save account: ' + errorMsg);
                    console.error('Unexpected add account response', data);
                }
            } catch (e) {
                console.error('Error saving account:', e);
                const msg = (e && e.message) ? e.message : 'Network error. Please check your connection.';
                alert('Error saving account: ' + msg);
            }
        };

        // Spending Report
        const spendingFilters = ref(['This Year', 'Last 6 Months', 'Last 3 Months', 'This Month', 'Last 7 Days']);
        const spendingReport = reactive({ activeFilter: 'This Year' });
        const chartData = ref({ labels: [], datasets: [] });
        let spendingChart = null; // To store the chart instance
        let chartUpdateInterval = null; // To store the interval ID for auto-updating the chart

        // Function to update chart data based on filter
        const updateChartData = () => {
            const now = new Date();
            let labels = [];
            let netData = [];
            const filter = spendingReport.activeFilter;

            // Determine the time range and grouping
            let startDate, groupBy;
            if (filter === 'This Year') {
                startDate = new Date(now.getFullYear(), 0, 1); // January 1st of current year
                groupBy = 'month';
            } else if (filter === 'Last 6 Months') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
                groupBy = 'month';
            } else if (filter === 'Last 3 Months') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                groupBy = 'month';
            } else if (filter === 'This Month') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                groupBy = 'day';
            } else if (filter === 'Last 7 Days') {
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                groupBy = 'day';
            }

            // Generate labels based on groupBy
            if (groupBy === 'month') {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                let current = new Date(startDate);
                while (current <= now) {
                    labels.push(months[current.getMonth()]);
                    current.setMonth(current.getMonth() + 1);
                }
            } else if (groupBy === 'day') {
                let current = new Date(startDate);
                while (current <= now) {
                    labels.push(current.getDate().toString());
                    current.setDate(current.getDate() + 1);
                }
            } else if (groupBy === 'hour') {
                let current = new Date(startDate);
                while (current <= now) {
                    labels.push(current.getHours().toString() + ':00');
                    current.setHours(current.getHours() + 1);
                }
            }

            // Aggregate data from transactions
            const expenseMap = new Map();
            const incomeMap = new Map();

            // Combine all transactions
            const allTransactions = [...expenseTransactions.value, ...incomeTransactions.value];

            allTransactions.forEach(tx => {
                if (!tx.tx_datetime) return;
                const date = new Date(tx.tx_datetime);
                if (date < startDate) return;

                let key;
                if (groupBy === 'month') {
                    key = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
                } else if (groupBy === 'day') {
                    key = date.getDate().toString();
                } else if (groupBy === 'hour') {
                    key = date.getHours().toString() + ':00';
                }

                const amount = toNumber(tx.amount);
                if (tx.tx_type === 'expense') {
                    expenseMap.set(key, (expenseMap.get(key) || 0) + Math.abs(amount));
                } else if (tx.tx_type === 'income') {
                    incomeMap.set(key, (incomeMap.get(key) || 0) + amount);
                }
            });

            // Fill net data array cumulatively (running total of Income - Expenses)
            let cumulative = 0;
            labels.forEach(label => {
                const income = incomeMap.get(label) || 0;
                const expense = expenseMap.get(label) || 0;
                cumulative += income - expense;
                netData.push(cumulative);
            });

            // Create border colors array for segments (leading to each point)
            const borderColors = netData.slice(1).map(value => value >= 0 ? '#22c55e' : '#ef4444');

            chartData.value = {
                labels,
                datasets: [
                    {
                        label: 'Net Trend (Income - Expenses)',
                        data: netData,
                        borderColor: borderColors,
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: (context) => {
                            const value = context.parsed.y;
                            return value >= 0 ? '#22c55e' : '#ef4444'; // Green for bullish, red for bearish
                        },
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    }
                ]
            };
        };

        // Navigation and filter helpers (were referenced from template but not defined)
        const setActiveNav = (name) => {
            activeNav.value = name;
            if (name === 'Records') {
                window.location.href = '../recordPage/recordPage.php';
            } else if (name === 'Transactions') {
                window.location.href = '../transactionPage/transactionPage.php';
            } else if (name === 'Settings') {
                window.location.href = '../settingsPage/settingsPage.php';
            }
            // For 'Dashboard', stay on the same page
        };
        const setSpendingFilter = (filter) => { spendingReport.activeFilter = filter; updateChartData(); renderChart(); };

        // Filtered transaction lists based on active filters
        const filteredExpenseTransactions = computed(() => {
            return expenseTransactions.value.filter(t => {
                if (filterAccount.value && t.account !== filterAccount.value) return false;
                if (filterMonth.value && t.tx_datetime) {
                    const date = new Date(t.tx_datetime);
                    const monthStr = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    if (monthStr !== filterMonth.value) return false;
                }
                return true;
            });
        });

        const filteredIncomeTransactions = computed(() => {
            return incomeTransactions.value.filter(t => {
                if (filterAccount.value && t.account !== filterAccount.value) return false;
                if (filterMonth.value && t.tx_datetime) {
                    const date = new Date(t.tx_datetime);
                    const monthStr = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    if (monthStr !== filterMonth.value) return false;
                }
                return true;
            });
        });

        const filteredTransferTransactions = computed(() => {
            return transferTransactions.value.filter(t => {
                if (filterMonth.value && t.tx_datetime) {
                    const date = new Date(t.tx_datetime);
                    const monthStr = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    if (monthStr !== filterMonth.value) return false;
                }
                return true;
            });
        });

        // UI helpers
        const formatCurrency = (v)=>{ return `₱ ${new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)}`; };
        const formatAmount = (v)=>{ const num=Math.abs(v); const formatted = `₱ ${num.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`; if (v<0) return `-${formatted}`; if (v>0) return `+${formatted}`; return formatted; };
        
        // Updated Render Chart Function
        const renderChart = () => {
            const ctx = document.getElementById('spendingChart');
            if (!ctx) return;

            // Destroy the old chart instance if it exists to prevent glitches
            if (spendingChart) {
                spendingChart.destroy();
            }

            // Create the new chart
            spendingChart = new Chart(ctx, {
                type: 'line',
                data: chartData.value,
                options: {
                    responsive: true,
                    maintainAspectRatio: false, // Allows chart to stretch width/height
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: {
                                usePointStyle: true,
                                boxWidth: 8
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                display: true,
                                borderDash: [2, 2],
                                drawBorder: false,
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                                drawBorder: false,
                            }
                        }
                    }
                }
            });
        };

        const goToRecordPage = ()=>{ window.location.href='../recordPage/recordPage.php'; };

        onMounted(async ()=>{
            await loadAccountsFromServer();
            await loadProfileFromServer();
            await computeTotals();
            await loadTransactions();
            updateChartData(); // Update chart data after transactions are loaded
            renderChart(); // Render chart after data is ready
            if (window.lucide) lucide.createIcons();
        });

        onUnmounted(() => {
            if (chartUpdateInterval) {
                clearInterval(chartUpdateInterval);
            }
        });

        return { activeNav,
                 navItems,
                 showAddAccount,
                 newAccount,
                 openAddAccount,
                 closeAddAccount,
                 saveNewAccount,
                 showRemoveAccountModal,
                 selectedForRemove,
                 removeAccountName,
                 selectAccountForRemove,
                 openRemoveAccountModal,
                 closeRemoveAccountModal,
                 confirmRemoveAccount,
                totalMoney,
                totalChangePercent,
                totalChangePositive,
                monthlyIncome,
                incomeChangePercent,
                incomeChangePositive,
                monthlyExpenses,
                expensesChangePercent,
                expensesChangePositive,
                 userName,
                 spendingFilters,
                 spendingReport,
                 accounts,
                 activeTab,
                 tabs,
                 expenseTransactions,
                 incomeTransactions,
                 transferTransactions,
                 filteredExpenseTransactions,
                 filteredIncomeTransactions,
                 filteredTransferTransactions,
                 filterAccount,
                 filterMonth,
                 availableMonths,
                 currentInput,
                 setActiveNav,
                 setSpendingFilter,
                 formatCurrency,
                 formatAmount,
                 goToRecordPage,
                 loadAccountsFromServer,
                 computeTotals,
                 loadTransactions,
                 previousMonthlyIncome,
                 previousMonthlyExpenses };
    }
}).mount('#app');