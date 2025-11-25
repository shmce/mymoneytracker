const { createApp, ref, reactive, onMounted, computed } = Vue;

createApp({
    setup() {
        // Sidebar Navigation
        const activeNav = ref('Settings');
        const navItems = ref([
            { name: 'Dashboard', icon: 'home' },
            { name: 'Records', icon: 'file-text' },
            { name: 'Transactions', icon: 'repeat' },
            { name: 'Settings', icon: 'settings' },
        ]);

        // Profile Form
        const isEditing = ref(false);
        const form = reactive({
            fullName: '',
            nickname: '',
            gender: '',
            dob: { month: '', day: '', year: '' }
        });

        // Computed property for formatted DOB
        const formattedDob = computed(() => {
            if (!form.dob.month || !form.dob.day || !form.dob.year) return 'Not set';
            return `${form.dob.month}/${form.dob.day}/${form.dob.year}`;
        });

        const profile = reactive({
            emails: [
                { address: 'user@example.com', lastUpdated: 'Jan 15, 2025' }
            ]
        });

        // Accounts
        const accounts = ref([]);
        const showAddAccount = ref(false);
        const newAccount = reactive({ platform: '', platformNumber: '', availableAssets: 0 });

        // Navigation
        const setActiveNav = (name) => {
            activeNav.value = name;
            if (name === 'Dashboard') {
                window.location.href = '../homePage/homePage.html';
            } else if (name === 'Records') {
                window.location.href = '../recordPage/recordPage.html';
            } else if (name === 'Transactions') {
                window.location.href = '../transactionPage/transactionPage.html';
            }
        };

        // Edit toggle
        const toggleEdit = () => {
            isEditing.value = !isEditing.value;
        };

        // Add Account modal
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

        // Format currency
        const formatCurrency = (v) => {
            return `₱ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
        };

        onMounted(async () => {
            await loadAccountsFromServer();
            if (window.lucide) lucide.createIcons();
        });

        return {
            activeNav,
            navItems,
            isEditing,
            form,
            profile,
            accounts,
            showAddAccount,
            newAccount,
            setActiveNav,
            toggleEdit,
            openAddAccount,
            closeAddAccount,
            saveNewAccount,
            loadAccountsFromServer,
            formatCurrency
        };
    }
}).mount('#app');
