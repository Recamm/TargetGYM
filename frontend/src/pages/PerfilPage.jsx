import { useAuth } from '../components/AuthContext.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import UsuarioForm from '../components/UsuarioForm.jsx';
import SocioNav from '../components/SocioNav.jsx';
export default function PerfilPage() {
    const { usuario, editarPerfil } = useAuth(), notices = useNotifications();
    return <>{usuario.rol === 'Socio' && <SocioNav />}<PageHeader title="Mi perfil" description={`Tu perfil de ${usuario.rol.toLowerCase()}. El email y los datos se verifican en el servidor.`} />
        <UsuarioForm initial={usuario} editar onSubmit={async body => { await editarPerfil(body); notices.notify('Tu perfil se actualizó.'); }} />
    </>;
}
