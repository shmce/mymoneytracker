const { createApp, ref, onMounted, reactive } = Vue;

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

        // State for editing mode
        const isEditing = ref(false);

        // Profile display data (for display in header)
        const profile = reactive({
            name: 'Lloyd Emerson Lim',
            mainEmail: 'lloydlim@gmail.com',
            emails: [
                { address: 'lloydlim@gmail.com', lastUpdated: '1 month ago' }
            ]
        });

        // Form data (what the user interacts with)
        const form = reactive({
            fullName: 'Lloyd Emerson Lim',
            nickname: 'Lloyd',
            gender: '',
            dob: {
                month: '',
                day: '',
                year: ''
            }
        });

        // Accounts data
        const accounts = reactive([
            { platform: 'Cash', availableAssets: 20.00 },
            { platform: 'Bank - BDO', availableAssets: 100000.00 },
            { platform: 'GCash', availableAssets: 100000.00 }
        ]);

        // Method to toggle the editing state
        const toggleEdit = () => {
            if (isEditing.value) {
                // If switching from Edit to Save, handle saving logic here
                profile.name = form.fullName;
                // In a real app, you'd send data to a server
            }
            isEditing.value = !isEditing.value;
        };

        const setActiveNav = (item) => {
            activeNav.value = item;
            if (item === 'Dashboard') {
                window.location.href = '../homePage/homePage.html';
            }
            if (item === 'Records') {
                window.location.href = '../recordPage/recordPage.html';
            }
            if (item === 'Transactions') {
                window.location.href = '../transactionPage/transactionPage.html';
            }
        };

        // Helper to format currency (₱ 20,000.00)
        const formatCurrency = (value) => {
            const formatted = new Intl.NumberFormat('en-US', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            }).format(value);
            return `₱ ${formatted}`;
        };

        // --- Lifecycle Hooks ---
        onMounted(() => {
            // Render all lucide icons
            lucide.createIcons();
        });

        return {
            activeNav,
            navItems,
            isEditing,
            profile,
            form,
            accounts,
            toggleEdit,
            setActiveNav,
            formatCurrency,
        };
    }
}).mount('#app');
