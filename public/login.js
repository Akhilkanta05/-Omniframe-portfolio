// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginStatus = document.getElementById('login-status');

    // 🔐 Hardcoded credentials (STATIC ONLY)
    const validCredentials = {
        admin: 'password123',
        akhil: 'akhil',
        nikhil: 'nikhil'
    };

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Simple validation against hardcoded users
        if (validCredentials[username] && validCredentials[username] === password) {
            loginStatus.textContent = 'Login successful! Redirecting...';
            loginStatus.className = 'form-status success';

            // Save session flag in localStorage
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUser', username);

            setTimeout(() => {
                window.location.href = 'admin.html'; // Redirect to admin page
            }, 1000);
        } else {
            loginStatus.textContent = 'Invalid username or password.';
            loginStatus.className = 'form-status error';
        }
    });
});
