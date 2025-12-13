import axios from 'axios';
import api from './axios';

/**
 * Initialize SPA auth for Sanctum:
 *  - Acquire CSRF cookie from /sanctum/csrf-cookie
 *  - Optionally warm-up the authenticated user via /api/v1/user
 */
export async function initAuth(options?: { warmUser?: boolean }) {
  try {
    // Acquire CSRF cookie (no baseURL so it hits /sanctum/csrf-cookie)
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

    if (options?.warmUser ?? true) {
      try {
        // Warm up user session (uses api axios instance with base '/api/v1')
        await api.get('/user');
      } catch (e) {
        // ignore — user may be unauthenticated
      }
    }
  } catch (err) {
    // In dev/test environments this may fail; log for debugging
    // eslint-disable-next-line no-console
    console.warn('initAuth failed', err);
  }
}

export default initAuth;
import axios from 'axios';
import api from './axios';

export async function initAuth() {
  try {
    // Acquire CSRF cookie for Laravel Sanctum
    await axios.get('/sanctum/csrf-cookie', { withCredentials: true });

    // Optionally warm up the authenticated user (safe to ignore errors)
    try {
      await api.get('/user');
    } catch (e) {
      // user not authenticated or endpoint unavailable — ignore
    }
  } catch (err) {
    // network or CORS issues — let the app continue, but log
    // eslint-disable-next-line no-console
    console.warn('Failed to initialize auth CSRF cookie', err);
  }
}
