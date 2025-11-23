const { createApp } = Vue;

createApp({
    data() {
        return {
            email: '',
            password: '',
            passwordVisible: false,
            showMessage: false,
            message: '',
            messageTimeout: null
        };
    },
    mounted() {
        // Check for error parameter in URL
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error') === 'invalid') {
            this.showMessage('Wrong email or password. Please try again.', 5000);
        }
    },
    methods: {
        togglePasswordVisibility() {
            this.passwordVisible = !this.passwordVisible;
        },
        showMessage(message, duration = 3000) {
            this.message = message;
            this.showMessage = true;
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout);
            }
            this.messageTimeout = setTimeout(() => {
                this.showMessage = false;
            }, duration);
        },
    }
}).mount('#app');