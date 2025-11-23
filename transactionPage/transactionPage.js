const { createApp, ref, onMounted } = Vue;

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

        // Tabs
        const activeTab = ref('expense');
        const tabs = ref([
            { key: 'expense', label: 'Expense' },
            { key: 'income', label: 'Income' },
            { key: 'transfer', label: 'Transfer' },
        ]);

        // Transaction Data (start empty)
        const expenseTransactions = ref([]);
        const incomeTransactions = ref([]);
        const transferTransactions = ref([]);

        // Account Data
        const accounts = ref([
            { name: 'BDO Savings', platformNumber: '0123...4567', balance: '100,000.00' },
            { name: 'GCash', platformNumber: '09XX...1234', balance: '75,000.50' },
            { name: 'Cash', platformNumber: 'N/A', balance: '10,000.00' },
        ]);

        // Add Record Modal State
        const showAddModal = ref(false);
        const newRecord = ref({
            type: 'expense',
            description: '',
            account: '',
            from: '',
            to: '',
            amount: '',
            date: '',
        });

        const openAddModal = () => {
            newRecord.value = {
                type: activeTab.value,
                description: '',
                account: '',
                from: '',
                to: '',
                amount: '',
                date: '',
            };
            showAddModal.value = true;
        };

        const closeAddModal = () => {
            showAddModal.value = false;
        };

        const addRecord = () => {
            const record = { ...newRecord.value };
            if (record.type === 'expense') {
                expenseTransactions.value.unshift({
                    account: record.account,
                    description: record.description,
                    amount: `-₱${parseFloat(record.amount).toLocaleString('en-US', {minimumFractionDigits:2})}`,
                    date: record.date,
                });
            } else if (record.type === 'income') {
                incomeTransactions.value.unshift({
                    account: record.account,
                    description: record.description,
                    amount: `+₱${parseFloat(record.amount).toLocaleString('en-US', {minimumFractionDigits:2})}`,
                    date: record.date,
                });
            } else if (record.type === 'transfer') {
                transferTransactions.value.unshift({
                    from: record.from,
                    to: record.to,
                    description: record.description,
                    amount: `₱${parseFloat(record.amount).toLocaleString('en-US', {minimumFractionDigits:2})}`,
                    date: record.date,
                });
            }
            closeAddModal();
        };

        const setActiveNav = (item) => {
            activeNav.value = item;
            if (item === 'Dashboard') window.location.href = '../homePage/homePage.html';
            if (item === 'Records') window.location.href = '../recordPage/recordPage.html';
            if (item === 'Settings') window.location.href = '../settingsPage/settingsPage.html';
        };
        const goToRecordPage = () => {
            window.location.href = '../recordPage/recordPage.html';
        };

        onMounted(() => {
            const stored = JSON.parse(localStorage.getItem('myMoneyTransactions') || '{}');
            expenseTransactions.value = (stored.expense || []).reverse();
            incomeTransactions.value = (stored.income || []).reverse();
            transferTransactions.value = (stored.transfer || []).reverse();
            lucide.createIcons();
        });

        return {
            activeNav,
            navItems,
            activeTab,
            tabs,
            expenseTransactions,
            incomeTransactions,
            transferTransactions,
            accounts,
            setActiveNav,
            showAddModal,
            openAddModal,
            closeAddModal,
            newRecord,
            addRecord,
            goToRecordPage,
        };
    }
}).mount('#app');