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
      if (this.formData.password !== this.formData.confirmPassword) {
        alert('Passwords do not match. Please try again.');
        return; // Stop the function
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