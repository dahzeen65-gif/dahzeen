const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
        }
    });
} else {
    console.warn('[Supabase] Missing SUPABASE_URL or SUPABASE_KEY. Database sync is disabled until environment values are configured.');
}

module.exports = supabase;
module.exports.isConfigured = Boolean(supabaseUrl && supabaseKey);