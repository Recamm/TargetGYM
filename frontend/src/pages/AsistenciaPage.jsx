import { useCallback, useState } from 'react';
import { useParams } from 'react-router-dom';
import { obtenerClase } from '../services/clasesService.js';
import { participantes, marcarAsistencia } from '../services/inscripcionesService.js';
import useResource from '../utils/useResource.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import Button from '../components/Button.jsx';
export default function AsistenciaPage() {
    const { id } = useParams(), notices = useNotifications(), [busy, setBusy] = useState(null);
    const loader = useCallback(signal => Promise.all([obtenerClase(id, signal), participantes(id, signal)]), [id]);
    const resource = useResource(loader, 30000);
    async function guardar(reserva, asistio) {
        setBusy(reserva.id);
        try { await marcarAsistencia(reserva.id, asistio); notices.notify(`Asistencia de ${reserva.socio} registrada.`); resource.reload(); }
        catch (failure) { notices.error(failure); }
        finally { setBusy(null); }
    }
    return <><PageHeader title="Control de asistencia" description="Las reservas y la asistencia son datos distintos. No se registra asistencia antes del inicio." /><ResourceState resource={resource}>{resource.data && <>
        <h2>{resource.data[0].nombre} · {resource.data[0].fecha} · {resource.data[0].horaInicio} h</h2>
        {resource.data[1].length === 0 ? <EmptyState>No hay inscripciones para esta clase.</EmptyState> : <ul className="records">{resource.data[1].map(item => <li key={item.id}><div className="record-heading"><h3>{item.socio}</h3><span className="badge">{item.estado}</span></div><p>{item.asistio === null ? 'Asistencia sin registrar' : item.asistio ? 'Presente' : 'Ausente'}</p>
            <div className="actions">{[true, false].map(value => <Button key={String(value)} variant="secondary" disabled={busy !== null || !['En curso','Finalizada'].includes(item.estado)} onClick={() => guardar(item, value)}>{value ? 'Marcar presente' : 'Marcar ausente'}</Button>)}</div>
        </li>)}</ul>}
    </>}</ResourceState></>;
}
