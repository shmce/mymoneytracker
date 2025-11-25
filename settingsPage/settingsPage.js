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
            email: '',
            dob: { month: '', day: '', year: '' }
        });

        // Computed property for formatted DOB
        const formattedDob = computed(() => {
            if (!form.dob.month || !form.dob.day || !form.dob.year) return 'Not set';
            return `${form.dob.month}/${form.dob.day}/${form.dob.year}`;
        });

        const profile = reactive({
            emails: [
                { address: 'user@example.com' }
            ]
        });

        // Accounts
        const accounts = ref([]);
        const showAddAccount = ref(false);
        const newAccount = reactive({ platform: '', platformNumber: '', availableAssets: 0 });

        // DOB option arrays (strings with zero-padding so they match YYYY-MM-DD parts)
        const pad2 = (v) => (String(v).padStart(2, '0'));
        const months = ref([
            { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
            { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
            { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
            { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' }
        ]);
        const days = ref(Array.from({ length: 31 }, (_, i) => pad2(i + 1)));
        const currentYear = new Date().getFullYear();
        const years = ref(Array.from({ length: currentYear - 1899 }, (_, i) => String(currentYear - i)));

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

        // Save profile to server
        const saveProfile = async () => {
            // Build dob in YYYY-MM-DD or empty
            let dob = '';
            if (form.dob.year && form.dob.month && form.dob.day) {
                dob = `${form.dob.year}-${form.dob.month}-${form.dob.day}`;
            }

            const payload = {
                name: form.fullName || '',
                email: form.email || '',
                gender: form.gender || '',
                dob: dob || ''
            };

            try {
                const res = await fetch('../saveProfile.php', {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                let data = null;
                try { data = await res.json(); } catch (e) { /* ignore parse errors */ }
                if (!res.ok) {
                    const msg = data && data.error ? data.error : `Server returned ${res.status}`;
                    alert('Could not save profile: ' + msg);
                    console.warn('Save profile failed', res.status, data);
                    return false;
                }
                return true;
            } catch (e) {
                console.error('Error saving profile', e);
                alert('Error saving profile. Check your connection.');
                return false;
            }
        };

        // Edit toggle: save when going from editing -> not editing
        const toggleEdit = async () => {
            if (isEditing.value) {
                // currently editing -> attempt save
                const ok = await saveProfile();
                if (ok) {
                    isEditing.value = false;
                    await loadProfileFromServer();
                }
            } else {
                // enable editing
                isEditing.value = true;
            }
        };

        // Add Account modal
        const openAddAccount = ()=>{ newAccount.platform=''; newAccount.accountType=''; newAccount.inputPlatform=''; newAccount.availableAssets=0; showAddAccount.value=true; };
        const closeAddAccount = ()=>{ showAddAccount.value=false; };

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
                const res = await fetch('../removeAccount.php', {
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
                await loadAccountsFromServer();
            } catch (err) {
                console.error('Remove account error:', err);
                alert('Error removing account');
            }
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

        // Load profile (name, gender, dob) from server
        const loadProfileFromServer = async () => {
            try {
                const res = await fetch('../getProfile.php', { credentials: 'include' });
                if (!res.ok) {
                    console.warn('Failed to load profile', res.status);
                    return;
                }
                const data = await res.json();
                if (!data || data.error) return;

                form.fullName = data.name || '';
                form.email = data.email || '';
                // nickname not stored in DB — leave as-is
                form.gender = data.gender || '';

                if (data.dob) {
                    // dob is stored as YYYY-MM-DD
                    const parts = data.dob.split('-');
                    if (parts.length === 3) {
                        form.dob.year = parts[0];
                        form.dob.month = parts[1];
                        form.dob.day = parts[2];
                    }
                }
                // populate email(s) (no displayed date)
                try {
                    const emailAddr = data.email || '';
                    profile.emails = emailAddr ? [{ address: emailAddr }] : [];
                } catch (e) {
                    console.warn('Failed to set profile emails', e);
                }
            } catch (e) {
                console.warn('Could not load profile from server', e);
            }
        };

        // Format currency
        const formatCurrency = (v) => {
            return `₱ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
        };

        onMounted(async () => {
            await loadAccountsFromServer();
            await loadProfileFromServer();
            if (window.lucide) lucide.createIcons();
        });

        return {
            activeNav,
            navItems,
            isEditing,
            form,
            profile,
            months,
            days,
            years,
            accounts,
            showAddAccount,
            newAccount,
            showRemoveAccountModal,
            selectedForRemove,
            removeAccountName,
            setActiveNav,
            toggleEdit,
            openAddAccount,
            closeAddAccount,
            saveNewAccount,
            selectAccountForRemove,
            openRemoveAccountModal,
            closeRemoveAccountModal,
            confirmRemoveAccount,
            loadAccountsFromServer,
            loadProfileFromServer,
            formatCurrency
        };
    }
}).mount('#app');
