import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth, inicioPorRol } from './AuthContext.js';
import { useNotifications } from './NotificationContext.js';
import Button from './Button.jsx';

export default function Header() {
    const [open, setOpen] = useState(false), [busy, setBusy] = useState(false);
    const { usuario, loading, logout } = useAuth();
    const notices = useNotifications();
    const close = () => setOpen(false);
    async function salir() {
        setBusy(true);
        try { await logout(); notices.notify('Cerraste tu sesión.'); close(); }
        catch (error) { notices.error(error); }
        finally { setBusy(false); }
    }
    return <header className="site-header">
        <div className="header-inner"><Link to="/" className="brand-link" aria-label="Target GYM, inicio" onClick={close}>Target gym</Link>
            <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(value => !value)}>Menú</button>
            <nav id="main-navigation" aria-label="Navegación principal" className={open ? 'menu-open' : ''} onKeyDown={event => { if (event.key === 'Escape') { close(); document.querySelector('.menu-toggle')?.focus(); } }}>
                <NavLink to="/" end onClick={close}>Inicio</NavLink><NavLink to="/clases" onClick={close}>Clases</NavLink><Link to="/#planes" onClick={close}>Planes</Link>
                {loading ? <span>Sesión…</span> : usuario ? <><NavLink to={inicioPorRol(usuario.rol)} onClick={close}>{usuario.rol === 'Socio' ? 'Mi espacio' : usuario.rol === 'Administrador' ? 'Gestión' : 'Mis clases'}</NavLink><Button variant="secondary" busy={busy} onClick={salir}>Salir</Button></> : <><NavLink to="/login" onClick={close}>Ya soy socio</NavLink><Link className="button primary" to="/asociate" onClick={close}>Asociate</Link></>}
            </nav>
        </div>
    </header>;
}
