const { createApp } = Vue;

createApp({
    data() {
        return {
            // You can add data here later, e.g., appName: 'MyMoney Tracker'
        }
    },
    methods: {
        handleLogin() {
            console.log('Login button clicked (via Vue)');
            alert('Login action triggered!');
        },
        handleSignup() {
            console.log('Signup button clicked (via Vue)');
            alert('Signup action triggered!');
        },
        handleGetStarted() {
            console.log('Get Started Now button clicked (via Vue)');
            alert('Get Started action triggered!');
        }
    }
}).mount('#app');