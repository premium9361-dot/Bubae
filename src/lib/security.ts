/**
 * Production Security & Input Validation Utilities for Bubaé E-Commerce
 * Hardens against XSS, input manipulation, oversized payloads, brute-force attempts, and spam.
 */

import { CreateOrderPayload } from '../services/orders';

/**
 * Strips script tags, HTML tags, null bytes, and trims strings.
 */
export function sanitizeString(input: unknown, maxLength = 250): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/\0/g, '') // remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip script blocks
    .replace(/<[^>]+>/g, '') // strip remaining HTML tags
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates and normalizes Bangladesh mobile phone numbers.
 * Valid formats: 013XXXXXXXX, 014XXXXXXXX, 015XXXXXXXX, 016XXXXXXXX, 017XXXXXXXX, 018XXXXXXXX, 019XXXXXXXX
 * Supports optional leading +88 or 88.
 */
export function validatePhone(phone: unknown): { isValid: boolean; normalized: string; error?: string } {
  if (typeof phone !== 'string') {
    return { isValid: false, normalized: '', error: 'Phone number is required.' };
  }

  // Strip spaces, dashes, parentheses
  const cleaned = phone.replace(/[\s\-\(\)]/g, '');

  // Extract digits
  let digits = cleaned.replace(/[^0-9]/g, '');

  if (digits.startsWith('880')) {
    digits = digits.substring(2); // turn 8801... into 01...
  }

  // Must match 01[3-9]\d{8} (total 11 digits)
  const bdRegex = /^01[3-9]\d{8}$/;

  if (!bdRegex.test(digits)) {
    return {
      isValid: false,
      normalized: digits,
      error: 'Please enter a valid 11-digit Bangladeshi mobile number (e.g. 01712345678).',
    };
  }

  return { isValid: true, normalized: digits };
}

/**
 * Validates and cleans order payload before submission.
 */
export function validateOrderInput(payload: CreateOrderPayload): {
  isValid: boolean;
  cleanPayload?: CreateOrderPayload;
  error?: string;
} {
  // 1. Policy acceptance check
  if (!payload.policy_accepted) {
    return {
      isValid: false,
      error: 'You must agree to Bubaé’s No Return / No Exchange policy to place an order.',
    };
  }

  // 2. Customer Name validation
  const cleanName = sanitizeString(payload.customer_name, 70);
  if (!cleanName || cleanName.length < 2) {
    return {
      isValid: false,
      error: 'Please enter your full name (at least 2 characters).',
    };
  }

  // 3. Phone validation
  const phoneValidation = validatePhone(payload.phone);
  if (!phoneValidation.isValid) {
    return {
      isValid: false,
      error: phoneValidation.error || 'Please enter a valid phone number.',
    };
  }

  // 4. Address validation
  const cleanAddress = sanitizeString(payload.address, 300);
  if (!cleanAddress || cleanAddress.length < 5) {
    return {
      isValid: false,
      error: 'Please enter a complete delivery address (at least 5 characters).',
    };
  }

  // 5. District & Area validation
  const cleanDistrict = sanitizeString(payload.district, 50);
  if (!cleanDistrict) {
    return {
      isValid: false,
      error: 'Please select a valid delivery district.',
    };
  }

  const cleanArea = sanitizeString(payload.area, 60);

  // 6. Items validation
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    return {
      isValid: false,
      error: 'Your shopping cart must contain at least one item.',
    };
  }

  if (payload.items.length > 25) {
    return {
      isValid: false,
      error: 'Orders are limited to a maximum of 25 distinct items per order.',
    };
  }

  const validatedItems = [];
  for (let idx = 0; idx < payload.items.length; idx++) {
    const item = payload.items[idx];
    if (!item.product_id || typeof item.product_id !== 'string') {
      return { isValid: false, error: 'Invalid product selected in cart.' };
    }

    const cleanSize = sanitizeString(item.size, 10).toUpperCase();
    if (!cleanSize) {
      return { isValid: false, error: 'Please specify a size for all ordered items.' };
    }

    const cleanColor = sanitizeString(item.color, 30) || 'Default';

    const qty = Math.floor(Number(item.quantity));
    if (isNaN(qty) || qty < 1 || qty > 15) {
      return {
        isValid: false,
        error: 'Item quantities must be positive numbers between 1 and 15.',
      };
    }

    validatedItems.push({
      product_id: sanitizeString(item.product_id, 64),
      size: cleanSize,
      color: cleanColor,
      quantity: qty,
    });
  }

  const cleanNotes = payload.notes ? sanitizeString(payload.notes, 400) : undefined;

  return {
    isValid: true,
    cleanPayload: {
      ...payload,
      customer_name: cleanName,
      phone: phoneValidation.normalized,
      address: cleanAddress,
      district: cleanDistrict,
      area: cleanArea || cleanDistrict,
      notes: cleanNotes,
      items: validatedItems,
    },
  };
}

/**
 * Client-Side Order Rate Limiter
 * Protects against automated script flooding and accidental rapid double-submissions.
 */
const ORDER_SUBMISSION_HISTORY_KEY = 'bubae_order_submit_ts_v1';
const MAX_ORDERS_PER_WINDOW = 3;
const ORDER_RATE_WINDOW_MS = 60_000; // 1 minute

export function checkOrderRateLimit(): { allowed: boolean; waitSeconds?: number } {
  if (typeof window === 'undefined') return { allowed: true };

  try {
    const raw = localStorage.getItem(ORDER_SUBMISSION_HISTORY_KEY);
    const now = Date.now();
    let timestamps: number[] = raw ? JSON.parse(raw) : [];

    // Filter out timestamps older than rate window
    timestamps = timestamps.filter(ts => typeof ts === 'number' && now - ts < ORDER_RATE_WINDOW_MS);

    if (timestamps.length >= MAX_ORDERS_PER_WINDOW) {
      const oldest = Math.min(...timestamps);
      const remainingMs = ORDER_RATE_WINDOW_MS - (now - oldest);
      return {
        allowed: false,
        waitSeconds: Math.ceil(Math.max(1000, remainingMs) / 1000),
      };
    }

    // Record this attempt
    timestamps.push(now);
    localStorage.setItem(ORDER_SUBMISSION_HISTORY_KEY, JSON.stringify(timestamps));
    return { allowed: true };
  } catch {
    return { allowed: true };
  }
}

/**
 * Client-Side Admin Login Rate Limiter & Lockout Defense
 * Defends against brute-force password guessing.
 */
const LOGIN_ATTEMPTS_KEY = 'bubae_login_attempts_v2';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 60_000; // 60 seconds lockout after 5 consecutive failures

interface LoginAttemptRecord {
  attempts: number;
  lockoutUntil: number;
}

export function checkLoginRateLimit(identifier: string): { isLocked: boolean; remainingSeconds?: number } {
  if (typeof window === 'undefined') return { isLocked: false };

  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return { isLocked: false };

    const records: Record<string, LoginAttemptRecord> = JSON.parse(raw);
    const key = identifier.toLowerCase().trim() || 'admin';
    const userRecord = records[key];

    if (!userRecord) return { isLocked: false };

    const now = Date.now();
    if (userRecord.lockoutUntil && now < userRecord.lockoutUntil) {
      const remainingSec = Math.ceil((userRecord.lockoutUntil - now) / 1000);
      return { isLocked: true, remainingSeconds: remainingSec };
    }

    // If lockout expired, reset attempts
    if (userRecord.lockoutUntil && now >= userRecord.lockoutUntil) {
      delete records[key];
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
    }

    return { isLocked: false };
  } catch {
    return { isLocked: false };
  }
}

export function recordFailedLoginAttempt(identifier: string): { isLocked: boolean; remainingSeconds?: number } {
  if (typeof window === 'undefined') return { isLocked: false };

  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const records: Record<string, LoginAttemptRecord> = raw ? JSON.parse(raw) : {};
    const key = identifier.toLowerCase().trim() || 'admin';
    const now = Date.now();

    const current = records[key] || { attempts: 0, lockoutUntil: 0 };
    current.attempts += 1;

    if (current.attempts >= MAX_LOGIN_ATTEMPTS) {
      current.lockoutUntil = now + LOCKOUT_DURATION_MS;
      records[key] = current;
      localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
      return { isLocked: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
    }

    records[key] = current;
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
    return { isLocked: false };
  } catch {
    return { isLocked: false };
  }
}

export function resetLoginAttempts(identifier: string): void {
  if (typeof window === 'undefined') return;

  try {
    const raw = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    if (!raw) return;
    const records: Record<string, LoginAttemptRecord> = JSON.parse(raw);
    const key = identifier.toLowerCase().trim() || 'admin';
    delete records[key];
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(records));
  } catch {
    // ignore
  }
}
