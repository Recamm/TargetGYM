import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { createDatabase, migrate } from '../database/Database.js';
import AuthService from '../services/AuthService.js';

let ocultar = false;
const output = new Writable({ write(chunk, encoding, done) { if (!ocultar) process.stdout.write(chunk); done(); } });
const input = createInterface({ input: process.stdin, output, terminal: true });
let db;
try {
    const nombre = await input.question('Nombre: ');
    const apellido = await input.question('Apellido: ');
    const email = await input.question('Email: ');
    process.stdout.write('Contraseña (no se muestra): ');
    ocultar = true;
    const password = await input.question('');
    ocultar = false;
    process.stdout.write('\n');
    db = await createDatabase({ mode: process.argv.includes('--local') ? 'local' : 'postgres' });
    await migrate(db);
    await new AuthService(db).crearAdministrador({ nombre, apellido, email, password });
    console.log('Administrador creado. No se muestran credenciales.');
} finally {
    input.close();
    if (db) await db.close();
}
