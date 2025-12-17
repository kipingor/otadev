/**
 * Initialize SPA auth for Sanctum using `fetch` so this module does not
 * depend on the axios instance and avoids circular imports.
 *  - Acquire CSRF cookie from /sanctum/csrf-cookie
 *  - Optionally warm-up the authenticated user via /api/v1/user
 */
let __initAuthPromise: Promise<void> | null = null;
let __lastInitAt = 0;

export async function initAuth(options?: { warmUser?: boolean }) {
  // If an init is already in progress, reuse its promise
  if (__initAuthPromise) return __initAuthPromise;

  // If we ran recently (within 3s), skip re-running warm-user to avoid loops
  const now = Date.now();
  const recent = now - __lastInitAt < 3000;

  __initAuthPromise = (async () => {
    try {
      // Acquire CSRF cookie (no baseURL so it hits /sanctum/csrf-cookie)
      await fetch('/sanctum/csrf-cookie', {
        method: 'GET',
        credentials: 'include',
        headers: { Accept: 'application/json' },
      });

      __lastInitAt = Date.now();

      // Dev diagnostic: check whether CSRF cookie was set and show guidance.
      // Note: the Laravel session cookie is HttpOnly and will NOT appear in
      // `document.cookie` — only `XSRF-TOKEN` is visible in JS. Only show the
      // diagnostic when the XSRF cookie itself is missing.
      try {
        if (import.meta.env.DEV && typeof document !== 'undefined') {
          const cookies = (document.cookie || '').split(';').map(s => s.trim()).filter(Boolean);
          const present = cookies.map(c => c.split('=')[0]);
          const origin = window.location.origin;
          if (!present.includes('XSRF-TOKEN')) {
            // Import the diagnostic overlay lazily so production bundles don't include it
            import('@/lib/auth-ui').then(({ showAuthDiagnostic }) => {
              try { showAuthDiagnostic({ origin, cookies: present.join('; ') }); } catch (e) { /* ignore */ }
            }).catch(() => {});
          }
        }
      } catch (e) {
        // ignore diagnostics failing
      }

      if ((options?.warmUser ?? true) && !recent) {
        try {
          // optionally warm the user endpoint so axios has an authenticated response
          if (options?.warmUser ?? true) {
            const res = await fetch('/api/v1/user', { credentials: 'include' });
            if (!res.ok) {
              // If user endpoint returns 401, show an actionable UI suggesting to login
              if (res.status === 401) {
                const { showAuthErrorUI } = await import('./auth-ui');
                // show a message that the user is unauthenticated and provide a login link
                showAuthErrorUI({
                  message: 'Your session is not authenticated. Please sign in to continue.',
                });
              }
              // warm failed — let callers handle it
              throw res;
            }
          }
        } catch (e) {
          // ignore — user may be unauthenticated
        }
      }
    } catch (err) {
      // In dev/test environments this may fail; log for debugging
      // eslint-disable-next-line no-console
      console.warn('initAuth failed', err);
    } finally {
      // clear the in-progress promise after a small delay to avoid races
      setTimeout(() => {
        __initAuthPromise = null;
      }, 250);
    }
  })();

  return __initAuthPromise;
}

export default initAuth;
