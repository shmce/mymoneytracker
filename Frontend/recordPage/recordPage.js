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
            if (item === 'Dashboard') window.location.href = '../homePage/homePage.php';
            if (item === 'Records') window.location.href = '../recordPage/recordPage.php';
            if (item === 'Transactions') window.location.href = '../transactionPage/transactionPage.php';
            if (item === 'Settings') window.location.href = '../settingsPage/settingsPage.php';
        }

        // Tabs and input state
        const activeTab = ref('Expense');
        const currentInput = ref('0');
        const selectedAccount = ref(null);
        const transferToAccount = ref(null);
        const selectedDate = ref('');
        const description = ref('');
        const isSaving = ref(false);

        // Accounts with reactive balances
        // Start with no accounts for new signups; load from storage if present
        const accounts = ref([]);

        // Add Account modal state and model
        const showAddAccount = ref(false);
        const newAccount = ref({
            platform: '',
        
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
                
                try {
                    const data = await res.json();
                    if (data && data.error) {
                        alert(data.error);
                        return;
                    }
                } catch (e) {
                    // Response might not be JSON, continue if status is OK
                }
                
                closeRemoveAccountModal();
                selectedForRemove.value = '';
                try {
                    const r2 = await fetch('../../Backend/getAccounts.php', { credentials: 'include' });
                    if (r2.ok) {
                        const json = await r2.json();
                        if (Array.isArray(json)) {
                            accounts.value = json;
                        }
                    } else {
                        let errorMsg = 'Failed to reload accounts';
                        try {
                            const data = await r2.json();
                            if (data && data.error) errorMsg = data.error;
                        } catch (e) {
                            errorMsg = r2.statusText || errorMsg;
                        }
                        console.warn('Account removed but failed to reload accounts list:', errorMsg);
                    }
                } catch (e) {
                    console.warn('Account removed but failed to reload accounts list:', e);
                }
            } catch (err) {
                console.error('Remove account error:', err);
                const msg = (err && err.message) ? err.message : 'Network error. Please check your connection.';
                alert('Error removing account: ' + msg);
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
                
                let errorMsg = 'Failed to add account';
                if (!res.ok) {
                    try {
                        const data = await res.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch (e) {
                        errorMsg = res.statusText || errorMsg;
                    }
                    throw new Error(errorMsg);
                }
                
                const acc = await res.json();
                if (acc && acc.error) {
                    alert('Could not add account: ' + acc.error);
                    return;
                }
                
                if (acc && acc.platformNumber) {
                    // reload accounts from server
                    try {
                        const r2 = await fetch('../../Backend/getAccounts.php', { credentials: 'include' });
                        if (r2.ok) {
                            const json = await r2.json();
                            if (Array.isArray(json)) {
                                accounts.value = json;
                            }
                        } else {
                            let errorMsg = 'Failed to reload accounts';
                            try {
                                const data = await r2.json();
                                if (data && data.error) errorMsg = data.error;
                            } catch (e) {
                                errorMsg = r2.statusText || errorMsg;
                            }
                            console.warn('Account added but failed to reload accounts list:', errorMsg);
                        }
                    } catch (e) {
                        console.warn('Account added but failed to reload accounts list:', e);
                    }
                    showAddAccount.value = false;
                } else {
                    alert('Unexpected server response when adding account');
                }
            } catch (e) {
                console.error('add account error', e);
                const msg = (e && e.message) ? e.message : 'Network error. Please check your connection.';
                alert('Could not add account: ' + msg);
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

        // Set current date on mount
        onMounted(async () => {
            const now = new Date();
            selectedDate.value = now.toISOString().split('T')[0]; // YYYY-MM-DD format
            if (window.lucide) lucide.createIcons();
            // Load accounts from server
            try {
                const res = await fetch('../../Backend/getAccounts.php', { credentials: 'include' });
                if (res.ok) {
                    const json = await res.json();
                    if (Array.isArray(json)) {
                        accounts.value = json;
                    } else if (json && json.error) {
                        console.error('Error loading accounts:', json.error);
                    }
                } else {
                    let errorMsg = 'Failed to load accounts';
                    try {
                        const data = await res.json();
                        if (data && data.error) errorMsg = data.error;
                    } catch (e) {
                        errorMsg = res.statusText || errorMsg;
                    }
                    console.error('Could not load accounts:', errorMsg);
                }
            } catch (e) { 
                console.error('Could not load accounts', e);
                accounts.value = [];
            }
            // Initialize Flatpickr for date input
            if (window.flatpickr) {
                flatpickr("#dateInput", {
                    dateFormat: "Y-m-d",
                    defaultDate: selectedDate.value,
                    maxDate: new Date(),
                    onChange: function(selectedDates, dateStr, instance) {
                        selectedDate.value = dateStr;
                    }
                });
            }
        });

        // Set date to today
        function setToday() {
            const now = new Date();
            selectedDate.value = now.toISOString().split('T')[0];
        }

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
                let json;
                if (!res.ok) {
                    // try to extract server error message
                    const txt = await res.text().catch(()=>null);
                    let msg = 'Failed to save transaction';
                    try { const parsed = JSON.parse(txt); if (parsed && parsed.error) msg = parsed.error; } catch(e) { if (txt) msg = txt; }
                    // specific UI message for insufficient funds
                    if (msg && msg.toLowerCase().includes('insufficient')) {
                        alert('Transaction failed due to insufficient balance.');
                        return false;
                    }
                    alert(msg || 'Failed to save transaction');
                    return false;
                }
                json = await res.json();
                // if server returns updated accounts, refresh local copy
                if (json.accounts) accounts.value = json.accounts;
                return true;
            } catch (e) {
                console.error('saveTransaction error', e);
                const msg = (e && e.message) ? e.message : 'Failed to save transaction';
                if (msg.toLowerCase().includes('insufficient')) {
                    alert('Transaction failed due to insufficient balance.');
                    return false;
                }
                alert(msg || 'Failed to save transaction');
                return false;
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
            if (!description.value.trim()) {
                alert('Description is required.');
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
            const ok = await saveTransaction('expense', {
                platformNumber: selectedAccount.value,
                account: acc.platform,
                description: description.value,
                amount: amt,
                date: selectedDate.value
            });
            if (!ok) return;
            // reset on success
            description.value = '';
            currentInput.value = '0';
        }

        // Income record
        async function executeIncome() {
            if (!selectedAccount.value) {
                alert('Please select an account.');
                return;
            }
            if (!description.value.trim()) {
                alert('Description is required.');
                return;
            }
            if (!currentInput.value || isNaN(parseFloat(currentInput.value)) || parseFloat(currentInput.value) === 0) {
                alert('Please enter a valid amount.');
                return;
            }
            const acc = accounts.value.find(a => a.platformNumber === selectedAccount.value);
            const amt = parseFloat(currentInput.value);
            if (!acc || isNaN(amt)) return;

            const ok = await saveTransaction('income', {
                platformNumber: selectedAccount.value,
                account: acc.platform,
                description: description.value,
                amount: amt,
                date: selectedDate.value
            });
            if (!ok) return;
            description.value = '';
            currentInput.value = '0';
        }

        // Transfer record
        async function executeTransfer() {
            try {
                console.log('executeTransfer triggered', { selectedAccount: selectedAccount.value, transferToAccount: transferToAccount.value, currentInput: currentInput.value });
                // clear nothing — we no longer use a separate description error field
            if (!selectedAccount.value) {
                alert('Please select a source account.');
                return;
            }
            if (!transferToAccount.value) {
                alert('Please select a receiver account.');
                return;
            }
            if (!description.value.trim()) {
                alert('Description is required.');
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

            // Prevent transfer if insufficient balance
            if (Number(src.availableAssets) < amt) {
                alert('Insufficient balance in source account.');
                return;
            }

            isSaving.value = true;
            try {
                const ok = await saveTransaction('transfer', {
                    fromPlatformNumber: selectedAccount.value,
                    toPlatformNumber: transferToAccount.value,
                    from: src.platform,
                    to: dst.platform,
                    description: description.value,
                    amount: amt,
                    date: selectedDate.value
                });
                if (!ok) { isSaving.value = false; return; }
            } catch (err) {
                console.error('Transfer failed:', err);
                alert('Transfer failed. ' + (err && err.message ? err.message : 'Please try again.'));
                isSaving.value = false;
                return;
            }
            isSaving.value = false;
            description.value = '';
            currentInput.value = '0';
            return;
            } catch (e) {
                console.error('Unexpected error in executeTransfer:', e);
                alert('An unexpected error occurred: ' + (e && e.message ? e.message : e));
            }
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
            selectedDate,
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
            setToday,
            formatCurrency,
            formattedAmount,
            isSaving,
        };
    }
}).mount('#app');