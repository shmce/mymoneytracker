// Destructure Vue functions
const { createApp, ref, onMounted, reactive } = Vue;

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
        const activeTab = ref('Expense');
        const currentInput = ref('0');
        const selectedAccount = ref(null);
        const transferToAccount = ref(null);
        const currentDateTime = ref('');
        const keypadKeys = ref(['1','2','3','4','5','6','7','8','9','.','0','<']);

        // Accounts and Totals
        const accounts = ref([]);
        const totalMoney = ref(0);
        const monthlyIncome = ref(0);
        const monthlyExpenses = ref(0);
        // Transactions list (was missing and used in template)
        const transactions = ref([]);

        const toNumber = (val) => {
            if (typeof val === 'number') return val;
            if (!val) return 0;
            const s = String(val).replace(/[^0-9.-]/g, '');
            return Number(s) || 0;
        };

        const loadAccountsFromServer = async () => {
            try {
                const res = await fetch('../getAccounts.php', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to load accounts');
                accounts.value = await res.json();
            } catch (e) {
                console.warn('Could not load accounts from server', e);
            }
        };

        const computeTotals = async () => {
            totalMoney.value = accounts.value.reduce((s,a) => s + toNumber(a.availableAssets), 0);
            try {
                const res = await fetch('../getTransactions.php', { credentials: 'include' });
                if (!res.ok) throw new Error('Failed to fetch transactions');
                const txs = await res.json();
                monthlyIncome.value = txs.filter(t=>t.tx_type==='income').reduce((s,t)=>s+toNumber(t.amount),0);
                monthlyExpenses.value = txs.filter(t=>t.tx_type==='expense').reduce((s,t)=>s+Math.abs(toNumber(t.amount)),0);
            } catch (e) {
                console.warn('Could not load transactions for totals', e);
            }
        };

        // legacy storage listener (optional)
        window.addEventListener('storage', (e)=>{
            if (e.key === 'myMoneyAccounts' || e.key === 'myMoneyTransactions') {
                loadAccountsFromServer();
                computeTotals();
            }
        });

        // Add Account modal
        const showAddAccount = ref(false);
        const newAccount = reactive({ platform: '', accountType: '', inputPlatform: '', availableAssets: 0 });
        const openAddAccount = ()=>{ newAccount.platform=''; newAccount.accountType=''; newAccount.inputPlatform=''; newAccount.availableAssets=0; showAddAccount.value=true; };
        const closeAddAccount = ()=>{ showAddAccount.value=false; };
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
                    await computeTotals();
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

        // Spending Report placeholders
        const spendingFilters = ref(['12 Months','3 Months','30 Days','7 Days','24 Hours']);
        const spendingReport = reactive({ activeFilter: '12 Months' });
        const chartData = ref({ labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Des'], datasets: [] });

        // Navigation and filter helpers (were referenced from template but not defined)
        const setActiveNav = (name) => {
            activeNav.value = name;
            if (name === 'Records') {
                window.location.href = '../recordPage/recordPage.html';
            } else if (name === 'Transactions') {
                window.location.href = '../transactionPage/transactionPage.html';
            } else if (name === 'Settings') {
                window.location.href = '../settingsPage/settingsPage.html';
            }
            // For 'Dashboard', stay on the same page
        };
        const setSpendingFilter = (filter) => { spendingReport.activeFilter = filter; renderChart(); };

        // UI helpers
        const formatCurrency = (v)=>{ return `₱ ${new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}).format(v)}`; };
        const formatAmount = (v)=>{ const num=Math.abs(v); const formatted = `₱ ${num.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}`; if (v<0) return `-${formatted}`; if (v>0) return `+${formatted}`; return formatted; };
        const renderChart = ()=>{ try{ const ctx=document.getElementById('spendingChart'); if (!ctx) return; const c=ctx.getContext('2d'); new Chart(c,{type:'line',data:chartData.value, options:{responsive:true}}); }catch(e){/*ignore*/} };
        const goToRecordPage = ()=>{ window.location.href='../recordPage/recordPage.html'; };

        onMounted(async ()=>{
            await loadAccountsFromServer();
            renderChart();
            if (window.lucide) lucide.createIcons();
            await computeTotals();
        });

        return { activeNav, 
                 navItems, 
                 showAddAccount, 
                 newAccount, 
                 openAddAccount, 
                 closeAddAccount, 
                 saveNewAccount, 
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
                 goToRecordPage, 
                 loadAccountsFromServer, 
                 computeTotals };
    }
}).mount('#app');
