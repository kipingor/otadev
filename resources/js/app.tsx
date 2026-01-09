import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { initializeTheme } from './hooks/use-appearance';

import initAuth from '@/lib/initAuth';
import './lib/echo';
import './lib/vite-origin-check';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// Ensure CSRF cookie is acquired before mounting the app to avoid early
// API requests returning 419 (which trigger a reload) during initial render.
(async () => {
    try {
        // Show a small splash while we initialize auth to avoid blank screen
        let splash: HTMLElement | null = null;
        try {
            splash = document.createElement('div');
            splash.id = 'init-splash';
            splash.innerHTML = `
                <div style="position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999;background:rgba(255,255,255,0.9);">
                    <div style="text-align:center;">
                        <div style="font-size:18px;margin-bottom:8px;color:#374151">Loading…</div>
                        <div style="width:48px;height:48px;border:4px solid #e5e7eb;border-top-color:#374151;border-radius:50%;animation:spin 1s linear infinite"></div>
                    </div>
                </div>
            `;
            // simple CSS for spinner
            const style = document.createElement('style');
            style.innerHTML = `@keyframes spin{to{transform:rotate(360deg)}}`;
            document.head.appendChild(style);
            document.body.appendChild(splash);
        } catch (e) {
            splash = null;
        }

        await initAuth({ warmUser: true });
    } catch (e) {
        // ignore — initAuth logs internally
    }

    createInertiaApp({
        title: (title) => (title ? `${title} - ${appName}` : appName),

        resolve: (name) =>
            resolvePageComponent(
                `./pages/${name}.tsx`,
                import.meta.glob('./pages/**/*.tsx'),
            ),

        setup({ el, App, props }) {
            const root = createRoot(el);
            const queryClient = new QueryClient();

            function Root() {
                return (
                    <StrictMode>
                        <QueryClientProvider client={queryClient}>
                            <App {...props} />
                            <Toaster
                                position="top-right"
                                richColors
                                closeButton
                            />
                        </QueryClientProvider>
                    </StrictMode>
                );
            }

            root.render(<Root />);
        },

        progress: {
            color: '#4B5563',
        },
    });
    // remove splash if present
    try {
        const s = document.getElementById('init-splash');
        if (s && s.parentNode) s.parentNode.removeChild(s);
    } catch (e) {
        // ignore
    }
})();

initializeTheme();
// Dev-only Inertia diagnostic: log when an outgoing Inertia request receives
// a plain JSON response (no `X-Inertia` response header). This helps locate
// mis-routed visits or server responses returning JSON for page visits.
if (import.meta.env.DEV && typeof window !== 'undefined') {
    try {
        // Wrap fetch
        const _origFetch = window.fetch.bind(window);
        window.fetch = async (input: RequestInfo, init?: RequestInit) => {
            try {
                const headers = new Headers(
                    init?.headers as HeadersInit | undefined,
                );
                const isInertiaReq =
                    headers.has('X-Inertia') || headers.has('x-inertia');
                const res = await _origFetch(input, init);
                if (isInertiaReq) {
                    const hasInertiaResp = !!(
                        res.headers.get('X-Inertia') ||
                        res.headers.get('x-inertia')
                    );
                    const ct = (
                        res.headers.get('content-type') || ''
                    ).toLowerCase();
                    if (!hasInertiaResp && ct.includes('application/json')) {
                        console.groupCollapsed(
                            'Dev: Inertia received JSON for',
                            String(input),
                        );
                        console.log('Request init:', init);
                        console.log('Response status:', res.status);
                        console.log(
                            'Response headers:',
                            Object.fromEntries(res.headers.entries()),
                        );
                        try {
                            res.clone()
                                .text()
                                .then((b) => console.log('Response body:', b));
                        } catch (e) {
                            /* ignore */
                        }
                        console.trace();
                        console.groupEnd();
                    }
                }
                return res;
            } catch (e) {
                return _origFetch(input, init);
            }
        };

        // Wrap XHR (some libs or older code may still use XMLHttpRequest)
        const proto = XMLHttpRequest.prototype as any;
        const _origOpen = proto.open;
        const _origSetHeader = proto.setRequestHeader;
        const _origSend = proto.send;

        proto.open = function (
            this: any,
            method: string,
            url: string,
            async?: boolean,
            user?: string,
            password?: string,
        ) {
            this._otadev_headers = this._otadev_headers || {};
            this._otadev_url = url;
            return _origOpen.apply(this, arguments as any);
        };

        proto.setRequestHeader = function (
            this: any,
            name: string,
            value: string,
        ) {
            this._otadev_headers = this._otadev_headers || {};
            this._otadev_headers[name] = value;
            return _origSetHeader.apply(this, arguments as any);
        };

        proto.send = function (this: any, body?: any) {
            try {
                this.addEventListener('load', function (this: any) {
                    try {
                        const hdrs = this._otadev_headers || {};
                        const isInertiaReq =
                            hdrs['X-Inertia'] || hdrs['x-inertia'];
                        const respInertia =
                            this.getResponseHeader &&
                            (this.getResponseHeader('X-Inertia') ||
                                this.getResponseHeader('x-inertia'));
                        const ct =
                            (this.getResponseHeader &&
                                this.getResponseHeader('content-type')) ||
                            '';
                        if (
                            isInertiaReq &&
                            !respInertia &&
                            ct.toLowerCase().includes('application/json')
                        ) {
                            console.groupCollapsed(
                                'Dev: Inertia XHR received JSON for',
                                this._otadev_url,
                            );
                            console.log('Request headers:', hdrs);
                            console.log('Response status:', this.status);
                            console.log('Response body:', this.responseText);
                            console.trace();
                            console.groupEnd();
                        }
                    } catch (e) {
                        // ignore
                    }
                });
            } catch (e) {
                // ignore
            }
            return _origSend.apply(this, arguments as any);
        };
    } catch (e) {
        // ignore diagnostic setup failures
    }
}
