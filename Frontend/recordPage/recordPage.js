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

        // Accounts with reactive balances
        // Start with no accounts for new signups; load from storage if present
        const accounts = ref([]);

        // Add Account modal state and model
        const showAddAccount = ref(false);
        const newAccount = ref({
            platform: '',
            accountType: '',
            inputPlatform: '',
            availableAssets: 0
        });

        function openAddAccount() {
            newAccount.value = { platform: '', accountType: '', inputPlatform: '', availableAssets: 0 };
            showAddAccount.value = true;
        }

        function closeAddAccount() {
            showAddAccount.value = false;
        }

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
                if (!res.ok) {
                    alert('Error removing account');
                    return;
                }
                closeRemoveAccountModal();
                selectedForRemove.value = '';
                const r2 = await fetch('../../Backend/getAccounts.php', { credentials: 'include' });
                if (r2.ok) accounts.value = await r2.json();
            } catch (err) {
                console.error('Remove account error:', err);
                alert('Error removing account');
            }
        };

        async function saveNewAccount() {
            if (!newAccount.value.platform) {
                alert('Please enter an account name.');
                return;
            }
            const payload = {
                platform: newAccount.value.platform,
                platformNumber: newAccount.value.platformNumber || '',
                availableAssets: Number(newAccount.value.availableAssets) || 0
            };
            try {
                const res = await fetch('../../Backend/addAccount.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                if (!res.ok) throw new Error('Failed to add account');
                const acc = await res.json();
                if (acc && acc.platformNumber) {
                    // reload accounts from server
                    const r2 = await fetch('../../Backend/getAccounts.php', { credentials: 'include' });
                    if (r2.ok) accounts.value = await r2.json();
                    showAddAccount.value = false;
                }
            } catch (e) {
                console.error('add account error', e);
                alert('Could not add account');
            }
        }

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
        onMounted(async () => {
            const now = new Date();
            currentDateTime.value = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
            if (window.lucide) lucide.createIcons();
            // Load accounts from server
            try {
                const res = await fetch('../../Backend/getAccounts.php', { credentials: 'include' });
                if (res.ok) {
                    const json = await res.json();
                    if (Array.isArray(json)) accounts.value = json;
                }
            } catch (e) { console.warn('Could not load accounts', e); }
        });

        // Save transaction to localStorage
        async function saveTransaction(type, data) {
            // send to server and let server update accounts + store tx
            try {
                const res = await fetch('../../Backend/saveTransactions.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type, record: data })
                });
                if (!res.ok) throw new Error('Failed to save transaction');
                const json = await res.json();
                // if server returns updated accounts, refresh local copy
                if (json.accounts) accounts.value = json.accounts;
            } catch (e) {
                console.error('saveTransaction error', e);
                throw e;
            }
        }

        // Update account balance
        function updateAccountBalance(platformNumber, amount) {
            const account = accounts.value.find(a => a.platformNumber === platformNumber);
            if (account) {
                account.availableAssets += amount;
            }
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
            
            // send to server (server will update balances)
            await saveTransaction('expense', {
                platformNumber: selectedAccount.value,
                account: acc.platform,
                description: description.value,
                amount: amt,
                date: new Date().toLocaleString()
            });
            // reset
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
            
            await saveTransaction('income', {
                platformNumber: selectedAccount.value,
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
            
            await saveTransaction('transfer', {
                fromPlatformNumber: selectedAccount.value,
                toPlatformNumber: transferToAccount.value,
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