import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

/**
 * Where the Django API lives in development. Overridable with
 * `VITE_API_PROXY_TARGET` because how the backend is exposed varies by machine
 * — published host port, nginx, or a container IP.
 */
/**
 * 127.0.0.1, not `localhost`: Node resolves `localhost` to ::1 first, and the
 * backend is published on IPv4 loopback only (deliberately — see the backend's
 * docker-compose.yml).
 */
const DEFAULT_API_TARGET = 'http://127.0.0.1:8010'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Empty prefix: loads every variable, not only `VITE_*`, so unprefixed names
  // like `CLOZR_ISSUE_KEY` are readable here in Node.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_PROXY_TARGET || DEFAULT_API_TARGET

  return {
    plugins: [react()],
    /**
     * `CLOZR_ISSUE_KEY` has no `VITE_` prefix, so Vite does not put it on
     * `import.meta.env` and browser code cannot see it. It is not a secret —
     * the webhook authenticates by Origin allowlist, and this key is the
     * public path segment of the endpoint every submission posts to — so
     * handing it to the client is safe, and `define` is how an unprefixed
     * name gets there. Inlined at build time like any other constant.
     */
    define: {
      __CLOZR_ISSUE_KEY__: JSON.stringify(env.CLOZR_ISSUE_KEY ?? ''),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        // Proxied so the browser sees one origin: session cookies and CSRF then
        // work with no backend CORS or CSRF_TRUSTED_ORIGINS change.
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          /**
           * `changeOrigin` rewrites Host but NOT Origin, and Django's CSRF check
           * compares Origin against the host it was reached on. The browser sends
           * the dev server's own origin, so an unsafe request would be refused
           * with "does not match any trusted origins" — sign-in survives only
           * because it is CSRF-exempt. Presenting the target as the origin makes
           * the request genuinely same-origin from Django's point of view.
           */
          headers: { Origin: apiTarget },
        },
      },
    },
  }
})
