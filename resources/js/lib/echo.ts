import { configureEcho } from "@laravel/echo-react";

// Check if Echo environment variables are configured
const hasEchoConfig = !!(
    import.meta.env.VITE_REVERB_APP_KEY &&
    import.meta.env.VITE_REVERB_HOST &&
    import.meta.env.VITE_REVERB_PORT
);

export const echo = hasEchoConfig ? configureEcho({
    broadcaster: "reverb",
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: import.meta.env.VITE_REVERB_PORT,
    wssPort: import.meta.env.VITE_REVERB_PORT,
    forceTLS: false,
    enabledTransports: ["ws", "wss"],
}) : null;

// Also export as default for compatibility
export default echo;