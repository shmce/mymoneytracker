const { createApp, ref, reactive, onMounted } = Vue;

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

        // Add Record Modal
        const showAddModal = ref(false);
        const newRecord = reactive({
            account: '',
            from: '',
            to: '',
            amount: '',
            description: '',
            date: new Date().toISOString().split('T')[0]
        });

        // Transaction lists
        const expenseTransactions = ref([]);
        const incomeTransactions = ref([]);
        const transferTransactions = ref([]);

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
                const res = await fetch('../getAccounts.php', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to load accounts');
                accounts.value = await res.json();
            } catch (e) {
                console.warn('Could not load accounts from server', e);
            }
        };

        // Load transactions and compute totals
        const loadTransactions = async () => {
            try {
                const res = await fetch('../getTransactions.php', { credentials: 'include' });
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
                const res = await fetch('../addAccount.php', { method: 'POST', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
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

        // Add Record Modal handlers
        const openAddModal = () => {
            showAddModal.value = true;
        };

        const closeAddModal = () => {
            showAddModal.value = false;
            newRecord.account = '';
            newRecord.from = '';
            newRecord.to = '';
            newRecord.amount = '';
            newRecord.description = '';
            newRecord.date = new Date().toISOString().split('T')[0];
        };

        const addRecord = async () => {
            // Validate inputs
            const payload = {
                tx_type: activeTab.value,
                amount: Number(newRecord.amount) || 0,
                description: newRecord.description,
                date: newRecord.date
            };

            if (activeTab.value === 'transfer') {
                if (!newRecord.from || !newRecord.to) {
                    alert('Please select both From and To accounts');
                    return;
                }
                payload.fromAccount = newRecord.from;
                payload.toAccount = newRecord.to;
            } else {
                if (!newRecord.account) {
                    alert('Please select an account');
                    return;
                }
                payload.account = newRecord.account;
            }

            try {
                const res = await fetch('../addTransaction.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!res.ok) {
                    alert('Failed to save transaction');
                    return;
                }

                await loadTransactions();
                closeAddModal();
            } catch (e) {
                console.error(e);
                alert('Error saving transaction');
            }
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
            showAddModal,
            newRecord,
            expenseTransactions,
            incomeTransactions,
            transferTransactions,
            toNumber,  // Add this line
            setActiveNav,
            formatCurrency,
            openAddAccount,
            closeAddAccount,
            saveNewAccount,
            openAddModal,
            closeAddModal,
            addRecord,
            loadAccountsFromServer,
            loadTransactions
        };
    }
}).mount('#app');

