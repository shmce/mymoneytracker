// Destructure Vue functions
const { createApp, ref, onMounted, reactive } = Vue;

createApp({
    setup() {
        // --- Reactive State ---

        

        // Sidebar Navigation
        const activeNav = ref('Dashboard');
        const navItems = ref([
            { name: 'Dashboard', icon: 'home' },
            { name: 'Records', icon: 'file-text' },
            { name: 'Transactions', icon: 'repeat' },
            { name: 'Settings', icon: 'settings' },
        ]);

        // --- Data Properties ---
        const activeTab = ref('Expense');
        const currentInput = ref('0');
        
        
        
        // "From" account
        const selectedAccount = ref(null);
        // "To" account (New)
        const transferToAccount = ref(null);

        const currentDateTime = ref('');
        const keypadKeys = ref(['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '<']);
        
        const accounts = ref([
            {
                platform: 'Cash',
                availableAssets: 5000.00 
            },
            {
                platform: 'Bank - BDO',
                availableAssets: 100000.00
            },
            {
                platform: 'GCash',
                availableAssets: 2500.50
            }
        ]);

        // Top Cards
        const totalMoney = ref(20000);
        const monthlyIncome = ref(50000);
        const monthlyExpenses = ref(10000);

        const loadAccountsFromStorage = () => {
            const stored = localStorage.getItem('myMoneyAccounts');
            if (stored) {
                accounts.value = JSON.parse(stored);
            }
        };

        // Spending Report
        const spendingFilters = ref(['12 Months', '3 Months', '30 Days', '7 Days', '24 Hours']);
        const spendingReport = reactive({
            activeFilter: '12 Months',
        });
        // Chart.js data
        const chartData = ref({
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Des'],
            datasets: [
                {
                    label: 'Income',
                    data: [25, 30, 45, 50, 42, 55, 60, 58, 70, 65, 75, 80],
                    borderColor: '#3b82f6', // blue-500
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,
                },
                {
                    label: 'Expenses',
                    data: [20, 25, 30, 35, 28, 32, 38, 40, 45, 42, 50, 55],
                    borderColor: '#f59e0b', // amber-500
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: false,
                }
            ]
        });

        // Transaction History
        const transactions = ref([
            {
                name: 'Spotify',
                id: '#7890328',
                amount: -279.00,
                date: '16 Jan 2:30pm',
                category: 'Entertainment',
                icon: 'spotify',
                iconBg: 'bg-green-100',
                iconColor: 'text-green-600',
            },
            {
                name: 'Starbucks',
                id: '#3848509',
                amount: -240.00,
                date: '15 Jan 3:30pm',
                category: 'Food & Drinks',
                icon: 'coffee',
                iconBg: 'bg-yellow-100',
                iconColor: 'text-yellow-600',
            },
            {
                name: 'Coins.ph',
                id: '#2880298',
                amount: 500.00,
                date: '14 Jan 2:30pm',
                category: 'Finance',
                icon: 'database',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
            },
        ]);


        // --- Methods ---

        const setActiveNav = (item) => {
            activeNav.value = item;
            if (item === 'Records') {
                window.location.href = '../recordPage/recordPage.html';
            }
            if (item === 'Transactions') {
                window.location.href = '../transactionPage/transactionPage.html';
            }
        };

        const setSpendingFilter = (filter) => {
            spendingReport.activeFilter = filter;
            // In a real app, you would fetch new chart data here
        };

        // Helper to format currency (₱ 20,000.00)
        const formatCurrency = (value) => {
            const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
            return `₱ ${formatted}`;
        };

        // Helper to format transaction amounts (- ₱ 279.00)
        const formatAmount = (value) => {
            const num = Math.abs(value);
            const formatted = `₱ ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (value < 0) return `-${formatted}`;
            if (value > 0) return `+${formatted}`;
            return formatted;
        };

        // Function to render the chart
        const renderChart = () => {
            const ctx = document.getElementById('spendingChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: chartData.value,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                drawBorder: false,
                            },
                            ticks: {
                                color: '#6b7280',
                            }
                        },
                        x: {
                            grid: {
                                display: false,
                            },
                            ticks: {
                                color: '#6b7280',
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            align: 'end',
                            labels: {
                                usePointStyle: true,
                                boxWidth: 8,
                            }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            backgroundColor: '#fff',
                            titleColor: '#000',
                            bodyColor: '#000',
                            borderColor: '#e2e8f0',
                            borderWidth: 1,
                        }
                    },
                    hover: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            });
        };

        // --- Lifecycle Hooks ---
        onMounted(() => {
            // Load accounts from localStorage
            loadAccountsFromStorage();

            // Render the chart after the component is mounted
            renderChart();

            // Render all lucide icons
            lucide.createIcons();
        });

        // --- Return state and methods ---
        return {
            activeNav,
            navItems,
            totalMoney,
            monthlyIncome,
            monthlyExpenses,
            spendingFilters,
            spendingReport,
            transactions,
            accounts,
            activeTab,
            currentInput,
            setActiveNav,
            setSpendingFilter,
            formatCurrency,
            formatAmount,
        };
    }
}).mount('#app'); // Mount the app to the #app div
