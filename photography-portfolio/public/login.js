// public/login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginStatus = document.getElementById('login-status');
    const API_BASE_URL = window.location.origin; // Dynamically gets http://localhost:3000

    // Check if already logged in (e.g., if user navigates back to login page after successful login)
    // If a token exists, redirect directly to admin.html
    if (localStorage.getItem('adminToken')) {
        window.location.href = 'admin.html';
        return; // Stop execution to prevent form submission logic
    }

    loginForm.addEventListener('submit', async (e) => {        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        loginStatus.textContent = 'Logging in...';
        loginStatus.className = 'form-status'; // Reset class
        loginStatus.style.display = 'block';

        try {
            const response = await fetch(`${API_BASE_URL}/api/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json', // Crucial: tell server we're sending JSON
                },
                body: JSON.stringify({ username, password }), // Convert JS object to JSON string
            });

            const result = await response.json(); // Parse the JSON response from the server

            if (response.ok) { // Check if status code is 2xx (e.g., 200 OK)
                localStorage.setItem('adminToken', result.token); // Store the token securely
                loginStatus.textContent = 'Login successful! Redirecting...';
                loginStatus.className = 'form-status success';
                setTimeout(() => {
                    window.location.href = 'admin.html'; // Redirect to admin page
                }, 1000); // Give user a moment to see success message
            } else {
                // Server responded with an error status (e.g., 401, 400, 500)
                loginStatus.textContent = `Login failed: ${result.message || 'Unknown error'}`;
                loginStatus.className = 'form-status error';
            }
        } catch (error) {
            // Network error (server unreachable, CORS issue, etc.)
            console.error('Login error:', error);
            loginStatus.textContent = 'An error occurred. Please check server status and network. ' + error.message;
            loginStatus.className = 'form-status error';
        }
    });
});