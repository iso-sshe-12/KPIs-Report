// Admin Authorization & Role Management Service

const STORAGE_KEY_ADMIN_AUTH = 'krc_admin_authorized';
const STORAGE_KEY_ADMIN_PIN = 'krc_admin_pin';
export const DEFAULT_ADMIN_EMAIL = 'iso-sshe@krctrans.com';
export const DEFAULT_ADMIN_PIN = '1234';

/**
 * Check if the current browser session is authorized as Admin (Owner)
 */
export function checkIsAdmin(): boolean {
  if (typeof window === 'undefined') return false;

  // 1. Check URL query parameters (e.g. ?admin=true or ?key=iso-sshe)
  try {
    const params = new URLSearchParams(window.location.search);
    const adminParam = params.get('admin');
    const keyParam = params.get('key');
    const userParam = params.get('user');

    if (
      adminParam === 'true' ||
      adminParam === '1' ||
      keyParam === 'iso-sshe' ||
      keyParam === 'krctrans' ||
      userParam === 'iso-sshe@krctrans.com'
    ) {
      localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
      return true;
    }
  } catch (e) {
    // Ignore query param parse error
  }

  // 2. Check if running inside Google AI Studio Dev Environment
  try {
    if (window.location.hostname.includes('ais-dev-')) {
      // In development container, default to true for the app owner
      if (localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) === null) {
        localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, 'true');
      }
      return localStorage.getItem(STORAGE_KEY_ADMIN_AUTH) !== 'false';
    }
  } catch (e) {
    // Ignore
  }

  // 3. Check persistent localStorage status
  try {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN_AUTH);
    return saved === 'true';
  } catch (e) {
    return false;
  }
}

/**
 * Set admin authorization status in local storage
 */
export function setAdminAuthorized(authorized: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_ADMIN_AUTH, authorized ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to save admin auth state:', e);
  }
}

/**
 * Verify user input (can be PIN "1234", email "iso-sshe@krctrans.com", or "krctrans")
 */
export function verifyAdminCredentials(input: string): boolean {
  if (!input) return false;
  const trimmed = input.trim().toLowerCase();
  
  const savedPin = localStorage.getItem(STORAGE_KEY_ADMIN_PIN) || DEFAULT_ADMIN_PIN;

  if (
    trimmed === savedPin.toLowerCase() ||
    trimmed === DEFAULT_ADMIN_PIN ||
    trimmed === DEFAULT_ADMIN_EMAIL.toLowerCase() ||
    trimmed === 'iso-sshe' ||
    trimmed === 'krctrans' ||
    trimmed === 'krc2026'
  ) {
    setAdminAuthorized(true);
    return true;
  }

  return false;
}

/**
 * Get Clean URL for sharing with general viewers (without admin parameters)
 */
export function getViewerShareUrl(): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.delete('admin');
  url.searchParams.delete('key');
  url.searchParams.delete('user');
  url.searchParams.delete('role');
  return url.toString();
}

/**
 * Get Admin Bookmarked URL for the app owner
 */
export function getAdminBookmarkUrl(): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  url.searchParams.set('admin', 'true');
  return url.toString();
}
