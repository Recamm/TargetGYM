import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth, inicioPorRol } from './AuthContext.js';
import { useNotifications } from './NotificationContext.js';
import GestionNav from './GestionNav.jsx';
import Button from './Button.jsx';

export default function EquipoLayout({ children }) {
    const { usuario, logout } = useAuth(), notices = useNotifications();
    const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
    const equipo = usuario && ['Administrador','Instructor'].includes(usuario.rol);
    const close = () => setOpen(false);
    async function salir() {
        setBusy(true);
        try { await logout(); close(); notices.notify('Cerraste tu sesión.'); }
        catch (error) { notices.error(error); }
        finally { setBusy(false); }
    }
    return <>
        <header className="site-header equipo-header"><div className="header-inner">
            <Link className="brand-link" to={equipo ? inicioPorRol(usuario.rol) : '/'} onClick={close} aria-label="Target GYM, inicio del equipo">Target gym</Link>
            <div className="equipo-session">
                {equipo && <span>{usuario.nombre} · {usuario.rol}</span>}
                <Link className="text-link site-return" to="/">Ver sitio</Link>
                {equipo && <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="equipo-navigation" onClick={() => setOpen(value => !value)}>Menú</button>}
                {usuario && <Button variant="secondary" busy={busy} onClick={salir}>Salir</Button>}
            </div>
        </div></header>
        <div className={`equipo-shell${equipo ? ' con-panel' : ''}`}>
            {equipo && <aside id="equipo-navigation" className={`equipo-sidebar${open ? ' menu-open' : ''}`} onClick={event => { if (event.target.closest('a')) close(); }}
                onKeyDown={event => { if (event.key === 'Escape') { close(); document.querySelector('.equipo-header .menu-toggle')?.focus(); } }}>
                {usuario.rol === 'Administrador' ? <GestionNav /> : <nav className="section-nav" aria-label="Espacio del instructor"><NavLink to="/instructor/clases">Mis clases</NavLink></nav>}
                <nav className="section-nav equipo-links" aria-label="Cuenta del equipo"><NavLink to="/mi-cuenta">Mi perfil</NavLink><Link to="/">Volver al sitio</Link></nav>
            </aside>}
            {children}
        </div>
    </>;
}
