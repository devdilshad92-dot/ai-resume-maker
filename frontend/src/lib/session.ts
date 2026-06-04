/**
 * Anonymous-first session management.
 *
 * Every visitor gets a session automatically — either a guest JWT or a real
 * Google-auth JWT.  The rest of the app treats them identically; only
 * `isGuest()` distinguishes them for feature-gating.
 *
 * Keys in localStorage:
 *   token                    — JWT (guest or real, used by axios client)
 *   is_guest                 — "true" | absent
 *   anon_session_id          — stable UUID for this browser
 *   guest_token_pre_signin   — old guest JWT saved before Google OAuth redirect
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

// ─── Read helpers ──────────────────────────────────────────────────────────────

export function isGuest(): boolean {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('is_guest') === 'true';
}

export function hasSession(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(localStorage.getItem('token'));
}

function getOrCreateSessionId(): string {
    let id = localStorage.getItem('anon_session_id');
    if (!id) {
        id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
        localStorage.setItem('anon_session_id', id);
    }
    return id;
}

// ─── Session bootstrap ─────────────────────────────────────────────────────────

/**
 * Called on every page load.  If no token exists, creates a guest session
 * so the user can use the product immediately without signing in.
 */
export async function ensureSession(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('token')) return;           // already have a session

    const sessionId = getOrCreateSessionId();
    try {
        const res = await fetch(`${API}/auth/guest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
        });
        if (res.ok) {
            const { access_token } = await res.json();
            localStorage.setItem('token', access_token);
            localStorage.setItem('is_guest', 'true');
        }
    } catch {
        // Silent fail — the user will get 401 responses until connectivity is restored
    }
}

// ─── Pre-sign-in: save guest token before Google OAuth redirect ────────────────

/**
 * Call this immediately before navigating to the Google OAuth URL.
 * Saves the current guest token so we can migrate data after sign-in.
 */
export function saveGuestTokenForMigration(): void {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('token');
    if (token && isGuest()) {
        localStorage.setItem('guest_token_pre_signin', token);
    }
}

// ─── Post-sign-in: migrate guest data to real account ─────────────────────────

/**
 * Called by /auth/callback after storing the new real JWT.
 * Returns the number of resumes migrated.
 */
export async function migrateGuestData(): Promise<number> {
    if (typeof window === 'undefined') return 0;

    const guestToken = localStorage.getItem('guest_token_pre_signin');
    const realToken  = localStorage.getItem('token');

    if (!guestToken || !realToken || guestToken === realToken) {
        clearGuestMarkers();
        return 0;
    }

    try {
        const res = await fetch(`${API}/auth/migrate-guest`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${realToken}`,
            },
            body: JSON.stringify({ guest_token: guestToken }),
        });
        if (res.ok) {
            const { migrated } = await res.json();
            clearGuestMarkers();
            return migrated as number;
        }
    } catch {}

    clearGuestMarkers();
    return 0;
}

// ─── Logout ────────────────────────────────────────────────────────────────────

export function clearGuestMarkers(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('is_guest');
    localStorage.removeItem('guest_token_pre_signin');
    // Keep anon_session_id so a new guest session can be re-established
}

export function fullLogout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('is_guest');
    localStorage.removeItem('anon_session_id');
    localStorage.removeItem('guest_token_pre_signin');
}
