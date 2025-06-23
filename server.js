// server.js

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// --- User Credentials (for development only) ---
// In production, store hashed passwords in a database or use environment variables.
const USERS = {
    admin: 'password123',
    akhil: 'akhil',
    nikhil:'nikhil'
};

// --- In-memory store for valid tokens (for simplicity, not persistent across server restarts) ---
const validTokens = new Set();

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Ensure gallery directory exists
const galleryDir = path.join(__dirname, 'public', 'images', 'gallery');
fs.mkdir(galleryDir, { recursive: true })
    .then(() => console.log(`Ensured gallery directory exists: ${galleryDir}`))
    .catch(err => console.error(`Error ensuring gallery directory exists: ${err.message}`));

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, galleryDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            cb(null, true);
        } else {
            cb('Error: Images Only! (jpeg, jpg, png, gif)');
        }
    }
});

// --- Authentication Middleware ---
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ message: 'Authentication token required.' });
    }

    if (!validTokens.has(token)) {
        return res.status(403).json({ message: 'Invalid or expired token.' });
    }

    next();
}

// --- API Endpoints ---

// POST /api/login - Handles user login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (USERS[username] && USERS[username] === password) {
        const token = crypto.randomBytes(32).toString('hex');
        validTokens.add(token);

        console.log(`User '${username}' logged in. Token generated.`);
        res.json({ message: 'Login successful!', token });
    } else {
        res.status(401).json({ message: 'Invalid credentials.' });
    }
});

// POST /api/logout - Handles user logout
app.post('/api/logout', authenticateToken, (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
        validTokens.delete(token);
        console.log(`Token removed. User logged out.`);
    }
    res.json({ message: 'Logged out successfully.' });
});

// GET /api/images - List images (public)
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

// POST /api/upload - Upload image (protected)
app.post('/api/upload', authenticateToken, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No image file provided.' });
    }
    console.log(`File uploaded: ${req.file.filename}`);
    res.status(201).json({
        message: 'Image uploaded successfully!',
        filename: req.file.filename,
        filepath: `/images/gallery/${req.file.filename}`
    });
}, (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        return res.status(400).json({ message: `Multer Error: ${error.message}` });
    } else if (error) {
        return res.status(400).json({ message: `Upload Error: ${error}` });
    }
    next();
});

// DELETE /api/images/:filename - Delete image (protected)
app.delete('/api/images/:filename', authenticateToken, async (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(galleryDir, filename);

    try {
        await fs.unlink(filePath);
        console.log(`File deleted: ${filename}`);
        res.json({ message: `Image '${filename}' deleted successfully.` });
    } catch (error) {
        if (error.code === 'ENOENT') {
            return res.status(404).json({ message: 'Image not found.' });
        }
        console.error(`Error deleting image '${filename}':`, error);
        res.status(500).json({ message: 'Failed to delete image', error: error.message });
    }
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`\nServer running at: http://localhost:${PORT}`);
    console.log(`Portfolio page:   http://localhost:${PORT}/index.html`);
    console.log(`Login page:       http://localhost:${PORT}/login.html`);
    console.log(`\nAvailable Users:`);
    console.log(`  admin  → password123`);
    console.log(`  akhil  → akhil`);
});

/*
  SECURITY NOTES:
  - Use bcrypt for password hashing.
  - Use JWT instead of in-memory tokens for scalability.
  - Store credentials in a database or .env file.
  - Implement token expiration and refresh logic.
  - Always run production servers over HTTPS.
*/
