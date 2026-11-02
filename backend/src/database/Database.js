import { mkdir, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { Pool } from 'pg';

export async function createDatabase({ mode = 'postgres', dataDir = '.local-data/postgres', url = process.env.DATABASE_URL } = {}) {
    if (mode === 'local') {
        if (process.env.VERCEL || process.env.NODE_ENV === 'production') throw new Error('La base local no esta permitida en produccion.');
        const { PGlite } = await import('@electric-sql/pglite');
        await mkdir(dirname(dataDir), { recursive: true });
        const engine = await PGlite.create(dataDir);
        return {
            mode,
            query: (sql, params = []) => engine.query(sql, params),
            exec: (sql) => engine.exec(sql),
            transaction: (work) => engine.transaction(async (tx) => {
                await tx.query('SELECT id FROM sistema_lock WHERE id = 1 FOR UPDATE');
                return work(tx);
            }),
            close: () => engine.close(),
        };
    }
    if (mode !== 'postgres') throw new Error('DATABASE_MODE debe ser postgres o local.');
    if (!url) throw new Error('Falta DATABASE_URL. Configure Neon o use dev:local explicitamente.');
    const pool = new Pool({ connectionString: url, max: 4, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000, allowExitOnIdle: true });
    pool.on('error', (error) => console.error('Error de conexion PostgreSQL:', error.code));
    return {
        mode,
        query: (sql, params = []) => pool.query(sql, params),
        exec: (sql) => pool.query(sql),
        async transaction(work) {
            const client = await pool.connect();
            try {
                await client.query('BEGIN');
                // Una fila compartida serializa las mutaciones de negocio entre instancias serverless.
                await client.query('SELECT id FROM sistema_lock WHERE id = 1 FOR UPDATE');
                const result = await work(client);
                await client.query('COMMIT');
                return result;
            } catch (error) {
                try { await client.query('ROLLBACK'); }
                catch (rollbackError) { console.error('Fallo al revertir transaccion:', rollbackError.code); }
                throw error;
            } finally {
                client.release();
            }
        },
        close: () => pool.end(),
    };
}

export async function migrate(db) {
    const [sql, ...cambios] = await Promise.all(['./schema.sql', './planes.sql', './accesos.sql'].map(path => readFile(new URL(path, import.meta.url), 'utf8')));
    try { await db.exec(`BEGIN;\n${sql}\nSELECT id FROM sistema_lock WHERE id=1 FOR UPDATE;\n${cambios.join('\n')}\nCOMMIT;`); }
    catch (error) {
        try { await db.exec('ROLLBACK;'); }
        catch (rollbackError) { console.error('Fallo al revertir migracion:', rollbackError.code); }
        throw error;
    }
}
