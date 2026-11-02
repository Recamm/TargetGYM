import { createDatabase, migrate } from '../database/Database.js';

const db = await createDatabase({ mode: process.env.DATABASE_MODE ?? 'postgres' });
try { await migrate(db); console.log('Migracion 1 aplicada.'); }
finally { await db.close(); }
