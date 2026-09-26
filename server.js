const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'MRT_SUPER_SECRET_SECURITY_KEY_001'; 

// 1. MIDDLEWARE CONFIGURATION
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all CSS, JS, and image assets seamlessly out of the public folder
app.use(express.static(path.join(__dirname, 'public')));

// In-memory data store placeholder
let DB_USERS = [];
let DB_APPLICANTS = [];

// Initialize default administrator securely
async function initializeDefaultAdmin() {
    if (DB_USERS.length === 0) {
        const hashedPassword = await bcrypt.hash('MrTEam001', 10);
        DB_USERS.push({
            id: 1,
            username: 'Mbaruk Mbaruk',
            password: hashedPassword,
            role: 'Super Admin'
        });
        console.log('[Security Engine] Default administrator "Mbaruk Mbaruk" initialized securely.');
    }
}
initializeDefaultAdmin();

// ==========================================================================
// 2. EXPLICIT SERVER PAGE ROUTERS (Mapping directly inside the public folder)
// ==========================================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portal-login.html'));
});

app.get('/dashboard.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/document.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'document.html'));
});

app.get('/applicants.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'applicants.html'));
});

// ==========================================================================
// 3. SECURE AUTHENTICATION ENDPOINTS
// ==========================================================================

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Username and password are required." });
    }

    const user = DB_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(401).json({ success: false, message: "Invalid credentials or unauthorized user account." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: "Incorrect password selection." });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    return res.json({
        success: true,
        message: "Authentication successful.",
        token: token,
        user: { username: user.username, role: user.role }
    });
});

// ==========================================================================
// 4. PROTECTION GUARD MIDDLEWARE
// ==========================================================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: "Access denied. Token missing." });
    }

    jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
        if (err) {
            return res.status(403).json({ success: false, message: "Session expired or invalid token." });
        }
        req.user = decodedUser;
        next();
    });
}

app.get('/api/admin/applicants', authenticateToken, (req, res) => {
    res.json(DB_APPLICANTS);
});

// START THE SERVER
app.listen(PORT, () => {
    console.log(`========================================================`);
    console.log(`MRT Backend Server running locally on http://localhost:${PORT}`);
    console.log(`Status: Active Workspace Mode (Sandbox Integration Ready)`);
    console.log(`========================================================`);
});

// Hardcode your secure operational PIN configuration here
const VAULT_MASTER_PIN = "2026"; // Change this to whatever combination you prefer!

app.delete('/api/documents/minutes/:id', (req, res) => {
    const entryId = req.params.id;
    const clientPin = req.headers['x-vault-pin']; // Read the custom security header

    // 1. Validate PIN entry matches vault configuration
    if (!clientPin || clientPin !== VAULT_MASTER_PIN) {
        return res.status(403).json({ 
            success: false, 
            message: "Invalid Vault Security Configuration PIN. Authorization revoked." 
        });
    }

    // 2. Locate row in database array (Update array name if using DB_MINUTES instead)
    const index = DB_APPLICANTS.findIndex(item => item.id == entryId); 
    
    if (index === -1) {
        return res.status(404).json({ success: false, message: "Record not found in database vault." });
    }
    
    // 3. Securely drop the index row
    DB_APPLICANTS.splice(index, 1);
    
    return res.json({ success: true, message: "Record successfully removed from the vault." });
});

