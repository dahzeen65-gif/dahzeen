const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const supabase = require('./public/db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'MRT_LOCAL_DEV_SECRET_CHANGE_ME';
const DEFAULT_ADMIN_PASSWORD = process.env.MRT_ADMIN_PASSWORD || 'MrTEam001';
const VAULT_MASTER_PIN = process.env.MRT_VAULT_PIN || '2026';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many login attempts. Please wait 15 minutes before trying again.' }
});

function getTokenFromRequest(req) {
    const cookies = Object.fromEntries(
        (req.headers.cookie || '')
            .split(';')
            .map(cookie => cookie.trim())
            .filter(Boolean)
            .map(cookie => {
                const idx = cookie.indexOf('=');
                if (idx === -1) return ['', ''];
                return [cookie.slice(0, idx), decodeURIComponent(cookie.slice(idx + 1))];
            })
    );

    if (cookies.mrt_auth_token) return cookies.mrt_auth_token;

    const authHeader = req.headers.authorization;
    if (!authHeader) return null;
    return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
}

function requireAuth(req, res, next) {
    const token = getTokenFromRequest(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. Please sign in.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
    }
}

function requirePageAuth(req, res, next) {
    const token = getTokenFromRequest(req);
    if (!token) {
        return res.redirect('/portal-login.html');
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        return next();
    } catch (error) {
        return res.redirect('/portal-login.html');
    }
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden. You do not have access to this portal area.' });
        }
        return next();
    };
}

// 1. MIDDLEWARE CONFIGURATION
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-vault-pin']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// In-memory data store placeholder
let DB_USERS = [];
let DB_APPLICANTS = [];

async function initializeDefaultAdmin() {
    if (DB_USERS.length === 0) {
        const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
        DB_USERS.push({
            id: 1,
            username: 'Mbaruk Mbaruk',
            password: hashedPassword,
            role: 'Super Admin'
        });
        console.log('[Security Engine] Default administrator "Mbaruk Mbaruk" initialized securely.');
    }
}

async function syncApplicantsToSupabase() {
    if (!supabase || !supabase.isConfigured) {
        return;
    }

    try {
        const { data, error } = await supabase.from('applicants').select('*');
        if (error) {
            console.warn('[Supabase] Failed to sync applicants:', error.message);
            return;
        }

        if (data && data.length > 0) {
            DB_APPLICANTS = data.map((row, index) => ({
                id: row.id ?? index + 1,
                name: row.name ?? 'Unknown Applicant',
                email: row.email ?? '',
                phone: row.phone ?? '',
                accountNumber: row.account_number ?? row.accountNumber ?? '',
                pillar: row.primary_pillar ?? row.pillar ?? '',
                mpesaReference: row.mpesa_reference ?? row.mpesaReference ?? '',
                status: row.status ?? 'Pending Review',
                amountPaid: Number(row.amount_paid ?? row.amountPaid ?? 0),
                date: row.created_at ?? row.date ?? new Date().toISOString()
            }));
            console.log('[Supabase] Applicant registry synced successfully.');
        }
    } catch (error) {
        console.warn('[Supabase] Applicant sync error:', error.message);
    }
}

async function startServer() {
    await initializeDefaultAdmin();
    await syncApplicantsToSupabase();
    app.listen(PORT, () => {
        console.log(`========================================================`);
        console.log(`MRT Backend Server running locally on http://localhost:${PORT}`);
        console.log(`Status: Active Workspace Mode (Sandbox Integration Ready)`);
        console.log(`========================================================`);
    });
}

startServer();

// ==========================================================================
// 2. PUBLIC PAGE ROUTERS
// ==========================================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/portal-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'portal-login.html'));
});

app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/membership.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'membership.html'));
});

app.get('/gallery.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gallery.html'));
});

// ==========================================================================
// 3. PROTECTED PAGE ROUTERS
// ==========================================================================
const protectedPages = [
    'dashboard.html',
    'document.html',
    'applicants.html',
    'finance.html',
    'reports.html',
    'settings.html',
    'member-document-review.html',
    'member-document-upload.html',
    'fas fa-cog.html'
];

protectedPages.forEach(page => {
    app.get(`/${page}`, requirePageAuth, requireRole('Super Admin'), (req, res) => {
        res.sendFile(path.join(__dirname, 'public', page));
    });
});

// Serve all CSS, JS, and image assets seamlessly out of the public folder
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================================================
// 3. SECURE AUTHENTICATION ENDPOINTS
// ==========================================================================

app.post('/api/auth/login', authLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const user = DB_USERS.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials or unauthorized user account.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password selection.' });
    }

    const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
    );

    res.cookie('mrt_auth_token', token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 2 * 60 * 60 * 1000,
        path: '/'
    });

    return res.json({
        success: true,
        message: 'Authentication successful.',
        user: { username: user.username, role: user.role }
    });
});

app.get('/api/auth/session', (req, res) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'No active session.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({ success: true, user: { username: decoded.username, role: decoded.role } });
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Session expired or invalid token.' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('mrt_auth_token', { httpOnly: true, sameSite: 'lax', secure: false });
    return res.json({ success: true, message: 'Logged out successfully.' });
});

// ==========================================================================
// 4. PROTECTION GUARD MIDDLEWARE
// ==========================================================================
app.get('/api/admin/applicants', requireAuth, async (req, res) => {
    if (supabase && supabase.isConfigured) {
        try {
            const { data, error } = await supabase.from('applicants').select('*');
            if (error) {
                console.warn('[Supabase] Failed to load applicants:', error.message);
                return res.json(DB_APPLICANTS);
            }
            if (data && data.length > 0) {
                return res.json(data);
            }
            return res.json(DB_APPLICANTS);
        } catch (error) {
            console.warn('[Supabase] Applicant fetch error:', error.message);
            return res.json(DB_APPLICANTS);
        }
    }

    return res.json(DB_APPLICANTS);
});

app.delete('/api/documents/minutes/:id', requireAuth, (req, res) => {
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

const GALLERY_STORAGE_BUCKET = process.env.SUPABASE_GALLERY_BUCKET || 'gallery-media';

app.get('/api/gallery', async (req, res) => {
    if (!supabase || !supabase.isConfigured) {
        return res.status(503).json({ success: false, message: 'Gallery database is not configured.' });
    }

    try {
        const { data, error } = await supabase
            .from('gallery')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[Supabase] Failed to fetch gallery:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load gallery items.' });
        }

        return res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('[Supabase] Gallery fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load gallery items.' });
    }
});

app.post(
    '/api/gallery/upload',
    requireAuth,
    requireRole('Super Admin'),
    express.raw({ type: '*/*', limit: '50mb' }),
    async (req, res) => {
        if (!supabase || !supabase.isConfigured) {
            return res.status(503).json({ success: false, message: 'Gallery database is not configured.' });
        }

        const title = String(req.query.title || '').trim();
        const category = String(req.query.category || '').trim();
        const mediaType = req.query.media_type === 'video' ? 'video' : 'image';
        const contentType = String(req.headers['content-type'] || '').split(';')[0].toLowerCase();

        if (!title || !category || !Buffer.isBuffer(req.body) || req.body.length === 0) {
            return res.status(400).json({ success: false, message: 'A title, category, and media file are required.' });
        }

        if (!contentType.startsWith(`${mediaType}/`)) {
            return res.status(400).json({ success: false, message: 'The selected media type does not match the uploaded file.' });
        }

        const requestedExtension = path.extname(String(req.query.filename || '')).toLowerCase();
        const extension = /^\.[a-z0-9]{1,10}$/.test(requestedExtension)
            ? requestedExtension
            : mediaType === 'video' ? '.mp4' : '.jpg';
        const storagePath = `public/${Date.now()}-${require('crypto').randomUUID()}${extension}`;

        try {
            const { data: uploadedFile, error: uploadError } = await supabase.storage
                .from(GALLERY_STORAGE_BUCKET)
                .upload(storagePath, req.body, { contentType, upsert: false });

            if (uploadError) {
                console.error('[Supabase] Gallery file upload failed:', uploadError.message);
                return res.status(500).json({ success: false, message: 'Unable to upload the gallery file. Check the gallery-media storage bucket and its policies.' });
            }

            const { data: publicUrlData } = supabase.storage
                .from(GALLERY_STORAGE_BUCKET)
                .getPublicUrl(uploadedFile.path);

            const { data, error } = await supabase
                .from('gallery')
                .insert([{
                    title,
                    category,
                    media_type: mediaType,
                    media_url: publicUrlData.publicUrl
                }])
                .select()
                .single();

            if (error) {
                console.error('[Supabase] Failed to save gallery record:', error.message);
                const { error: cleanupError } = await supabase.storage
                    .from(GALLERY_STORAGE_BUCKET)
                    .remove([uploadedFile.path]);
                if (cleanupError) {
                    console.error('[Supabase] Failed to remove unreferenced gallery upload:', cleanupError.message);
                }
                return res.status(500).json({ success: false, message: 'The file uploaded, but its gallery record could not be saved.' });
            }

            return res.status(201).json({ success: true, data });
        } catch (error) {
            console.error('[Supabase] Gallery upload error:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to publish this gallery item.' });
        }
    }
);

app.delete('/api/gallery/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase || !supabase.isConfigured) {
        return res.status(503).json({ success: false, message: 'Gallery database is not configured.' });
    }

    try {
        const { data, error } = await supabase
            .from('gallery')
            .delete()
            .eq('id', req.params.id)
            .select('id');

        if (error) {
            console.error('[Supabase] Failed to delete gallery item:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to delete this gallery item.' });
        }
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: 'Gallery item not found.' });
        }

        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Gallery delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to delete this gallery item.' });
    }
});