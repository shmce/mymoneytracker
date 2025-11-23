const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {
        // Sidebar navigation
        const activeNav = ref('Records');
        const navItems = ref([
            { name: 'Dashboard', icon: 'home' },
            { name: 'Records', icon: 'file-text' },
            { name: 'Transactions', icon: 'repeat' },
            { name: 'Settings', icon: 'settings' },
        ]);

        // Navigation click handler
        function setActiveNav(item) {
            activeNav.value = item;
            if (item === 'Dashboard') window.location.href = '../homePage/homePage.html';
            if (item === 'Records') window.location.href = '../recordPage/recordPage.html';
            if (item === 'Transactions') window.location.href = '../transactionPage/transactionPage.html';
            if (item === 'Settings') window.location.href = '../settingsPage/settingsPage.html';
        }

        // Tabs and input state
        const activeTab = ref('Expense');
        const currentInput = ref('0');
        const selectedAccount = ref(null);
        const transferToAccount = ref(null);
        const currentDateTime = ref('');
        const description = ref('');

        // Example accounts (replace with your actual accounts logic)
        const accounts = ref([
            { platform: 'Cash', platformNumber: 'CASH', availableAssets: 10000 },
            { platform: 'Bank - BDO', platformNumber: 'BDO', availableAssets: 50000 },
            { platform: 'GCash', platformNumber: 'GCASH', availableAssets: 20000 }
        ]);

        // Keypad keys (flat array for v-for)
        const keypadKeys = [
            '1', '2', '3',
            '4', '5', '6',
            '7', '8', '9',
            '.', '0', '⌫'
        ];

        // Keypad input handler
        function pressKey(key) {
            if (key === '⌫') {
                if (currentInput.value.length > 1) {
                    currentInput.value = currentInput.value.slice(0, -1);
                } else {
                    currentInput.value = '0';
                }
            } else if (key === '.') {
                if (!currentInput.value.includes('.')) {
                    currentInput.value += '.';
                }
            } else {
                if (currentInput.value === '0') {
                    currentInput.value = key;
                } else {
                    currentInput.value += key;
                }
            }
        }

        // Set current date/time on mount
        onMounted(() => {
            const now = new Date();
            currentDateTime.value = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
            if (window.lucide) lucide.createIcons();
        });

        // Save transaction to localStorage
        function saveTransaction(type, data) {
            let transactions = JSON.parse(localStorage.getItem('myMoneyTransactions') || '{}');
            if (!transactions.expense) transactions.expense = [];
            if (!transactions.income) transactions.income = [];
            if (!transactions.transfer) transactions.transfer = [];
            transactions[type].push(data);
            localStorage.setItem('myMoneyTransactions', JSON.stringify(transactions));
        }

        // Expense record
        async function executeExpense() {
            if (!selectedAccount.value) {
                alert('Please select an account.');
                return;
            }
            if (!currentInput.value || isNaN(parseFloat(currentInput.value)) || parseFloat(currentInput.value) === 0) {
                alert('Please enter a valid amount.');
                return;
            }
            const acc = accounts.value.find(a => a.platformNumber === selectedAccount.value);
            const amt = parseFloat(currentInput.value);
            if (!acc || isNaN(amt)) return;
            saveTransaction('expense', {
                account: acc.platform,
                description: description.value,
                amount: -amt,
                date: new Date().toLocaleString()
            });
            description.value = '';
            currentInput.value = '0';
        }

        // Income record
        async function executeIncome() {
            if (!selectedAccount.value) {
                alert('Please select an account.');
                return;
            }
            if (!currentInput.value || isNaN(parseFloat(currentInput.value)) || parseFloat(currentInput.value) === 0) {
                alert('Please enter a valid amount.');
                return;
            }
            const acc = accounts.value.find(a => a.platformNumber === selectedAccount.value);
            const amt = parseFloat(currentInput.value);
            if (!acc || isNaN(amt)) return;
            saveTransaction('income', {
                account: acc.platform,
                description: description.value,
                amount: amt,
                date: new Date().toLocaleString()
            });
            description.value = '';
            currentInput.value = '0';
        }

        // Transfer record
        async function executeTransfer() {
            if (!selectedAccount.value) {
                alert('Please select a source account.');
                return;
            }
            if (!transferToAccount.value) {
                alert('Please select a receiver account.');
                return;
            }
            if (!currentInput.value || isNaN(parseFloat(currentInput.value)) || parseFloat(currentInput.value) === 0) {
                alert('Please enter a valid amount.');
                return;
            }
            const src = accounts.value.find(a => a.platformNumber === selectedAccount.value);
            const dst = accounts.value.find(a => a.platformNumber === transferToAccount.value);
            const amt = parseFloat(currentInput.value);
            if (!src || !dst || isNaN(amt)) return;
            saveTransaction('transfer', {
                from: src.platform,
                to: dst.platform,
                description: description.value,
                amount: amt,
                date: new Date().toLocaleString()
            });
            description.value = '';
            currentInput.value = '0';
        }

        // Set tab
        function setTab(tab) {
            activeTab.value = tab;
            currentInput.value = '0';
            selectedAccount.value = null;
            transferToAccount.value = null;
            description.value = '';
        }

        // Format currency
        function formatCurrency(val) {
            return Number(val).toLocaleString('en-PH', { minimumFractionDigits: 2 });
        }

        // For display
        const formattedAmount = computed(() => {
            return Number(currentInput.value).toLocaleString('en-PH', { minimumFractionDigits: 2 });
        });

        return {
            activeNav,
            navItems,
            setActiveNav,
            activeTab,
            currentInput,
            selectedAccount,
            transferToAccount,
            currentDateTime,
            description,
            accounts,
            keypadKeys,
            pressKey,
            executeExpense,
            executeIncome,
            executeTransfer,
            setTab,
            formatCurrency,
            formattedAmount,
        };
    }
}).mount('#app');