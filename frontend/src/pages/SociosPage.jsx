import { Link } from 'react-router-dom';
import { listarSocios } from '../services/sociosService.js';
import useResource from '../utils/useResource.js';
import { fechaHora } from '../utils/validation.js';
import GestionNav from '../components/GestionNav.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
export default function SociosPage() {
    const resource = useResource(listarSocios);
    return <><GestionNav /><PageHeader title="Socios" description="Gestioná cuentas y revisá vencimientos. Se avisa desde 7 días antes."><Link to="/gestion/socios/nuevo" className="button primary">Nuevo socio</Link></PageHeader>
        <ResourceState resource={resource}>{resource.data?.length === 0 ? <EmptyState>Todavía no hay socios registrados.</EmptyState> : <ul className="records">{resource.data?.map(socio => <li key={socio.id}>
            <div className="record-heading"><h2>{socio.nombre} {socio.apellido}</h2><span className="badge">{socio.estado}</span></div><p>{socio.email} · DNI {socio.dni}</p>
            <p>{socio.membresia ? `Membresía ${socio.membresia.estado} · vence ${fechaHora(socio.membresia.fechaVencimiento)}` : 'Sin membresía'}</p>
            {socio.proximaAVencer && <p className="field-error">Atención: vence dentro de los próximos 7 días.</p>}
            {socio.tipoPlan && <p>Plan solicitado: {socio.tipoPlan}</p>}
            <Link to={`/gestion/socios/${socio.id}`} className="button secondary">Ver y editar socio</Link>
        </li>)}</ul>}</ResourceState>
    </>;
}
