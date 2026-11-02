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
        <div className="header-inner"><Link to="/" className="wordmark" aria-label="Target GYM, inicio" onClick={close}>TARGET<span>GYM</span></Link>
            <button type="button" className="menu-toggle" aria-expanded={open} aria-controls="main-navigation" onClick={() => setOpen(value => !value)}>Menú</button>
            <nav id="main-navigation" aria-label="Navegación principal" className={open ? 'menu-open' : ''} onKeyDown={event => { if (event.key === 'Escape') { close(); document.querySelector('.menu-toggle')?.focus(); } }}>
                <Link to="/#nosotros" onClick={close}>Nosotros</Link><Link to="/#servicios" onClick={close}>Servicios</Link><NavLink to="/clases" onClick={close}>Clases</NavLink><Link to="/#contacto" onClick={close}>Contacto</Link>
                {loading ? <span>Sesión…</span> : usuario ? <><NavLink to={inicioPorRol(usuario.rol)} onClick={close}>{usuario.rol === 'Administrador' ? 'Gestión' : usuario.rol === 'Instructor' ? 'Mis clases' : 'Agenda'}</NavLink><NavLink to="/mi-cuenta" onClick={close}>Mi cuenta</NavLink><Button variant="secondary" busy={busy} onClick={salir}>Salir</Button></> : <><NavLink to="/login" onClick={close}>Ingresar</NavLink><Link className="button primary" to="/registro" onClick={close}>Empezá hoy</Link></>}
            </nav>
        </div>
    </header>;
}
