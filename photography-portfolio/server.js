// server.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises; // Use promises version of fs for async/await
const cors = require('cors');
const crypto = require('crypto'); // Built-in Node.js module for generating secure tokens

const app = express();
const PORT = process.env.PORT || 3000; // Use environment port or default to 3000

// --- Security: Hardcoded Admin Credentials (DO NOT USE IN PRODUCTION!) ---
// In a real application, these would be fetched securely (e.g., from environment variables)
// and the password would be hashed (e.g., using bcrypt).
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'password123';

// --- In-memory store for valid tokens (for simplicity, not persistent across server restarts) ---
const validTokens = new Set();

// --- Middleware ---
app.use(cors()); // Enable CORS for all routes (important for development)
app.use(express.json()); // For parsing JSON request bodies

// Serve static files from the 'public' directory
// This means files like index.html, styles.css, script.js, and images will be accessible
app.use(express.static(path.join(__dirname, 'public')));

// Set up Multer for file uploads
const galleryDir = path.join(__dirname, 'public', 'images', 'gallery');

// Ensure the gallery directory exists. If not, create it.
fs.mkdir(galleryDir, { recursive: true })
  .then(() => console.log(`Ensured gallery directory exists: ${galleryDir}`))
  .catch(err => console.error(`Error ensuring gallery directory exists: ${err.message}`));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, galleryDir); // Files will be saved in public/images/gallery
    },
    filename: (req, file, cb) => {
        // Create a unique filename to prevent overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true); // Accept the file
        } else {
            cb('Error: Images Only! (jpeg, jpg, png, gif)'); // Reject the file
        }
    }
});

// --- Authentication Middleware ---
// This function checks if a valid token is provided in the Authorization header
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    // Expected format: "Bearer YOUR_TOKEN"
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        // No token provided
        return res.status(401).json({ message: 'Authentication token required.' });
    }    if (!validTokens.has(token)) {
        // Token is not in our set of valid tokens (either never existed or was logged out)
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    // If token is valid, proceed to the next middleware/route handler
    next();
}

// --- API Endpoints ---

// POST /api/login - Handles user login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {        const token = crypto.randomBytes(32).toString('hex'); // Generate a random token
        validTokens.add(token); // Add token to our in-memory set of valid tokens

        console.log(`Admin '${username}' logged in. Token generated.`);
        res.json({ message: 'Login successful!', token });
    } else {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
});

// POST /api/logout - Handles user logout (removes token)
app.post('/api/logout', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        validTokens.delete(token); // Remove token from valid set
        console.log(`Token removed. User logged out.`);
    }
    res.json({ message: 'Logged out successfully.' });
});

// GET /api/images - Get list of images (PUBLICLY ACCESSIBLE for the portfolio)
// This endpoint does NOT use authenticateToken, allowing public viewing.
app.get('/api/images', async (req, res) => {
    try {
        const files = await fs.readdir(galleryDir);
        const images = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
        });
        res.json(images);
    } catch (error) {
        console.error('Error reading gallery directory:', error);
        res.status(500).json({ message: 'Failed to retrieve images', error: error.message });
    }
});

// POST /api/upload - Upload new image (PROTECTED by authenticateToken middleware)
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided.' });
    }
    console.log(`File uploaded: ${req.file.filename}`);
    res.status(201).json({
        message: 'Image uploaded successfully!',
        filename: req.file.filename,
        filepath: `/images/gallery/${req.file.filename}`
    });}, (error, req, res, next) => { // Multer specific error handler
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: `Multer Error: ${error.message}` });
    } else if (error) {
        return res.status(400).json({ message: `Upload Error: ${error}` });
    }
    next();});

// DELETE /api/images/:filename - Delete an image (PROTECTED by authenticateToken middleware)
app.delete('/api/images/:filename', authenticateToken, async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(galleryDir, filename);

    try {
        await fs.unlink(filePath); // Delete the file
        console.log(`File deleted: ${filename}`);        res.json({ message: `Image '${filename}' deleted successfully.` });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'Image not found.' });
        }
        console.error(`Error deleting image '${filename}':`, error);
        res.status(500).json({ message: 'Failed to delete image', error: error.message });
    }
});

// --- Server Start ---
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Portfolio page: http://localhost:${PORT}/index.html`);
    console.log(`Admin login: http://localhost:${PORT}/login.html`);
    console.log(`Admin Credentials: Username: ${ADMIN_USERNAME}, Password: ${ADMIN_PASSWORD}`);
});

/*
    IMPORTANT SECURITY NOTES:
    This setup is for demonstration and local development ONLY.
    For a production environment, you MUST implement robust security measures:
    1.  PASSWORD HASHING: Never store plaintext passwords. Use a library like `bcrypt` to hash passwords.
    2.  JWT (JSON Web Tokens): Use a proper JWT library (e.g., `jsonwebtoken`) for token generation,        signing, and verification, instead of a simple in-memory Set for tokens. This allows tokens
        to be stateless and verifiable.
    3.  TOKEN EXPIRY & REFRESH: Implement token expiry times and a mechanism to refresh them.
    4.  PERSISTENT STORAGE: Store user accounts and hashed passwords in a database (e.g., MongoDB, PostgreSQL).
    5.  HTTPS: Always use HTTPS in production to encrypt all communication between client and server.
    6.  ENVIRONMENT VARIABLES: Do not hardcode sensitive information like admin credentials. Use
        environment variables (e.g., `process.env.ADMIN_USERNAME`).
    7.  ERROR HANDLING: Implement more granular and secure error handling.
*/