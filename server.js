const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');
const supabase = require('./supabase');

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
app.use(express.json({ limit: '15mb' }));
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

let DB_USERS = [];

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

async function startServer() {
    await initializeDefaultAdmin();
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
    const { username, password } = req.body || {};

    if (typeof username !== 'string' || typeof password !== 'string' || !username.trim() || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    let user = DB_USERS.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user && supabase.isConfigured) {
        try {
            const { data, error } = await supabase
                .from('authorized_users')
                .select('id,username')
                .order('created_at', { ascending: true });
            if (error) {
                console.error('[Supabase] Could not verify authorized login user:', error.message);
                return res.status(503).json({ success: false, message: 'Unable to verify the authorized users list.' });
            }
            const authorizedUser = (data || []).find(row =>
                typeof row.username === 'string' && row.username.toLowerCase() === username.trim().toLowerCase()
            );
            if (authorizedUser) {
                user = {
                    id: `authorized-${authorizedUser.id}`,
                    username: authorizedUser.username,
                    password: DB_USERS[0]?.password,
                    role: 'Super Admin'
                };
            }
        } catch (error) {
            console.error('[Supabase] Authorized login lookup failed:', error.message);
            return res.status(503).json({ success: false, message: 'Unable to verify the authorized users list.' });
        }
    }
    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials or unauthorized user account.' });
    }

    const isMatch = await bcrypt.compare(password, user.password || '');
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
app.get('/api/admin/applicants', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('applicants')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to load applicants:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load applicants.' });
        }
        return res.json({
            success: true,
            data: (data || []).map(normalizeApplicantRow)
        });
    } catch (error) {
        console.error('[Supabase] Applicant fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load applicants.' });
    }
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

function supabaseUnavailable(res) {
    return res.status(503).json({ success: false, message: 'Supabase is not configured on this server.' });
}

function normalizeReportInput(report) {
    if (!report || typeof report !== 'object' || Array.isArray(report)) return null;
    const title = String(report.title || '').trim();
    const category = String(report.type || report.category || '').trim();
    if (!title || !category) return null;

    const details = { ...report };
    delete details.id;
    delete details.photo;

    return {
        title,
        category,
        description: JSON.stringify(details),
        file_url: typeof report.photo === 'string' ? report.photo : null
    };
}

function normalizeProgramInput(program) {
    if (!program || typeof program !== 'object' || Array.isArray(program)) return null;
    const date = String(program.date || '').trim();
    const venue = String(program.venue || '').trim();
    const activityType = String(program.activityType || '').trim();
    const peopleInCharge = String(program.peopleInCharge || '').trim();
    if (!date || !venue || !activityType || !peopleInCharge) return null;

    return {
        program_name: `${activityType} - ${venue}`,
        status: 'Scheduled',
        metrics: {
            date,
            venue,
            activityType,
            peopleInCharge,
            itemsNeeded: String(program.itemsNeeded || ''),
            cost: String(program.cost || '0'),
            notes: String(program.notes || ''),
            createdDate: String(program.createdDate || new Date().toLocaleDateString())
        }
    };
}

app.get('/api/reports', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);

    try {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to load reports:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load reports.' });
        }
        return res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('[Supabase] Reports fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load reports.' });
    }
});

app.post('/api/reports', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const report = normalizeReportInput(req.body);
    if (!report) return res.status(400).json({ success: false, message: 'Report title and type are required.' });

    try {
        const { data, error } = await supabase
            .from('reports')
            .insert([report])
            .select('*')
            .single();
        if (error) {
            console.error('[Supabase] Failed to create report:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to save report.' });
        }
        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Report create error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save report.' });
    }
});

app.put('/api/reports/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const report = normalizeReportInput(req.body);
    if (!report) return res.status(400).json({ success: false, message: 'Report title and type are required.' });

    try {
        const { data, error } = await supabase
            .from('reports')
            .update(report)
            .eq('id', req.params.id)
            .select('*')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to update report:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to update report.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Report not found.' });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Report update error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to update report.' });
    }
});

app.delete('/api/reports/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);

    try {
        const { data, error } = await supabase
            .from('reports')
            .delete()
            .eq('id', req.params.id)
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to delete report:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to delete report.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Report not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Report delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to delete report.' });
    }
});

app.get('/api/programs', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);

    try {
        const { data, error } = await supabase
            .from('program_trackers')
            .select('id, program_name, status, metrics, updated_at')
            .order('updated_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to load programs:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load programs.' });
        }
        return res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('[Supabase] Programs fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load programs.' });
    }
});

app.post('/api/programs', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const program = normalizeProgramInput(req.body);
    if (!program) {
        return res.status(400).json({ success: false, message: 'Date, venue, activity type, and lead are required.' });
    }

    try {
        const { data, error } = await supabase
            .from('program_trackers')
            .insert([program])
            .select('id, program_name, status, metrics, updated_at')
            .single();
        if (error) {
            console.error('[Supabase] Failed to create program:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to save program.' });
        }
        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Program create error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save program.' });
    }
});

app.put('/api/programs/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const program = normalizeProgramInput(req.body);
    if (!program) {
        return res.status(400).json({ success: false, message: 'Date, venue, activity type, and lead are required.' });
    }

    try {
        const { data, error } = await supabase
            .from('program_trackers')
            .update(program)
            .eq('id', req.params.id)
            .select('id, program_name, status, metrics, updated_at')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to update program:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to update program.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Program not found.' });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Program update error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to update program.' });
    }
});

app.delete('/api/programs/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);

    try {
        const { data, error } = await supabase
            .from('program_trackers')
            .delete()
            .eq('id', req.params.id)
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to delete program:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to delete program.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Program not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Program delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to delete program.' });
    }
});

// --- MEETING MINUTES ROUTES ---
app.get('/api/minutes', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);

    try {
        const { data, error } = await supabase
            .from('minutes')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to load meeting minutes:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load meeting minutes.' });
        }
        return res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('[Supabase] Meeting minutes fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load meeting minutes.' });
    }
});

app.post('/api/minutes', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);

    const { date_time, venue, attendees, agenda, file_url, uploaded_by } = req.body || {};
    if (!date_time || !venue || !file_url) {
        return res.status(400).json({ success: false, message: 'Meeting date, venue, and minutes file are required.' });
    }

    try {
        const { data, error } = await supabase
            .from('minutes')
            .insert([{
                date_time,
                venue: String(venue).trim(),
                attendees: String(attendees || ''),
                agenda: String(agenda || ''),
                file_url: String(file_url),
                uploaded_by: String(uploaded_by || req.user.username || 'Authorized Officer').trim()
            }])
            .select('*')
            .single();
        if (error) {
            console.error('[Supabase] Failed to save meeting minutes:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to save meeting minutes.' });
        }
        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Meeting minutes save error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save meeting minutes.' });
    }
});

app.put('/api/minutes/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);

    const { date_time, venue, attendees, agenda, file_url, uploaded_by } = req.body || {};
    if (!date_time || !venue) {
        return res.status(400).json({ success: false, message: 'Meeting date and venue are required.' });
    }

    try {
        const updates = {
            date_time,
            venue: String(venue).trim(),
            attendees: String(attendees || ''),
            agenda: String(agenda || ''),
            uploaded_by: String(uploaded_by || req.user.username || 'Authorized Officer').trim()
        };
        if (typeof file_url === 'string' && file_url) updates.file_url = file_url;

        const { data, error } = await supabase
            .from('minutes')
            .update(updates)
            .eq('id', req.params.id)
            .select('*')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to update meeting minutes:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to update meeting minutes.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Meeting minutes not found.' });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Meeting minutes update error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to update meeting minutes.' });
    }
});

app.delete('/api/minutes/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const clientPin = req.headers['x-vault-pin'];
    if (!clientPin || clientPin !== VAULT_MASTER_PIN) {
        return res.status(403).json({ success: false, message: 'Invalid vault PIN.' });
    }

    try {
        const { data, error } = await supabase
            .from('minutes')
            .delete()
            .eq('id', req.params.id)
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to delete meeting minutes:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to delete meeting minutes.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Meeting minutes not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Meeting minutes delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to delete meeting minutes.' });
    }
});

// --- APPLICANTS ROUTES ---
app.post('/api/applicants', async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const {
        first_name,
        last_name,
        phone,
        email,
        primary_pillar,
        mpesa_reference,
        allocated_account_no
    } = req.body || {};
    if (![first_name, last_name, phone, email, primary_pillar, allocated_account_no].every(value => String(value || '').trim())) {
        return res.status(400).json({ success: false, message: 'Name, phone, email, pillar, and account number are required.' });
    }
    try {
        const { data, error } = await supabase
            .from('applicants')
            .insert([{
                first_name: String(first_name).trim(),
                last_name: String(last_name).trim(),
                phone: String(phone).trim(),
                email: String(email).trim(),
                primary_pillar: String(primary_pillar).trim(),
                mpesa_reference: String(mpesa_reference || '').trim(),
                allocated_account_no: String(allocated_account_no).trim(),
                status: String(mpesa_reference || '').trim() ? 'Awaiting Verification' : 'Pending Review',
                registration_fee: 1000
            }])
            .select('*')
            .single();
        if (error) {
            console.error('[Supabase] Failed to save applicant:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to save applicant.' });
        }
        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Applicant save error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save applicant.' });
    }
});

const applicantStatuses = new Set([
    'Pending Review',
    'Awaiting Verification',
    'Password Setup Email Sent',
    'Approved Active'
]);

function normalizeApplicantRow(row) {
    return {
        id: row.id,
        firstName: row.first_name || '',
        lastName: row.last_name || '',
        name: [row.first_name, row.last_name].filter(Boolean).join(' '),
        email: row.email || '',
        phone: row.phone || '',
        accountNumber: row.allocated_account_no || '',
        pillar: row.primary_pillar || '',
        mpesaRef: row.mpesa_reference || '',
        paymentStatus: row.mpesa_reference ? 'Paid' : 'Pending',
        status: row.status || 'Pending Review',
        amountPaid: Number(row.registration_fee || 0),
        dateSubmitted: row.created_at ? new Date(row.created_at).toLocaleDateString() : ''
    };
}

app.put('/api/admin/applicants/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const { status } = req.body || {};
    if (!applicantStatuses.has(status)) {
        return res.status(400).json({ success: false, message: 'Invalid applicant status.' });
    }
    try {
        const { data, error } = await supabase
            .from('applicants')
            .update({ status })
            .eq('id', req.params.id)
            .select('id,status')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to update applicant status:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to update applicant status.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Applicant not found.' });
        return res.json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Applicant status update error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to update applicant status.' });
    }
});

app.post('/api/admin/applicants/:id/password-setup-link', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('applicants')
            .update({ status: 'Password Setup Email Sent' })
            .eq('id', req.params.id)
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to prepare applicant password setup:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to prepare password setup link.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Applicant not found.' });

        const setupToken = jwt.sign(
            { purpose: 'member-password-setup', applicantId: data.id },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.json({ success: true, setupToken });
    } catch (error) {
        console.error('[Supabase] Applicant password setup error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to prepare password setup link.' });
    }
});

app.get('/api/applicants/password-setup/:token', async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    let decoded;
    try {
        decoded = jwt.verify(req.params.token, JWT_SECRET);
    } catch {
        return res.status(400).json({ success: false, message: 'This password setup link is invalid or expired.' });
    }
    if (decoded.purpose !== 'member-password-setup' || !decoded.applicantId) {
        return res.status(400).json({ success: false, message: 'This password setup link is invalid or expired.' });
    }
    try {
        const { data, error } = await supabase
            .from('applicants')
            .select('*')
            .eq('id', decoded.applicantId)
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to resolve password setup applicant:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to validate password setup link.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Applicant not found.' });
        if (data.status !== 'Password Setup Email Sent') {
            return res.status(400).json({ success: false, message: 'This password setup link is no longer active.' });
        }
        return res.json({ success: true, data: normalizeApplicantRow(data) });
    } catch (error) {
        console.error('[Supabase] Password setup lookup error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to validate password setup link.' });
    }
});

app.post('/api/applicants/password-setup/complete', async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    let decoded;
    try {
        decoded = jwt.verify(req.body?.token, JWT_SECRET);
    } catch {
        return res.status(400).json({ success: false, message: 'This password setup link is invalid or expired.' });
    }
    if (decoded.purpose !== 'member-password-setup' || !decoded.applicantId) {
        return res.status(400).json({ success: false, message: 'This password setup link is invalid or expired.' });
    }
    try {
        const { data, error } = await supabase
            .from('applicants')
            .update({ status: 'Approved Active' })
            .eq('id', decoded.applicantId)
            .eq('status', 'Password Setup Email Sent')
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to complete applicant password setup:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to complete password setup.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Applicant not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Password setup completion error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to complete password setup.' });
    }
});

app.delete('/api/admin/applicants/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('applicants')
            .delete()
            .eq('id', req.params.id)
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to delete applicant:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to delete applicant.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Applicant not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Applicant delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to delete applicant.' });
    }
});

// --- MEMBER DOCUMENTS ROUTES ---
const MEMBER_DOCUMENTS_BUCKET = process.env.SUPABASE_MEMBER_DOCUMENTS_BUCKET || 'member-documents';
const MEMBER_DOCUMENT_KEYS = ['idCard', 'cv', 'certificates', 'passportPhoto', 'otherDocs'];
const MEMBER_DOCUMENT_LABELS = {
    idCard: 'ID Card',
    cv: 'CV',
    certificates: 'Certificates',
    passportPhoto: 'Passport Photo',
    otherDocs: 'Other Documents'
};
const MEMBER_DOCUMENT_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
]);
const MAX_MEMBER_DOCUMENT_FILE_BYTES = 5 * 1024 * 1024;
const MAX_MEMBER_DOCUMENT_TOTAL_BYTES = 10 * 1024 * 1024;

function parseMemberDocumentPaths(value) {
    if (typeof value !== 'string') return {};
    try {
        const parsed = JSON.parse(value);
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
        return {};
    }
}

function parseRequiredMemberDocuments(value) {
    if (typeof value !== 'string') return { documents: '', notes: '' };
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return {
                documents: Array.isArray(parsed.documents) ? parsed.documents.join(', ') : '',
                notes: typeof parsed.notes === 'string' ? parsed.notes : ''
            };
        }
    } catch {
        return { documents: value, notes: '' };
    }
    return { documents: value, notes: '' };
}

function safeMemberDocumentName(name) {
    const basename = path.basename(String(name || 'document').replace(/\\/g, '/'));
    return basename.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120) || 'document';
}

function parseMemberDocumentDataUrl(file) {
    const match = typeof file?.data === 'string'
        ? file.data.match(/^data:([^;,]+);base64,([A-Za-z0-9+/]+={0,2})$/)
        : null;
    if (!match || !MEMBER_DOCUMENT_MIME_TYPES.has(match[1])) {
        throw new Error(`Unsupported file type for ${safeMemberDocumentName(file?.name)}.`);
    }
    const buffer = Buffer.from(match[2], 'base64');
    if (!buffer.length || buffer.length > MAX_MEMBER_DOCUMENT_FILE_BYTES) {
        throw new Error(`${safeMemberDocumentName(file?.name)} must be between 1 byte and 5 MB.`);
    }
    return { buffer, contentType: match[1], name: safeMemberDocumentName(file.name) };
}

app.get('/api/member-documents', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('member_documents')
            .select('*')
            .order('submitted_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to load member documents:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load member documents.' });
        }

        const documents = await Promise.all((data || []).map(async row => {
            const paths = parseMemberDocumentPaths(row.file_url);
            const files = {};
            await Promise.all(MEMBER_DOCUMENT_KEYS.map(async key => {
                const item = paths[key];
                if (!item || typeof item.path !== 'string') return;
                const { data: signed, error: signError } = await supabase.storage
                    .from(MEMBER_DOCUMENTS_BUCKET)
                    .createSignedUrl(item.path, 10 * 60, { download: item.name || true });
                if (signError) throw signError;
                files[key] = { name: item.name || MEMBER_DOCUMENT_LABELS[key], data: signed.signedUrl };
            }));
            const required = parseRequiredMemberDocuments(row.required_documents);
            return {
                id: row.id,
                memberName: row.member_name || '',
                memberEmail: row.email_or_id || '',
                submittedAt: row.submitted_at || '',
                requiredDocuments: required.documents,
                notes: required.notes,
                files
            };
        }));
        return res.json({ success: true, data: documents });
    } catch (error) {
        console.error('[Supabase] Member documents fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load member documents.' });
    }
});

app.post('/api/member-documents', async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const { member_name, email_or_id, notes, files } = req.body || {};
    if (!String(member_name || '').trim() || !String(email_or_id || '').trim() || !files || typeof files !== 'object') {
        return res.status(400).json({ success: false, message: 'Member name, email or ID, and document files are required.' });
    }
    const parsedFiles = {};
    let totalBytes = 0;
    try {
        for (const key of MEMBER_DOCUMENT_KEYS) {
            if (!files[key]) {
                if (key !== 'otherDocs') throw new Error(`The ${MEMBER_DOCUMENT_LABELS[key]} file is required.`);
                continue;
            }
            parsedFiles[key] = parseMemberDocumentDataUrl(files[key]);
            totalBytes += parsedFiles[key].buffer.length;
        }
        if (totalBytes > MAX_MEMBER_DOCUMENT_TOTAL_BYTES) {
            return res.status(413).json({ success: false, message: 'All uploaded files together must be 10 MB or smaller.' });
        }
    } catch (error) {
        return res.status(400).json({ success: false, message: error.message });
    }

    const uploadedPaths = [];
    const bundleId = crypto.randomUUID();
    try {
        const paths = {};
        for (const [key, file] of Object.entries(parsedFiles)) {
            const storagePath = `${bundleId}/${key}-${file.name}`;
            const { error } = await supabase.storage
                .from(MEMBER_DOCUMENTS_BUCKET)
                .upload(storagePath, file.buffer, { contentType: file.contentType, upsert: false });
            if (error) throw error;
            uploadedPaths.push(storagePath);
            paths[key] = { path: storagePath, name: file.name };
        }

        const requiredDocuments = JSON.stringify({
            documents: Object.keys(parsedFiles).map(key => MEMBER_DOCUMENT_LABELS[key]),
            notes: String(notes || '').trim()
        });
        const { data, error } = await supabase
            .from('member_documents')
            .insert([{
                member_name: String(member_name).trim(),
                email_or_id: String(email_or_id).trim(),
                required_documents: requiredDocuments,
                file_url: JSON.stringify(paths)
            }])
            .select('id,member_name,email_or_id,required_documents,submitted_at')
            .single();
        if (error) throw error;
        return res.status(201).json({ success: true, data });
    } catch (error) {
        if (uploadedPaths.length) {
            const { error: cleanupError } = await supabase.storage.from(MEMBER_DOCUMENTS_BUCKET).remove(uploadedPaths);
            if (cleanupError) console.error('[Supabase] Failed to clean up an incomplete member-document upload:', cleanupError.message);
        }
        console.error('[Supabase] Failed to save member documents:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save member documents.' });
    }
});

app.delete('/api/member-documents/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data: row, error: fetchError } = await supabase
            .from('member_documents')
            .select('id,file_url')
            .eq('id', req.params.id)
            .maybeSingle();
        if (fetchError) throw fetchError;
        if (!row) return res.status(404).json({ success: false, message: 'Member document submission not found.' });

        const { error: deleteError } = await supabase
            .from('member_documents')
            .delete()
            .eq('id', req.params.id);
        if (deleteError) throw deleteError;

        const paths = Object.values(parseMemberDocumentPaths(row.file_url))
            .map(item => item && item.path)
            .filter(value => typeof value === 'string');
        if (paths.length) {
            const { error: storageError } = await supabase.storage.from(MEMBER_DOCUMENTS_BUCKET).remove(paths);
            if (storageError) {
                console.error('[Supabase] Submission was deleted but file cleanup failed:', storageError.message);
                return res.status(500).json({ success: false, message: 'Submission deleted, but its stored files could not be removed.' });
            }
        }
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Member document deletion error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to delete member documents.' });
    }
});

// --- EXPENDITURES & FINANCE ROUTES ---
app.get('/api/finance/sales', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('finance_sales')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to load finance sales:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load sales.' });
        }
        return res.json({
            success: true,
            data: (data || []).map(row => ({
                id: row.id,
                item: row.item,
                qty: row.quantity,
                cash: Number(row.amount),
                status: row.status,
                createdAt: row.created_at
            }))
        });
    } catch (error) {
        console.error('[Supabase] Finance sales fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load sales.' });
    }
});

app.post('/api/finance/sales', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const { item, quantity, amount } = req.body || {};
    const numericAmount = Number(amount);
    if (!String(item || '').trim() || !String(quantity || '').trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ success: false, message: 'An item, quantity, and positive revenue amount are required.' });
    }
    try {
        const { data, error } = await supabase
            .from('finance_sales')
            .insert([{
                item: String(item).trim(),
                quantity: String(quantity).trim(),
                amount: numericAmount,
                status: 'Completed'
            }])
            .select('*')
            .single();
        if (error) {
            console.error('[Supabase] Failed to save finance sale:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to save sale.' });
        }
        return res.status(201).json({
            success: true,
            data: {
                id: data.id,
                item: data.item,
                qty: data.quantity,
                cash: Number(data.amount),
                status: data.status,
                createdAt: data.created_at
            }
        });
    } catch (error) {
        console.error('[Supabase] Finance sale save error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save sale.' });
    }
});

app.delete('/api/finance/sales/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('finance_sales')
            .delete()
            .eq('id', req.params.id)
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to delete finance sale:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to delete sale.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Sale not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Finance sale delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to delete sale.' });
    }
});

app.get('/api/finance/accounts/:accountKey', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    if (req.params.accountKey !== 'bank') {
        return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    try {
        const { data, error } = await supabase
            .from('treasury')
            .select('id,balance,updated_at')
            .eq('id', 1)
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to load finance account:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load account balance.' });
        }
        return res.json({
            success: true,
            data: {
                accountKey: req.params.accountKey,
                balance: data ? Number(data.balance) : null,
                updatedAt: data?.updated_at || null
            }
        });
    } catch (error) {
        console.error('[Supabase] Finance account fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load account balance.' });
    }
});

app.put('/api/finance/accounts/:accountKey', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    if (req.params.accountKey !== 'bank') {
        return res.status(404).json({ success: false, message: 'Account not found.' });
    }
    const balance = Number(req.body?.balance);
    if (!Number.isFinite(balance) || balance < 0) {
        return res.status(400).json({ success: false, message: 'Enter a valid non-negative balance.' });
    }
    try {
        const { data, error } = await supabase
            .from('treasury')
            .upsert({ id: 1, balance }, { onConflict: 'id' })
            .select('id,balance,updated_at')
            .single();
        if (error) {
            console.error('[Supabase] Failed to save finance account:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to save account balance.' });
        }
        return res.json({
            success: true,
            data: { accountKey: req.params.accountKey, balance: Number(data.balance), updatedAt: data.updated_at }
        });
    } catch (error) {
        console.error('[Supabase] Finance account save error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save account balance.' });
    }
});

app.get('/api/expenditures', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('expenditures')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) {
            console.error('[Supabase] Failed to load expenditures:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load expenditures.' });
        }
        return res.json({
            success: true,
            data: (data || []).map(row => ({
                id: row.id,
                desc: row.description || '',
                cat: row.category || 'General',
                cash: Number(row.amount || 0),
                createdAt: row.created_at || ''
            }))
        });
    } catch (error) {
        console.error('[Supabase] Expenditure fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load expenditures.' });
    }
});

app.post('/api/expenditures', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const { description, category, amount } = req.body || {};
    const numericAmount = Number(amount);
    if (!String(description || '').trim() || !String(category || '').trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({ success: false, message: 'A description, category, and positive amount are required.' });
    }
    try {
        const { data, error } = await supabase
            .from('expenditures')
            .insert([{
                description: String(description).trim(),
                category: String(category).trim(),
                amount: numericAmount
            }])
            .select('*')
            .single();
        if (error) {
            console.error('[Supabase] Failed to save expenditure:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to save expenditure.' });
        }
        return res.status(201).json({
            success: true,
            data: {
                id: data.id,
                desc: data.description || '',
                cat: data.category || 'General',
                cash: Number(data.amount || 0),
                createdAt: data.created_at || ''
            }
        });
    } catch (error) {
        console.error('[Supabase] Expenditure save error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to save expenditure.' });
    }
});

app.delete('/api/expenditures/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('expenditures')
            .delete()
            .eq('id', req.params.id)
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to delete expenditure:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to delete expenditure.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Expenditure not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Expenditure delete error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to delete expenditure.' });
    }
});

// --- TREASURY / BANK BALANCE ROUTES ---
app.get('/api/treasury', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('treasury')
      .select('*')
      .order('id', { ascending: false })
      .limit(1);
    if (error) throw error;
    res.json(data[0] || { balance: 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/treasury', async (req, res) => {
  try {
    const { balance } = req.body;
    const { data, error } = await supabase
      .from('treasury')
      .insert([{ balance }]);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// --- AUTHORIZED LOGIN USERS ROUTES ---
app.get('/api/authorized-users', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('authorized_users')
            .select('id,username,created_at')
            .order('created_at', { ascending: true });
        if (error) {
            console.error('[Supabase] Failed to load authorized users:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to load authorized users.' });
        }
        return res.json({ success: true, data: data || [] });
    } catch (error) {
        console.error('[Supabase] Authorized user fetch error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to load authorized users.' });
    }
});

app.post('/api/authorized-users', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    const username = String(req.body?.username || '').trim();
    if (!username || username.length > 100) {
        return res.status(400).json({ success: false, message: 'Enter a username of 1 to 100 characters.' });
    }
    if (DB_USERS.some(user => user.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({ success: false, message: 'This username is already authorized.' });
    }
    try {
        const { data: existing, error: lookupError } = await supabase
            .from('authorized_users')
            .select('id,username')
            .ilike('username', username);
        if (lookupError) {
            console.error('[Supabase] Failed to check authorized username:', lookupError.message);
            return res.status(500).json({ success: false, message: 'Unable to check authorized users.' });
        }
        if ((existing || []).some(user => user.username.toLowerCase() === username.toLowerCase())) {
            return res.status(409).json({ success: false, message: 'This username is already authorized.' });
        }
        const { data, error } = await supabase
            .from('authorized_users')
            .insert([{ username }])
            .select('id,username,created_at')
            .single();
        if (error) {
            console.error('[Supabase] Failed to add authorized user:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to add authorized user.' });
        }
        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('[Supabase] Authorized user insert error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to add authorized user.' });
    }
});

app.delete('/api/authorized-users/:id', requireAuth, requireRole('Super Admin'), async (req, res) => {
    if (!supabase.isConfigured) return supabaseUnavailable(res);
    try {
        const { data, error } = await supabase
            .from('authorized_users')
            .delete()
            .eq('id', req.params.id)
            .select('id')
            .maybeSingle();
        if (error) {
            console.error('[Supabase] Failed to remove authorized user:', error.message);
            return res.status(500).json({ success: false, message: 'Unable to remove authorized user.' });
        }
        if (!data) return res.status(404).json({ success: false, message: 'Authorized user not found.' });
        return res.json({ success: true });
    } catch (error) {
        console.error('[Supabase] Authorized user deletion error:', error.message);
        return res.status(500).json({ success: false, message: 'Unable to remove authorized user.' });
    }
});
