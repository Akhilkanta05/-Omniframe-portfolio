// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginStatus = document.getElementById('login-status');
    const viewPortfolioBtn = document.querySelector('.nav-links a[href="index.html"]');

    // 🔐 Hardcoded credentials for static demo
    const validCredentials = {
        admin: 'password123',
        akhil: 'akhil',
        nikhil: 'nikhil'
    };

    // Handle login form submission
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (validCredentials[username] && validCredentials[username] === password) {
            loginStatus.textContent = 'Login successful! Redirecting...';
            loginStatus.className = 'form-status success';

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

    // Handle View Portfolio button click
    if (viewPortfolioBtn) {
        viewPortfolioBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Optional: clear login session
            localStorage.removeItem('adminLoggedIn');
            localStorage.removeItem('adminUser');

            window.location.href = 'index.html';
        });
    }
});
