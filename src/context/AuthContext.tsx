import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { AdminUser } from '../types';
import {
  recordAdminSession,
  isCurrentSessionRevoked,
  revokeSession,
  getCurrentSessionTokenId,
  updateSessionHeartbeat,
} from '../services/sessionTracker';
import { checkLoginRateLimit, recordFailedLoginAttempt, resetLoginAttempts } from '../lib/security';

interface AuthContextType {
  user: AdminUser | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_ADMIN_SESSION_KEY = 'bubae_admin_session_auth_v5';
const LOCAL_ADMIN_HASH_KEY = 'bubae_admin_pwd_hash_v5';
const LOCAL_ADMIN_SALT = 'bubae_studio_auth_salt_v1_';

// Initial cryptographic one-way salted hash for administrator BUBAE2008
// (Plaintext password is never hardcoded in source code or sent to client)
const INITIAL_ADMIN_HASH = 'f703895fee6b420083b3743758327280e7e2f7dffa7d1b90d076ac784a4e9940';

async function computeSha256(password: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(LOCAL_ADMIN_SALT + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkRevocation = useCallback(async (userId: string) => {
    try {
      const revoked = await isCurrentSessionRevoked(userId);
      if (revoked) {
        // Current device was revoked by another device
        localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
        if (isSupabaseConfigured) {
          await supabase.auth.signOut().catch(() => {});
        }
        setUser(null);
        setError('Your session was revoked from another device. Please log in again.');
      } else {
        await updateSessionHeartbeat(userId);
      }
    } catch {
      // heartbeat check
    }
  }, []);

  useEffect(() => {
    // 1. Check local session persistence
    const savedSession = localStorage.getItem(LOCAL_ADMIN_SESSION_KEY);
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed && parsed.role === 'admin') {
          setUser(parsed);
          checkRevocation(parsed.id);
        }
      } catch {
        localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
      }
    }

    // 2. Check active Supabase session if configured
    if (isSupabaseConfigured) {
      async function checkSupabaseSession() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            await verifyAdminRole(session.user.id, session.user.email || '');
          } else if (!savedSession) {
            setUser(null);
          }
        } catch (err: any) {
          console.warn('Supabase session verification notice:', err);
        } finally {
          setLoading(false);
        }
      }

      checkSupabaseSession();

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          await verifyAdminRole(session.user.id, session.user.email || '');
        } else {
          const activeLocal = localStorage.getItem(LOCAL_ADMIN_SESSION_KEY);
          if (!activeLocal) {
            setUser(null);
          }
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      setLoading(false);
    }
  }, [checkRevocation]);

  // Periodic heartbeat and revocation check with cross-tab event listeners
  useEffect(() => {
    if (!user) return;

    const handleCheck = () => {
      checkRevocation(user.id);
    };

    // Check immediately
    handleCheck();

    // Fast periodic check
    const interval = setInterval(handleCheck, 3000);

    // Listen to storage changes across tabs/windows
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === 'bubae_session_revocation_event' ||
        e.key === 'bubae_revoked_session_tokens_v1' ||
        e.key === 'bubae_admin_sessions_v1'
      ) {
        handleCheck();
      }
    };

    const handleCustomRevoke = () => {
      handleCheck();
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleCheck();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('bubae_device_revoked', handleCustomRevoke);
    window.addEventListener('focus', handleCheck);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('bubae_device_revoked', handleCustomRevoke);
      window.removeEventListener('focus', handleCheck);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, checkRevocation]);

  async function verifyAdminRole(userId: string, email: string) {
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (!profileErr && profile?.role === 'admin') {
        const adminUser: AdminUser = {
          id: userId,
          email,
          username: email.toLowerCase().includes('bubae2008') ? 'BUBAE2008' : (email.split('@')[0] || 'BUBAE2008'),
          role: 'admin',
        };
        setUser(adminUser);
        localStorage.setItem(LOCAL_ADMIN_SESSION_KEY, JSON.stringify(adminUser));
      } else {
        setUser(null);
        localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
        setError('Access denied: Administrator privileges required.');
      }
    } catch {
      setUser(null);
    }
  }

  const signIn = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier || !password) {
      const err = 'Please enter both username and password.';
      setError(err);
      return { success: false, error: err };
    }

    // Rate Limiting & Lockout Check
    const rateCheck = checkLoginRateLimit(cleanIdentifier);
    if (rateCheck.isLocked) {
      const lockMsg = `Too many failed attempts. For your security, this account is temporarily locked for ${rateCheck.remainingSeconds || 60} seconds.`;
      setError(lockMsg);
      return { success: false, error: lockMsg };
    }

    setLoading(true);

    const normalizedUser = cleanIdentifier.toLowerCase();
    const mappedEmail = cleanIdentifier.includes('@')
      ? cleanIdentifier.toLowerCase()
      : `${normalizedUser}@bubae.com`;

    // 1. Production Supabase Auth flow
    if (isSupabaseConfigured) {
      try {
        const { data, error: authError } = await supabase.auth.signInWithPassword({
          email: mappedEmail,
          password,
        });

        if (!authError && data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profile?.role === 'admin') {
            const adminUser: AdminUser = {
              id: data.user.id,
              email: data.user.email || mappedEmail,
              username: normalizedUser === 'bubae2008' ? 'BUBAE2008' : (cleanIdentifier || 'BUBAE2008'),
              role: 'admin',
            };
            setUser(adminUser);
            localStorage.setItem(LOCAL_ADMIN_SESSION_KEY, JSON.stringify(adminUser));
            await recordAdminSession(adminUser.id);
            resetLoginAttempts(cleanIdentifier);
            setLoading(false);
            return { success: true };
          } else {
            await supabase.auth.signOut();
            setLoading(false);
            recordFailedLoginAttempt(cleanIdentifier);
            const msg = 'Unauthorized: Administrator privileges required for Bubaé Studio.';
            setError(msg);
            return { success: false, error: msg };
          }
        }
      } catch (err: any) {
        console.warn('Supabase auth attempt:', err);
      }
    }

    // 2. Cryptographic one-way salted hash authentication
    // Verifies against stored one-way hash without hardcoded passwords
    const isValidAdminIdentifier =
      normalizedUser === 'bubae2008' ||
      normalizedUser === 'bubae2008@bubae.com' ||
      normalizedUser === 'admin@bubae.com' ||
      normalizedUser === 'admin';

    if (isValidAdminIdentifier) {
      const storedHash = localStorage.getItem(LOCAL_ADMIN_HASH_KEY) || INITIAL_ADMIN_HASH;
      const inputHash = await computeSha256(password);

      if (inputHash === storedHash) {
        const adminUser: AdminUser = {
          id: 'bubae_admin_2008',
          username: 'BUBAE2008',
          email: 'bubae2008@bubae.com',
          role: 'admin',
        };
        localStorage.setItem(LOCAL_ADMIN_SESSION_KEY, JSON.stringify(adminUser));
        setUser(adminUser);
        await recordAdminSession(adminUser.id);
        resetLoginAttempts(cleanIdentifier);
        setLoading(false);
        return { success: true };
      }
    }

    setLoading(false);
    const lockoutStatus = recordFailedLoginAttempt(cleanIdentifier);
    const failMsg = lockoutStatus.isLocked
      ? `Too many failed attempts. For your security, this account has been locked for ${lockoutStatus.remainingSeconds || 60} seconds.`
      : 'Invalid credentials. Please verify your administrator username and password.';
    setError(failMsg);
    return { success: false, error: failMsg };
  };

  const changePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'You must be logged in to change your password.' };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    if (currentPassword === newPassword) {
      return { success: false, error: 'New password must be different from your current password.' };
    }

    // 1. Supabase Auth update
    if (isSupabaseConfigured) {
      try {
        // Re-authenticate current password for safety
        const { error: verifyError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });

        if (verifyError) {
          return { success: false, error: 'Current password verification failed. Please check your password.' };
        }

        // Update password in Supabase Auth
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (updateError) {
          return { success: false, error: updateError.message };
        }

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || 'Failed to update password.' };
      }
    }

    // 2. Local fallback secure hash update
    const storedHash = localStorage.getItem(LOCAL_ADMIN_HASH_KEY) || INITIAL_ADMIN_HASH;
    const currentHash = await computeSha256(currentPassword);

    if (currentHash !== storedHash) {
      return { success: false, error: 'Current password verification failed. Please check your password.' };
    }

    const newHash = await computeSha256(newPassword);
    localStorage.setItem(LOCAL_ADMIN_HASH_KEY, newHash);
    return { success: true };
  };

  const signOut = async () => {
    const currentTokenId = getCurrentSessionTokenId();
    if (currentTokenId) {
      await revokeSession(currentTokenId).catch(() => {});
    }

    localStorage.removeItem(LOCAL_ADMIN_SESSION_KEY);
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('Sign out error:', e);
      }
    }
    setUser(null);
    setError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin: Boolean(user && user.role === 'admin'),
        loading,
        error,
        signIn,
        signOut,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

