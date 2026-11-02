import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth, inicioPorRol } from '../components/AuthContext.js';
import { useNotifications } from '../components/NotificationContext.js';
import { enfocarError } from '../utils/validation.js';
import PageHeader from '../components/PageHeader.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
export default function LoginPage() {
    const { usuario, login } = useAuth(), notices = useNotifications();
    const [values, setValues] = useState({ email: '', password: '' }), [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);
    if (usuario) return <Navigate to={inicioPorRol(usuario.rol)} replace />;
    const change = event => { setValues(previous => ({ ...previous, [event.target.name]: event.target.value })); setErrors(previous => ({ ...previous, [event.target.name]: undefined })); };
    async function submit(event) {
        event.preventDefault();
        const next = {};
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = 'Ingresá un email válido.';
        if (!values.password) next.password = 'Ingresá tu contraseña.';
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); enfocarError(event.currentTarget, next); return; }
        setBusy(true);
        try { const user = await login(values); notices.notify(`Bienvenido, ${user.nombre}.`); }
        catch (error) { notices.error(error); }
        finally { setBusy(false); }
    }
    return <div className="auth-page"><PageHeader title="Volvé a tu rutina" description="Ingresá a tu cuenta de Target GYM." /><form noValidate className="form-panel" onSubmit={submit}>
        <FormField label="Email" name="email" type="email" autoComplete="username" value={values.email} onChange={change} error={errors.email} disabled={busy} required />
        <FormField label="Contraseña" name="password" type="password" autoComplete="current-password" value={values.password} onChange={change} error={errors.password} disabled={busy} required />
        <Button type="submit" busy={busy}>Ingresar</Button>
    </form><p>¿Todavía no tenés cuenta? <Link to="/registro">Registrate</Link>.</p></div>;
}
