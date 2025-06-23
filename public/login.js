function staticLogin() {
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  // Hardcoded credentials (you can add more)
  const users = {
    admin: "password123",
    akhil: "akhil",
    nikhil: "nikhil"
  };

  if (users[username] && users[username] === password) {
    // Store login in localStorage (optional)
    localStorage.setItem("staticAdmin", username);
    window.location.href = "dashboard.html";
  } else {
    errorMsg.textContent = "Invalid username or password.";
  }
}
