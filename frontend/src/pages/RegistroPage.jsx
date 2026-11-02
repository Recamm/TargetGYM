import { Link, useSearchParams } from 'react-router-dom';
import { useAuth, inicioPorRol } from '../components/AuthContext.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import UsuarioForm from '../components/UsuarioForm.jsx';
export default function RegistroPage() {
    const { usuario, registro } = useAuth(), notices = useNotifications();
    const [params] = useSearchParams();
    if (usuario) return <><PageHeader title="Ya tenés una sesión iniciada" description="Para crear otra cuenta, primero cerrá tu sesión." /><Link className="button primary" to={inicioPorRol(usuario.rol)}>Ir a mi espacio</Link></>;
    return <div className="association-page"><PageHeader title="Asociate a Target gym" description="Elegí un plan, completá tus datos y cómo vas a pagar. La cuenta se crea ahora; la membresía se activa al confirmar el pago." />
        <p>¿Ya tenés una cuenta? <Link to="/login">Ya soy socio</Link>.</p>
        <UsuarioForm elegirPlan asociacion initial={{ tipoPlan: params.get('plan') ?? '' }} buttonLabel="Crear cuenta y solicitar membresía" onSubmit={async body => { await registro(body); notices.notify('Cuenta creada. Tu membresía queda pendiente de confirmar el pago.'); }} />
    </div>;
}
