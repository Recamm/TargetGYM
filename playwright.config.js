import { defineConfig } from '@playwright/test';
export default defineConfig({
    testDir: './e2e',
    fullyParallel: false,
    workers: 1,
    retries: 0,
    timeout: 60000,
    use: { baseURL: 'http://127.0.0.1:5174', viewport: { width: 1440, height: 900 }, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
    webServer: [
        { command: 'node backend\\src\\tests\\e2e-server.js', url: 'http://127.0.0.1:3011/api/health', env: { NODE_ENV: 'test' }, reuseExistingServer: false },
        { command: 'npm run dev --workspace frontend -- --port 5174', url: 'http://127.0.0.1:5174', env: { TARGETGYM_API_URL: 'http://127.0.0.1:3011' }, reuseExistingServer: false },
    ],
});
