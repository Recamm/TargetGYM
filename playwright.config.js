import { defineConfig } from '@playwright/test';
const frontendPort = Number(process.env.E2E_FRONTEND_PORT || 5174);
if (!Number.isInteger(frontendPort) || frontendPort < 1 || frontendPort > 65535) throw new Error('E2E_FRONTEND_PORT debe ser un puerto valido.');
const baseURL = `http://127.0.0.1:${frontendPort}`;
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 60000,
    use: { baseURL, viewport: { width: 1440, height: 900 }, trace: 'retain-on-failure', screenshot: 'only-on-failure', launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined } },
    webServer: [
        { command: 'node backend/src/tests/e2e-server.js', url: 'http://127.0.0.1:3011/api/health', env: { NODE_ENV: 'test' }, reuseExistingServer: false },
        { command: `npm run dev --workspace frontend -- --port ${frontendPort}`, url: baseURL, env: { TARGETGYM_API_URL: 'http://127.0.0.1:3011' }, reuseExistingServer: false },
    ],
});
