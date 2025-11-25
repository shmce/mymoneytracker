const { createApp, ref, reactive, onMounted, computed } = Vue;

createApp({
    setup() {
        // Sidebar Navigation
        const activeNav = ref('Transactions');
        const navItems = ref([
            { name: 'Dashboard', icon: 'home' },
            { name: 'Records', icon: 'file-text' },
            { name: 'Transactions', icon: 'repeat' },
            { name: 'Settings', icon: 'settings' },
        ]);

        // Transaction tabs
        const activeTab = ref('expense');
        const tabs = ref([
            { key: 'expense', label: 'Expense' },
            { key: 'income', label: 'Income' },
            { key: 'transfer', label: 'Transfer' },
        ]);

        // Totals
        const totalIncome = ref(0);
        const totalExpense = ref(0);
        const totalTransfer = ref(0);

        // Accounts
        const accounts = ref([]);

        // Add Account modal
        const showAddAccount = ref(false);
        const newAccount = reactive({ platform: '', accountType: '', inputPlatform: '', availableAssets: 0 });

        // Remove Account modal
        const showRemoveAccountModal = ref(false);
        const selectedAccount = ref('');
        const accountToRemove = ref('');
        const removeAccountName = ref('');

        const selectAccount = (platformNumber) => {
            selectedAccount.value = selectedAccount.value === platformNumber ? '' : platformNumber;
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
                if (!res.ok) {
                    alert('Error removing account');
                    return;
                }
                closeRemoveAccountModal();
                selectedAccount.value = '';
                await loadAccountsFromServer();
                await loadTransactions();
            } catch (err) {
                console.error('Remove account error:', err);
                alert('Error removing account');
            }
        };

        // Add Record modal removed — transactions are added on the record page

        // Transaction lists
        const expenseTransactions = ref([]);
        const incomeTransactions = ref([]);
        const transferTransactions = ref([]);

        // Filter state
        const filterAccount = ref('');
        const filterMonth = ref('');
        const availableMonths = ref([]);

        // Helper function
        const toNumber = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            const s = String(val).replace(/[^0-9.-]/g, '');
            return Number(s) || 0;
        };

        // Format currency
        const formatCurrency = (v) => {
            return `₱ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
        };

        // Load accounts from server
        const loadAccountsFromServer = async () => {
            try {
                const res = await fetch('../../Backend/getAccounts.php', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to load accounts');
                accounts.value = await res.json();
            } catch (e) {
                console.warn('Could not load accounts from server', e);
            }
        };

        // Load transactions and compute totals
        const loadTransactions = async () => {
            try {
                const res = await fetch('../../Backend/getTransactions.php', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch transactions');
                const txs = await res.json();

                // Separate transactions by type
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

                // Calculate totals
                totalIncome.value = txs.filter(t => t.tx_type === 'income').reduce((s, t) => s + toNumber(t.amount), 0);
                totalExpense.value = txs.filter(t => t.tx_type === 'expense').reduce((s, t) => s + Math.abs(toNumber(t.amount)), 0);
                totalTransfer.value = txs.filter(t => t.tx_type === 'transfer').reduce((s, t) => s + toNumber(t.amount), 0);
            } catch (e) {
                console.warn('Could not load transactions', e);
            }
        };

        // Navigation
        const setActiveNav = (name) => {
            activeNav.value = name;
            if (name === 'Dashboard') {
                window.location.href = '../homePage/homePage.html';
            } else if (name === 'Records') {
                window.location.href = '../recordPage/recordPage.html';
            } else if (name === 'Settings') {
                window.location.href = '../settingsPage/settingsPage.html';
            }
        };

        // Add Account modal
        const openAddAccount = ()=>{ newAccount.platform=''; newAccount.accountType=''; newAccount.inputPlatform=''; newAccount.availableAssets=0; showAddAccount.value=true; };

        const closeAddAccount = () => {
            showAddAccount.value = false;
        };

        const saveNewAccount = async ()=>{
            if (!newAccount.platform) { alert('Please enter an account name.'); return; }
            const payload = { platform: newAccount.platform, platformNumber: newAccount.platformNumber || '', availableAssets: Number(newAccount.availableAssets) || 0 };
            try {
                const res = await fetch('../../Backend/addAccount.php', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
                let data;
                try { data = await res.json(); } catch(e) { data = null; }

                if (!res.ok) {
                    const msg = (data && data.error) ? data.error : `Server returned ${res.status}`;
                    alert('Could not save account: ' + msg);
                    console.warn('Add account failed', res.status, data);
                    return;
                }

                if (data && data.platformNumber) {
                    await loadAccountsFromServer();
                    await loadTransactions();
                    showAddAccount.value=false;
                } else {
                    const msg = (data && data.error) ? data.error : 'Unexpected server response';
                    alert('Could not save account: ' + msg);
                    console.warn('Unexpected add account response', data);
                }
            } catch (e) {
                console.error(e);
                alert('Error saving account. Check your connection or server.');
            }
        };

        // Filtered transaction lists based on account and month
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

        // Navigation to record page
        const goToRecordPage = () => {
            window.location.href = '../recordPage/recordPage.html';
        };

        onMounted(async () => {
            await loadAccountsFromServer();
            await loadTransactions();
            if (window.lucide) lucide.createIcons();
        });

        return {
            activeNav,
            navItems,
            activeTab,
            tabs,
            totalIncome,
            totalExpense,
            totalTransfer,
            accounts,
            showAddAccount,
            newAccount,
            showRemoveAccountModal,
            selectedAccount,
            removeAccountName,
            expenseTransactions,
            incomeTransactions,
            transferTransactions,
            filteredExpenseTransactions,
            filteredIncomeTransactions,
            filteredTransferTransactions,
            filterAccount,
            filterMonth,
            availableMonths,
            toNumber,
            setActiveNav,
            formatCurrency,
            openAddAccount,
            closeAddAccount,
            saveNewAccount,
            selectAccount,
            openRemoveAccountModal,
            closeRemoveAccountModal,
            confirmRemoveAccount,
            loadAccountsFromServer,
            loadTransactions,
            goToRecordPage
        };
    }
}).mount('#app');

