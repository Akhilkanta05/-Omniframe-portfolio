// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginStatus = document.getElementById('login-status');
    const viewPortfolioBtn = document.querySelector('.nav-links a[href="index.html"]');

    // 🔐 Hardcoded credentials (STATIC ONLY)
    const validCredentials = {
        admin: 'password123',
        akhil: 'akhil',
        nikhil: 'nikhil'
    };

    // Login form submit handler
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        // Simple validation
        if (validCredentials[username] && validCredentials[username] === password) {
            loginStatus.textContent = 'Login successful! Redirecting...';
            loginStatus.className = 'form-status success';

            // Store login state
            localStorage.setItem('adminLoggedIn', 'true');
            localStorage.setItem('adminUser', username);

            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 1000);
        } else {
            loginStatus.textContent = 'Invalid username or password.';
            loginStatus.className = 'form-status error';
        }
    });

    // 🔓 "View Portfolio" button logic
    if (viewPortfolioBtn) {
        viewPortfolioBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior

            // Optional: Clear any login session (if applicable)
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUser');

            // Redirect to main portfolio page
            window.location.href = 'index.html';
        });
    }
});
