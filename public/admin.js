document.addEventListener('DOMContentLoaded', () => {
  const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
  if (!isLoggedIn) {
    alert('Access denied. Please log in first.');
    window.location.href = 'login.html';
    return;
  }

  const uploadForm = document.getElementById('upload-form');
  const uploadStatus = document.getElementById('upload-status');
  const previewContainer = document.getElementById('preview-container');
  const logoutBtn = document.getElementById('logout-btn');

  // Logout Functionality
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUser');
    alert('Logged out successfully.');
    window.location.href = 'login.html';
  });

  // Handle file preview only (no upload to server)
  uploadForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const fileInput = document.getElementById('image-file');
    const file = fileInput.files[0];

    if (!file) {
      uploadStatus.textContent = 'Please select an image file.';
      uploadStatus.className = 'form-status error';
      return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement('img');
      img.src = e.target.result;
      img.style.maxWidth = '300px';
      img.style.marginTop = '10px';

      previewContainer.innerHTML = '<h4>Preview:</h4>';
      previewContainer.appendChild(img);

      uploadStatus.textContent = 'Image preview loaded. (Not uploaded)';
      uploadStatus.className = 'form-status success';
    };
    reader.readAsDataURL(file);
  });
});
