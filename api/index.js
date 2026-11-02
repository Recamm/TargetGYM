import { createDatabase } from '../backend/src/database/Database.js';
import { createApp } from '../backend/src/app.js';

let runtime;
export default async function handler(req, res) {
    try {
        if (!runtime) runtime = createDatabase({ mode: 'postgres' }).then(db => createApp({ db }));
        const app = await runtime;
        app(req, res);
    } catch (error) {
        console.error('No se pudo iniciar la API:', error.code ?? error.name);
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ success: false, message: 'La API no esta configurada correctamente.' }));
    }
}
