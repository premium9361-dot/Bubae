import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface DeviceSession {
  id: string;
  userId: string;
  sessionTokenId: string;
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
  isRevoked: boolean;
  createdAt: string;
  lastActiveAt: string;
}

const STORAGE_KEY_SESSIONS = 'bubae_admin_sessions_v1';
const STORAGE_KEY_CURRENT_SESSION = 'bubae_admin_session_token_id';
const STORAGE_KEY_REVOKED_TOKENS = 'bubae_revoked_session_tokens_v1';

function getRevokedTokenSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REVOKED_TOKENS);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function addRevokedToken(tokenId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const set = getRevokedTokenSet();
    set.add(tokenId);
    localStorage.setItem(STORAGE_KEY_REVOKED_TOKENS, JSON.stringify(Array.from(set)));
    // Trigger storage event for other tabs/windows
    localStorage.setItem('bubae_session_revocation_event', JSON.stringify({ tokenId, timestamp: Date.now() }));
    window.dispatchEvent(new CustomEvent('bubae_device_revoked', { detail: { tokenId } }));
  } catch (err) {
    console.warn('Failed to record revoked token:', err);
  }
}

/**
 * Accurately parses non-sensitive device info from navigator.userAgent
 */
export function detectDeviceInfo(): {
  deviceType: 'Desktop' | 'Mobile' | 'Tablet';
  browser: string;
  os: string;
} {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { deviceType: 'Desktop', browser: 'Web Browser', os: 'Desktop OS' };
  }

  const ua = navigator.userAgent;

  // OS detection
  let os = 'Unknown OS';
  if (/Windows NT 10.0|Windows NT 11.0/i.test(ua)) os = 'Windows';
  else if (/Windows NT/i.test(ua)) os = 'Windows';
  else if (/iPad/i.test(ua) || (navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /Macintosh/i.test(ua))) {
    os = 'iPadOS';
  } else if (/iPhone|iPod/i.test(ua)) {
    os = 'iOS';
  } else if (/Android/i.test(ua)) {
    os = 'Android';
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'macOS';
  } else if (/CrOS/i.test(ua)) {
    os = 'ChromeOS';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux';
  }

  // Device type
  let deviceType: 'Desktop' | 'Mobile' | 'Tablet' = 'Desktop';
  if (/iPad|Tablet/i.test(ua) || os === 'iPadOS') {
    deviceType = 'Tablet';
  } else if (/Mobile|Android|iPhone|iPod/i.test(ua)) {
    deviceType = 'Mobile';
  }

  // Browser detection
  let browser = 'Chrome';
  if (/Edg\//i.test(ua)) {
    browser = 'Microsoft Edge';
  } else if (/Chrome\//i.test(ua) && !/Chromium|Edg/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome|Chromium|Edg/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
  } else if (/Opera|OPR\//i.test(ua)) {
    browser = 'Opera';
  }

  return { deviceType, browser, os };
}

/**
 * Returns or generates a unique, non-sensitive identifier for this browser/device instance.
 */
export function getOrCreateClientSessionId(): string {
  if (typeof window === 'undefined') return 'sess_default';
  let id = localStorage.getItem(STORAGE_KEY_CURRENT_SESSION);
  if (!id) {
    id = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, id);
  }
  return id;
}

export function getCurrentSessionTokenId(): string {
  return getOrCreateClientSessionId();
}

/**
 * Gets local mirror of sessions
 */
function getLocalSessions(): DeviceSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSIONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSessions(sessions: DeviceSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch (err) {
    console.warn('Failed to save local session mirror:', err);
  }
}

/**
 * Registers an active session upon successful login.
 */
export async function recordAdminSession(userId: string): Promise<DeviceSession> {
  let sessionTokenId = getOrCreateClientSessionId();
  const revokedSet = getRevokedTokenSet();

  // If this device was previously revoked, generate a fresh clean session token
  if (revokedSet.has(sessionTokenId)) {
    sessionTokenId = 'sess_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CURRENT_SESSION, sessionTokenId);
    }
  }

  const info = detectDeviceInfo();
  const now = new Date().toISOString();

  const newSession: DeviceSession = {
    id: 'dev_' + Math.random().toString(36).substring(2, 9),
    userId,
    sessionTokenId,
    deviceType: info.deviceType,
    browser: info.browser,
    os: info.os,
    isRevoked: false,
    createdAt: now,
    lastActiveAt: now,
  };

  // 1. Update local storage mirror
  const existing = getLocalSessions().filter(s => s.sessionTokenId !== sessionTokenId);
  saveLocalSessions([newSession, ...existing]);

  // 2. Sync with Supabase if table is provisioned
  if (isSupabaseConfigured) {
    try {
      await supabase.from('admin_sessions').upsert({
        user_id: userId,
        session_token_id: sessionTokenId,
        device_type: info.deviceType,
        browser: info.browser,
        os: info.os,
        is_revoked: false,
        last_active_at: now,
      }, { onConflict: 'session_token_id' });
    } catch (err) {
      console.warn('Supabase admin session recording note:', err);
    }
  }

  return newSession;
}

/**
 * Updates last active timestamp for this session
 */
export async function updateSessionHeartbeat(userId: string): Promise<void> {
  const sessionTokenId = getOrCreateClientSessionId();
  const now = new Date().toISOString();

  const sessions = getLocalSessions();
  const updated = sessions.map(s => {
    if (s.sessionTokenId === sessionTokenId) {
      return { ...s, lastActiveAt: now };
    }
    return s;
  });
  saveLocalSessions(updated);

  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('admin_sessions')
        .update({ last_active_at: now })
        .eq('session_token_id', sessionTokenId);
    } catch {
      // non-critical heartbeat
    }
  }
}

/**
 * Checks whether the current session has been revoked by another device.
 */
export async function isCurrentSessionRevoked(userId: string): Promise<boolean> {
  const sessionTokenId = getOrCreateClientSessionId();

  // Fast check: revoked token set
  const revokedSet = getRevokedTokenSet();
  if (revokedSet.has(sessionTokenId)) {
    return true;
  }

  // Check Supabase if configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('is_revoked')
        .eq('session_token_id', sessionTokenId)
        .single();

      if (!error && data) {
        if (Boolean(data.is_revoked)) {
          addRevokedToken(sessionTokenId);
          return true;
        }
        return false;
      }
    } catch {
      // fallback to local mirror
    }
  }

  const sessions = getLocalSessions();
  const match = sessions.find(s => s.sessionTokenId === sessionTokenId);
  return match ? match.isRevoked : false;
}

/**
 * Fetches all non-revoked sessions for this user.
 */
export async function fetchActiveSessions(userId: string): Promise<DeviceSession[]> {
  const currentTokenId = getOrCreateClientSessionId();
  const revokedSet = getRevokedTokenSet();
  let results: DeviceSession[] = [];

  // Try Supabase first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('admin_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_revoked', false)
        .order('last_active_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        results = data
          .filter((d: any) => !revokedSet.has(d.session_token_id))
          .map((d: any) => ({
            id: d.id,
            userId: d.user_id,
            sessionTokenId: d.session_token_id,
            deviceType: d.device_type,
            browser: d.browser,
            os: d.os,
            isRevoked: Boolean(d.is_revoked),
            createdAt: d.created_at,
            lastActiveAt: d.last_active_at,
          }));
      }
    } catch (err) {
      console.warn('Fallback to local session list:', err);
    }
  }

  // If Supabase didn't return, use local mirror
  if (results.length === 0) {
    results = getLocalSessions().filter(s => s.userId === userId && !s.isRevoked && !revokedSet.has(s.sessionTokenId));
  }

  // Ensure current device is represented if user is logged in
  const hasCurrent = results.some(s => s.sessionTokenId === currentTokenId);
  if (!hasCurrent && !revokedSet.has(currentTokenId)) {
    const info = detectDeviceInfo();
    const now = new Date().toISOString();
    const currentDeviceSession: DeviceSession = {
      id: 'current_session',
      userId,
      sessionTokenId: currentTokenId,
      deviceType: info.deviceType,
      browser: info.browser,
      os: info.os,
      isRevoked: false,
      createdAt: now,
      lastActiveAt: now,
    };
    results = [currentDeviceSession, ...results];
    saveLocalSessions(results);
  }

  // Sort so current device is always first
  return results.sort((a, b) => {
    if (a.sessionTokenId === currentTokenId) return -1;
    if (b.sessionTokenId === currentTokenId) return 1;
    return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
  });
}

/**
 * Revokes an individual session
 */
export async function revokeSession(sessionTokenId: string): Promise<void> {
  // 1. Add to permanent revoked tokens registry and broadcast
  addRevokedToken(sessionTokenId);

  // 2. Update local mirror
  const sessions = getLocalSessions().map(s => {
    if (s.sessionTokenId === sessionTokenId) {
      return { ...s, isRevoked: true };
    }
    return s;
  });
  saveLocalSessions(sessions);

  // 3. Update Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('admin_sessions')
        .update({ is_revoked: true })
        .eq('session_token_id', sessionTokenId);
    } catch (err) {
      console.warn('Supabase revoke session note:', err);
    }
  }
}

/**
 * Revokes all sessions EXCEPT the current device
 */
export async function logoutAllOtherDevices(userId: string): Promise<void> {
  const currentTokenId = getOrCreateClientSessionId();

  // 1. Gather all other session token IDs to mark as revoked
  const sessions = getLocalSessions();
  sessions.forEach(s => {
    if (s.sessionTokenId !== currentTokenId) {
      addRevokedToken(s.sessionTokenId);
    }
  });

  // 2. Update local mirror
  const updatedSessions = sessions.map(s => {
    if (s.userId === userId && s.sessionTokenId !== currentTokenId) {
      return { ...s, isRevoked: true };
    }
    return s;
  });
  saveLocalSessions(updatedSessions);

  // 3. Update Supabase
  if (isSupabaseConfigured) {
    try {
      await supabase
        .from('admin_sessions')
        .update({ is_revoked: true })
        .eq('user_id', userId)
        .neq('session_token_id', currentTokenId);
    } catch (err) {
      console.warn('Supabase revoke other sessions note:', err);
    }
  }
}

/**
 * Formats relative time (e.g. "Active now", "5 minutes ago", "2 hours ago")
 */
export function formatRelativeTime(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 2) return 'Active now';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    if (diffHour === 1) return '1 hour ago';
    if (diffHour < 24) return `${diffHour} hours ago`;
    if (diffDay === 1) return 'Yesterday';
    return `${diffDay} days ago`;
  } catch {
    return 'Recently';
  }
}
