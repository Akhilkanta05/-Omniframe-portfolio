// login.js

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginStatus = document.getElementById('login-status');
    const goToIndexBtn = document.getElementById('go-to-index'); // Button: "View Portfolio"

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

    // ✅ View Portfolio redirect
    if (goToIndexBtn) {
        goToIndexBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            window.location.href = 'index.html';
        });
    }
});
