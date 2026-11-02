import { createDatabase, migrate } from './database/Database.js';
import { createApp } from './app.js';

const db = await createDatabase({ mode: process.env.DATABASE_MODE ?? 'postgres' });
if (db.mode === 'local') await migrate(db);
const app = createApp({ db });
const port = Number(process.env.PORT ?? 3000);
const server = app.listen(port, '127.0.0.1', () => console.log(`Target GYM: http://127.0.0.1:${server.address().port} (${db.mode})`));
let cerrando = false;
async function cerrar() {
    if (cerrando) return;
    cerrando = true;
    await new Promise(resolve => server.close(resolve));
    await db.close();
}
process.once('SIGINT', cerrar);
process.once('SIGTERM', cerrar);
