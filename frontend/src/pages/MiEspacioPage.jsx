import { Link } from 'react-router-dom';
import { useAuth } from '../components/AuthContext.js';
import { miMembresia } from '../services/membresiasService.js';
import useResource from '../utils/useResource.js';
import { fechaHora } from '../utils/validation.js';
import PageHeader from '../components/PageHeader.jsx';
import SocioNav from '../components/SocioNav.jsx';
import PagoPendiente from '../components/PagoPendiente.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import Button from '../components/Button.jsx';

const loader = async signal => ({ membresia: await miMembresia(signal) });
export default function MiEspacioPage() {
    const { usuario, refresh } = useAuth(), membresia = useResource(loader, 30000);
    const actual = membresia.data?.membresia;
    return <><SocioNav /><PageHeader title={`Hola, ${usuario.nombre}`} description="Tu espacio en Target. Revisá tu membresía y organizá tu próxima clase.">
        <Button variant="secondary" onClick={() => { refresh(); membresia.reload(); }}>Actualizar estado</Button>
    </PageHeader>
        {usuario.estado !== 'activo' && <p className="notice error">Tu cuenta está {usuario.estado}. Consultá al gimnasio antes de reservar.</p>}
        <PagoPendiente />
        <ResourceState resource={membresia}>
            {actual ? <article className="summary-panel"><h2>{actual.nombrePlan}</h2><span className="badge">{actual.estado === 'activa' ? 'Membresía activa' : 'Membresía vencida'}</span>
                <p>Vencimiento: {fechaHora(actual.fechaVencimiento)}.</p><Link className="text-link" to="/mi-membresia">Ver membresía y pagos</Link>
            </article> : !membresia.loading && !membresia.error && !usuario.tipoPlan && <EmptyState>Todavía no tenés una membresía. Elegí un plan y coordiná el pago con el gimnasio.</EmptyState>}
        </ResourceState>
        <div className="actions"><Link className="button primary" to="/clases">Ver clases</Link><Link className="button secondary" to="/mi-membresia">Contratar o renovar</Link></div>
        {!actual || actual.estado !== 'activa' ? <p className="help-text">Podés consultar la agenda. Para reservar necesitás una membresía activa y una cuenta habilitada.</p> : null}
    </>;
}
