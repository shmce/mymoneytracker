export default {
  name: 'SignupForm',
  data() {
    return {
      // formData object holds all the input values
      formData: {
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        dobMonth: '',
        dobDay: '',
        dobYear: '',
        gender: ''
      },
      // State for toggling password visibility
      passwordVisible: false,
      confirmPasswordVisible: false
    };
  },
  methods: {
    // Method to toggle the main password field
    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible;
    },
    // Method to toggle the confirm password field
    toggleConfirmPasswordVisibility() {
      this.confirmPasswordVisible = !this.confirmPasswordVisible;
    },
    // Method called when the form is submitted
    handleRegister() {
      // --- Basic Validation ---
      const pwd = this.formData.password || '';
      const confirm = this.formData.confirmPassword || '';

      if (pwd !== confirm) {
        alert('Passwords do not match. Please try again.');
        return; // Stop the function
      }

      // Require at least 8 characters
      if (pwd.length < 8) {
        alert('Password must be at least 8 characters long.');
        return;
      }

      // Allow only alphanumeric and these special characters: . - _ ? ! $
      const allowedRegex = /^[A-Za-z0-9.\-_\?\!\$]+$/;
      if (!allowedRegex.test(pwd)) {
        alert("Password contains invalid characters. Only letters, numbers and the characters . - _ ? ! $ are allowed.");
        return;
      }

      // --- Form Submission Logic ---
      // In a real app, you'd send this data to a backend API
      console.log('Registering user with data:', this.formData);
      const displayName = `${this.formData.firstName} ${this.formData.lastName}`.trim();
      alert(`Registration successful for ${displayName}! (Check the console for data)`);

      // You could reset the form here if needed
      // Object.keys(this.formData).forEach(key => this.formData[key] = '');
      // this.passwordVisible = false;
      // this.confirmPasswordVisible = false;
    }
  }
}