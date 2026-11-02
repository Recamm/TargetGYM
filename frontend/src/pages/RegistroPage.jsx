import { Link } from 'react-router-dom';
import { useAuth, inicioPorRol } from '../components/AuthContext.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import UsuarioForm from '../components/UsuarioForm.jsx';
export default function RegistroPage() {
    const { usuario, registro } = useAuth(), notices = useNotifications();
    if (usuario) return <><PageHeader title="Ya tenés una sesión iniciada" description="Para crear otra cuenta, primero cerrá tu sesión." /><Link className="button primary" to={inicioPorRol(usuario.rol)}>Ir a mi espacio</Link></>;
    return <><PageHeader title="Tu primer paso" description="Creá tu cuenta de socio. La membresía se activa al registrar el pago en el gimnasio." />
        <UsuarioForm elegirPlan buttonLabel="Crear cuenta" onSubmit={async body => { await registro(body); notices.notify('Cuenta creada. Tu plan queda solicitado, pendiente del pago.'); }} />
    </>;
}
