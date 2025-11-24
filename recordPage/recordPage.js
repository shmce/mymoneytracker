// Destructure Vue functions from the global object
const { createApp, ref, computed, onMounted } = Vue;

createApp({
    setup() {

        /*  sidebar  */
        const activeNav = ref('Records');
        const navItems = ref([
            { name: 'Dashboard'},
            { name: 'Records'},
            { name: 'Transactions'},
            { name: 'Settings'},
        ]);

        /*  screen state  */
        const activeTab = ref('Expense');
        const currentInput = ref('0');
        const selectedAccount = ref(null);
        const transferToAccount = ref(null);
        const currentDateTime = ref('');
        const keypadKeys = ref(['1','2','3','4','5','6','7','8','9','.','0','<']);

        /*  accounts now come from MySQL  */
        const accounts = ref([]);

        /*  helpers  */
        const formattedAmount = computed(() => {
            let [int, dec] = currentInput.value.split('.');
            int = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            if (!dec) return `${int}.00`;
            return dec.length === 1 ? `${int}.${dec}0` : `${int}.${dec.slice(0,2)}`;
        });

        /*  NEW: fetch accounts for logged-in user  */
        async function loadAccounts() {
            const res = await fetch('../getAccounts.php');
            accounts.value = await res.json();
        }
        /*  NEW: save updated balances to server  */
        async function saveAccounts() {
            await fetch('../saveAccounts.php', {
                method : 'POST',
                headers: {'Content-Type':'application/json'},
                body   : JSON.stringify(accounts.value)
            });
        }

        /*  NEW: send log line to DB  */
        function logToDB(msg) {
            fetch('../logReceiver.php', {
                method : 'POST',
                headers: {'Content-Type':'application/x-www-form-urlencoded'},
                body   : 'log=' + encodeURIComponent(msg)
            });
        }

        /*  tab switch  */
        function setTab(tab) {
            activeTab.value = tab;
            currentInput.value = '0';
        }

        /*  expense  */
        async function executeExpense() {
            const amt = parseFloat(currentInput.value);
            if (amt <= 0)  { alert('Amount > 0 please'); return; }
            if (!selectedAccount.value) { alert('Pick an account'); return; }
            const acc = accounts.value.find(a => a.platformNumber === selectedAccount.value);
            if (!acc) { alert('Account not found'); return; }
            if (acc.availableAssets < amt) { alert('Insufficient funds'); return; }

            acc.availableAssets -= amt;
            await saveAccounts();                 // <-- MySQL
            logToDB(`Expense: ₱${amt} from ${acc.platform}`);
            alert(`Expense recorded: ₱${amt}`);
            currentInput.value = '0';
        }

        /*  income  */
        async function executeIncome() {
            const amt = parseFloat(currentInput.value);
            if (amt <= 0)  { alert('Amount > 0 please'); return; }
            if (!selectedAccount.value) { alert('Pick an account'); return; }
            const acc = accounts.value.find(a => a.platformNumber === selectedAccount.value);
            if (!acc) { alert('Account not found'); return; }

            acc.availableAssets += amt;
            await saveAccounts();
            logToDB(`Income: ₱${amt} to ${acc.platform}`);
            alert(`Income recorded: ₱${amt}`);
            currentInput.value = '0';
        }

        /*  transfer  */
        async function executeTransfer() {
            const amt = parseFloat(currentInput.value);
            if (amt <= 0)  { alert('Amount > 0 please'); return; }
            if (!selectedAccount.value || !transferToAccount.value) {
                alert('Choose FROM and TO accounts'); return;
            }
            if (selectedAccount.value === transferToAccount.value) {
                alert('Cannot transfer to same account'); return;
            }
            const src = accounts.value.find(a => a.platformNumber === selectedAccount.value);
            const dst = accounts.value.find(a => a.platformNumber === transferToAccount.value);
            if (!src || !dst) { alert('Account not found'); return; }
            if (src.availableAssets < amt) { alert('Insufficient funds'); return; }

            src.availableAssets -= amt;
            dst.availableAssets += amt;
            await saveAccounts();
            logToDB(`Transfer: ₱${amt} from ${src.platform} to ${dst.platform}`);
            alert(`Transfer complete: ₱${amt}`);
            currentInput.value = '0';
            transferToAccount.value = null;
        }

        /*  keypad  */
        function pressKey(key) {
            if (key === '<') {
                currentInput.value = currentInput.value.slice(0, -1) || '0';
            } else if (key === '.') {
                if (!currentInput.value.includes('.')) currentInput.value += '.';
            } else {
                if (currentInput.value === '0') currentInput.value = key;
                else {
                    const [a, b] = currentInput.value.split('.');
                    if (!b || b.length < 2) currentInput.value += key;
                }
            }
        }

        /*  nav  */
        function setActiveNav(item) {
            activeNav.value = item;
            if (item === 'Dashboard') window.location.href = '../homePage/homePage.html';
            if (item === 'Transactions') window.location.href = '../transactionPage/transactionPage.html';
            if (item === 'Settings') window.location.href = '../settingsPage/settingsPage.html';
        }
        

        /*  formatters  */
        function formatCurrency(v) {
            return '₱ ' + v.toLocaleString('en-US', {minimumFractionDigits: 2});
        }

        /*  life-cycle  */
        onMounted(async () => {
            await loadAccounts();          // ← from MySQL
            currentDateTime.value = 'Today, 10:02AM';
            lucide.createIcons();
        });

        /*  expose to template  */
        return {
            activeNav, navItems, activeTab, currentInput, selectedAccount,
            transferToAccount, currentDateTime, keypadKeys, accounts,
            formattedAmount, setTab, pressKey, executeExpense,
            executeIncome, executeTransfer, setActiveNav
        };
    }
}).mount('#app');