import session from 'express-session';

export default class SessionStore extends session.Store {
    constructor(db) { super(); this.db = db; }
    get(sid, callback) {
        this.db.query('SELECT datos FROM sesiones WHERE sid=$1 AND expira>CURRENT_TIMESTAMP', [sid])
            .then(({ rows }) => callback(null, rows[0]?.datos ?? null), callback);
    }
    set(sid, datos, callback = () => {}) {
        this.db.query(`INSERT INTO sesiones(sid,datos,expira) VALUES($1,$2,$3)
        ON CONFLICT(sid) DO UPDATE SET datos=EXCLUDED.datos,expira=EXCLUDED.expira`,
        [sid, JSON.stringify(datos), datos.cookie.expires]).then(() => callback(), callback);
    }
    destroy(sid, callback = () => {}) {
        this.db.query('DELETE FROM sesiones WHERE sid=$1', [sid]).then(() => callback(), callback);
    }
    touch(sid, datos, callback = () => {}) {
        this.db.query('UPDATE sesiones SET expira=$2 WHERE sid=$1', [sid, datos.cookie.expires]).then(() => callback(), callback);
    }
}
