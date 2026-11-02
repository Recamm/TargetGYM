import { miHistorial } from '../services/inscripcionesService.js';
import useResource from '../utils/useResource.js';
import { fechaTexto } from '../utils/validation.js';
import SocioNav from '../components/SocioNav.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
export default function HistorialPage() {
    const resource = useResource(miHistorial);
    return <><SocioNav /><PageHeader title="Mi asistencia" description="Clases finalizadas con tu asistencia registrada. Una reserva no acredita asistencia." />
        <ResourceState resource={resource}>{resource.data?.length === 0 ? <EmptyState>Todavía no hay asistencias finalizadas en tu historial.</EmptyState> : <ul className="records">{resource.data?.map(item => <li key={item.id}><h2>{item.nombre}</h2><p>{fechaTexto(item.fecha)} · {item.horaInicio} h</p><span className="badge">Asistencia confirmada</span></li>)}</ul>}</ResourceState>
    </>;
}
