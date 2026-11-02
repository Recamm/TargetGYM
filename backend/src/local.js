import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';

if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('El modo local no se usa en produccion.');
process.env.DATABASE_MODE = 'local';
await mkdir('.local-data', { recursive: true });
if (!process.env.SESSION_SECRET) {
    const file = '.local-data/session-secret';
    try { process.env.SESSION_SECRET = await readFile(file, 'utf8'); }
    catch (error) {
        if (error.code !== 'ENOENT') throw error;
        const secret = randomBytes(48).toString('hex');
        await writeFile(file, secret, { flag: 'wx', mode: 0o600 });
        process.env.SESSION_SECRET = secret;
    }
}
await import('./server.js');
