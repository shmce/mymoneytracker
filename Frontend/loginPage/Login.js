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
        const err = urlParams.get('error');
        if (err === 'invalid') {
            this.displayMessage('Wrong email or password. Please try again.', 5000);
        } else if (err === 'pwd_invalid' || err === 'pwd_short' || err === 'pwd_chars') {
            this.displayMessage('Password invalid. It must be at least 8 characters and only contain letters, numbers, and . - _ ? ! $.', 6000);
        }
    },
    methods: {
        togglePasswordVisibility() {
            this.passwordVisible = !this.passwordVisible;
        },
        displayMessage(message, duration = 3000) {
            this.message = message;
            this.showMessage = true;
            if (this.messageTimeout) {
                clearTimeout(this.messageTimeout);
            }
            this.messageTimeout = setTimeout(() => {
                this.showMessage = false;
            }, duration);
        },

        // Validate password client-side on login submit
        handleLogin(event) {
            // event is the submit event from the form because we used @submit.prevent
            const pwd = this.password || '';
            // Require at least 8 characters
            if (pwd.length < 8) {
                this.displayMessage('Password must be at least 8 characters long.', 4000);
                return; // prevent submission
            }

            // Allow only alphanumeric and these special characters: . - _ ? ! $
            const allowedRegex = /^[A-Za-z0-9.\-_\?\!\$]+$/;
            if (!allowedRegex.test(pwd)) {
                this.displayMessage('Password contains invalid characters. Only letters, numbers and the characters . - _ ? ! $ are allowed.', 6000);
                return; // prevent submission
            }

            // If validation passes, submit the form
            event.target.submit();
        },
    }
}).mount('#app');