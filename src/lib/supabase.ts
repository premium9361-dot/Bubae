import { createClient } from '@supabase/supabase-js';

// Safe URL normalizer to prevent "Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL"
function normalizeSupabaseUrl(rawUrl?: string): string {
  const fallback = 'https://gewdfuwqtnnovascvmmq.supabase.co';
  if (!rawUrl || typeof rawUrl !== 'string') {
    return fallback;
  }
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed === 'YOUR_SUPABASE_URL' || trimmed.startsWith('YOUR_')) {
    return fallback;
  }
  const candidate = trimmed.startsWith('http://') || trimmed.startsWith('https://')
    ? trimmed
    : `https://${trimmed}`;

  try {
    const parsed = new URL(candidate);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return candidate;
    }
  } catch {
    // Fall back to known valid URL
  }
  return fallback;
}

const rawEnvUrl = import.meta.env.VITE_SUPABASE_URL;
const rawEnvKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl = normalizeSupabaseUrl(rawEnvUrl);
const supabaseAnonKey = (rawEnvKey && typeof rawEnvKey === 'string' && rawEnvKey.trim()) ? rawEnvKey.trim() : '';

// Validates whether genuine production credentials are configured
export const isSupabaseConfigured = Boolean(
  rawEnvUrl &&
  !rawEnvUrl.startsWith('YOUR_') &&
  supabaseAnonKey &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY' &&
  !supabaseAnonKey.startsWith('YOUR_') &&
  supabaseAnonKey.length > 20
);

// Guaranteed safe client initialization that never throws
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'dummy-anon-key-bubaestore',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

