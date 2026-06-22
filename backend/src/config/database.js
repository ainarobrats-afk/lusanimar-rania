import env from './env.js';

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY;

// Lazy Supabase client — only created if valid URL is provided
let _supabase = null;

async function createSupabaseClient() {
  const { createClient } = await import('@supabase/supabase-js');
  return createClient(supabaseUrl, supabaseKey);
}

// Mock supabase for development when no real URL is configured
const mockSupabase = {
  from: () => ({
    select: () => ({
      limit: () => Promise.resolve({ data: [], error: null }),
      eq: () => ({ limit: () => Promise.resolve({ data: [], error: null }), single: () => Promise.resolve({ data: null, error: null }) }),
      single: () => Promise.resolve({ data: null, error: null }),
    }),
    insert: () => ({ select: () => ({ limit: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) }) }),
    update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: {}, error: null }) }) }) }),
    delete: () => ({ eq: () => Promise.resolve({ error: null }) }),
  }),
};

export async function getSupabase() {
  if (_supabase) return _supabase;
  if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase.co')) {
    _supabase = await createSupabaseClient();
  } else {
    _supabase = mockSupabase;
  }
  return _supabase;
}

// Export a proxy that works synchronously (will be replaced on connect)
export const supabase = mockSupabase;

export async function connectDB() {
  if (!supabaseUrl || !supabaseKey || !supabaseUrl.includes('supabase.co')) {
    console.warn('Supabase not configured; using mock DB for development.');
    return;
  }

  try {
    const client = await getSupabase();
    const { data, error } = await client.from('users').select('id').limit(1);
    if (error) {
      console.error('Supabase connection test failed:', error.message || error);
    } else {
      console.log('Connected to Supabase:', supabaseUrl);
    }
  } catch (err) {
    console.error('Supabase connection error:', err);
  }
}

export default supabase;
