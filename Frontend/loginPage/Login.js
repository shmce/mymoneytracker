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
        // Auto-fill email from cookie
        const saved = document.cookie
            .split("; ")
            .find(row => row.startsWith("user_email="));
        if (saved) this.email = decodeURIComponent(saved.split("=")[1]);

        // Error flash from PHP
        const url = new URLSearchParams(window.location.search);
        if (url.get("error") === "invalid") {
            this.displayMessage("Wrong email or password.", 5000);
        }
    },
    methods: {
        togglePasswordVisibility() {
            this.passwordVisible = !this.passwordVisible;
        },
        displayMessage(msg, ms = 3000) {
            this.message = msg;
            this.showMessage = true;
            clearTimeout(this.messageTimeout);
            this.messageTimeout = setTimeout(() => this.showMessage = false, ms);
        },
        handleLogin(e) {
            const pwd = this.password;
            if (pwd.length < 8) {
                this.displayMessage("Password must be ≥ 8 characters.", 4000);
                return;
            }
            if (!/^[A-Za-z0-9.\-_\?\!\$]+$/.test(pwd)) {
                this.displayMessage("Invalid characters in password.", 4000);
                return;
            }
            e.target.submit();
        }
    }
}).mount('#app');