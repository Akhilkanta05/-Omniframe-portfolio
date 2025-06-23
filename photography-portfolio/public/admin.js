// public/admin.js

document.addEventListener('DOMContentLoaded', () => {
    const uploadForm = document.getElementById('upload-form');
    const uploadStatus = document.getElementById('upload-status');
    const imageListContainer = document.getElementById('image-list-container');
    const loadingMessage = document.getElementById('loading-message');    const noImagesMessage = document.getElementById('no-images-message');

    const API_BASE_URL = window.location.origin;

    // --- Authentication Check on Page Load ---
    const token = localStorage.getItem('adminToken');
    if (!token) {
        // If no token is found, redirect to the login page
        alert('You are not logged in. Please log in to access the admin panel.');
        window.location.href = 'login.html'; // Redirect to login page
        return; // Stop script execution
    }

    // Add logout button to the header dynamically
    const navLinks = document.querySelector('.nav-links');
    const logoutLi = document.createElement('li');
    logoutLi.innerHTML = '<a href="#" id="logout-btn">Logout</a>';
    navLinks.appendChild(logoutLi);

    // --- Logout Functionality ---
    document.getElementById('logout-btn').addEventListener('click', async (e) => {
        e.preventDefault();
        const confirmLogout = confirm('Are you sure you want to log out?');
        if (!confirmLogout) return;

        try {
            const response = await fetch(`${API_BASE_URL}/api/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` // Send the token to invalidate it
                }
            });

            if (response.ok) {
                localStorage.removeItem('adminToken'); // Clear token from client-side
                alert('Logged out successfully.');
                window.location.href = 'login.html'; // Redirect to login
            } else {
                // Even if logout fails on server (e.g., token already invalid), clear client-side token
                localStorage.removeItem('adminToken');
                alert('Failed to log out completely from server. Please log in again if needed.');
                console.error('Logout failed:', await response.json());
                window.location.href = 'login.html';
            }
        } catch (error) {            console.error('Logout error:', error);
            alert('An error occurred during logout. Please check network.');
            localStorage.removeItem('adminToken'); // Attempt to clear token anyway
            window.location.href = 'login.html';
        }
    });

    // --- Fetch and Display Images (for Admin Panel) ---
    async function fetchImages() {
        loadingMessage.style.display = 'block';
        noImagesMessage.style.display = 'none';
        imageListContainer.innerHTML = ''; // Clear previous images, except messages

        try {
            // Note: GET /api/images is public, so no token is needed for this specific fetch            const response = await fetch(`${API_BASE_URL}/api/images`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const images = await response.json();

            if (images.length === 0) {
                noImagesMessage.style.display = 'block';
            } else {
                images.forEach(image => {
                    const imageCard = document.createElement('div');
                    imageCard.className = 'image-card';
                    imageCard.innerHTML = `
                        <img src="/images/gallery/${image}" alt="${image}">
                        <span>${image}</span>
                        <button class="delete-btn" data-filename="${image}">Delete</button>
                    `;
                    imageListContainer.appendChild(imageCard);
                });
            }
        } catch (error) {
            console.error('Error fetching images for admin:', error);
            imageListContainer.innerHTML = `<p class="form-status error">Error loading images: ${error.message}</p>`;
        } finally {
            loadingMessage.style.display = 'none';
        }
    }

    // --- Handle Image Upload ---
    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();        const fileInput = document.getElementById('image-file');
        const file = fileInput.files[0];

        if (!file) {
            displayStatus('Please select a file to upload.', 'error');            return;
        }

        const formData = new FormData();
        formData.append('image', file); // 'image' must match the field name in multer setup (server.js)

        displayStatus('Uploading...', '');

        try {
            const response = await fetch(`${API_BASE_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}` // Include the token for authentication!
                },                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                displayStatus(result.message, 'success');
                uploadForm.reset(); // Clear form
                fetchImages(); // Refresh image list
            } else if (response.status === 401 || response.status === 403) {
                // Token invalid or missing, force re-login                alert('Session expired or unauthorized. Please log in again.');
                localStorage.removeItem('adminToken');
                window.location.href = 'login.html';
            }
            else {
                displayStatus(`Upload failed: ${result.message || 'Unknown error'}`, 'error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            displayStatus(`An error occurred during upload: ${error.message}`, 'error');
        }
    });

    // --- Handle Image Deletion (Event Delegation) ---
    imageListContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-btn')) {
            const filename = e.target.dataset.filename;
            if (!confirm(`Are you sure you want to delete ${filename}?`)) {
                return;            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/images/${filename}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}` // Include the token for authentication!
                    },
                });

                const result = await response.json();

                if (response.ok) {
                    displayStatus(result.message, 'success');
                    fetchImages(); // Refresh image list
                } else if (response.status === 401 || response.status === 403) {
                    // Token invalid or missing, force re-login
                    alert('Session expired or unauthorized. Please log in again.');
                    localStorage.removeItem('adminToken');
                    window.location.href = 'login.html';
                }
                else {
                    displayStatus(`Delete failed: ${result.message || 'Unknown error'}`, 'error');
                }
            } catch (error) {
                console.error('Delete error:', error);
                displayStatus(`An error occurred during deletion: ${error.message}`, 'error');
            }
        }
    });

    // --- Utility function to display status messages ---
    function displayStatus(message, type) {
        uploadStatus.textContent = message;
        uploadStatus.className = `form-status ${type}`; // 'success' or 'error'
        uploadStatus.style.display = 'block';
        // Optional: Hide message after a few seconds
        setTimeout(() => {            uploadStatus.style.display = 'none';
        }, 5000);
    }

    // Initial fetch of images when the page loads
    fetchImages();
});