import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, inicioPorRol } from '../components/AuthContext.js';
import { useNotifications } from '../components/NotificationContext.js';
import { passwordValida } from '../utils/validation.js';
import PageHeader from '../components/PageHeader.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import { ErrorState, LoadingState } from '../components/ResourceState.jsx';

export default function ActivarAccesoPage() {
    const location = useLocation(), navigate = useNavigate();
    const [token] = useState(() => new URLSearchParams(location.hash.slice(1)).get('token') ?? '');
    const [password, setPassword] = useState(''), [confirmacion, setConfirmacion] = useState(''), [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);
    const { usuario, loading, error, refresh, aceptarInvitacion } = useAuth(), notices = useNotifications();
    useEffect(() => { if (location.hash) navigate('/activar-acceso', { replace: true }); }, [location.hash, navigate]);
    if (loading) return <LoadingState />;
    if (error) return <ErrorState error={error} retry={refresh} />;
    if (usuario) return <div className="auth-page"><PageHeader title="Ya hay una sesión iniciada" description="Para usar una invitación de otra cuenta, cerrá tu sesión y volvé a abrir el enlace." /><Link className="button secondary" to={inicioPorRol(usuario.rol)}>Ir a mi espacio</Link></div>;
    if (!/^[a-f0-9]{64}$/.test(token)) return <div className="auth-page"><PageHeader title="Necesitás tu enlace de acceso" description="Pedí en recepción una invitación vigente. El enlace es personal y vence a las 48 horas." /><Link className="text-link" to="/#contacto">Contactar al gimnasio</Link></div>;
    async function submit(event) {
        event.preventDefault();
        const next = {};
        if (!passwordValida(password)) next.password = 'Usá 8 a 128 caracteres, una mayúscula y un número.';
        if (password !== confirmacion) next.confirmacion = 'Las contraseñas deben coincidir.';
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); event.currentTarget.elements.namedItem(Object.keys(next)[0])?.focus(); return; }
        setBusy(true);
        try { await aceptarInvitacion({ token, password }); notices.notify('Tu acceso está listo. Revisá el estado de tu membresía en Mi espacio.'); }
        catch (error) { notices.error(error); }
        finally { setBusy(false); }
    }
    return <div className="auth-page"><PageHeader title="Tu acceso a Target" description="Recepción creó tu cuenta. Elegí tu contraseña; esto no confirma un pago ni activa una membresía." />
        <form className="form-panel" noValidate onSubmit={submit}>
            <FormField name="password" label="Tu contraseña" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} error={errors.password} disabled={busy} required hint="Al menos 8 caracteres, una mayúscula y un número." />
            <FormField name="confirmacion" label="Repetí tu contraseña" type="password" autoComplete="new-password" value={confirmacion} onChange={event => setConfirmacion(event.target.value)} error={errors.confirmacion} disabled={busy} required />
            <Button type="submit" busy={busy}>Activar mi acceso</Button>
        </form>
    </div>;
}
