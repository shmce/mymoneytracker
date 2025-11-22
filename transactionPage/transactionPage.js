// Destructure Vue functions
const { createApp, ref, onMounted } = Vue;

createApp({
    setup() {
        // --- Reactive State ---

        // Sidebar Navigation
        const activeNav = ref('Transactions');
        const navItems = ref([
            { name: 'Dashboard', icon: 'home' },
            { name: 'Records', icon: 'file-text' },
            { name: 'Transactions', icon: 'repeat' },
            { name: 'Settings', icon: 'settings' },
        ]);

        // --- Data Properties ---
        const activeTab = ref('expense'); // Default view
        const tabs = ref([
            { key: 'expense', label: 'Expense' },
            { key: 'income', label: 'Income' },
            { key: 'transfer', label: 'Transfer' },
        ]);

        // Transaction Data (using placeholder data)
        const expenseTransactions = ref([
            { account: 'Gcash', description: 'Jollibee', amount: '-₱500.00' },
            { account: 'BDO', description: 'Starbucks Coffee', amount: '-₱350.00' },
            { account: 'Cash', description: 'Bus Fare', amount: '-₱40.00' },
            { account: 'Gcash', description: 'Netflix Subscription', amount: '-₱549.00' },
            { account: 'BDO', description: 'Dinner Out', amount: '-₱1200.00' },
        ]);
        const incomeTransactions = ref([
            { account: 'BDO', description: 'Monthly Salary', amount: '+₱50,000.00' },
            { account: 'Gcash', description: 'Freelance Payout', amount: '+₱5,000.00' },
            { account: 'Cash', description: 'Refund from Store', amount: '+₱1,500.00' },
        ]);
        const transferTransactions = ref([
            { from: 'BDO', to: 'Gcash', description: 'Load E-Wallet', amount: '₱10,000.00' },
            { from: 'BDO', to: 'Cash', description: 'ATM Withdrawal', amount: '₱5,000.00' },
            { from: 'Gcash', to: 'BDO', description: 'Savings Transfer', amount: '₱15,000.00' },
        ]);

        // Account Data (Matching keys used in the new Tailwind template)
        const accounts = ref([
            { name: 'BDO Savings', platformNumber: '0123...4567', balance: '100,000.00' },
            { name: 'GCash', platformNumber: '09XX...1234', balance: '75,000.50' },
            { name: 'Cash', platformNumber: 'N/A', balance: '10,000.00' },
        ]);

        // --- Methods ---

        const setActiveNav = (item) => {
            activeNav.value = item;
            if (item === 'Dashboard') {
                window.location.href = '../homePage/homePage.html';
            }
            if (item === 'Records') {
                window.location.href = '../recordPage/recordPage.html';
            }
            if (item === 'Settings') {
                window.location.href = '../settingsPage/settingsPage.html';
            }
        };

        // --- Lifecycle Hooks ---
        onMounted(() => {
            // Render all lucide icons
            lucide.createIcons();
        });

        // --- Return state and methods ---
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
        };
    }
}).mount('#app'); // Mount the app to the #app div
