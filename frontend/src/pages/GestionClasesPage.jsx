import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarClases, eliminarClase, cancelarClase } from '../services/clasesService.js';
import useResource from '../utils/useResource.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import ClaseCard from '../components/ClaseCard.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';

export default function GestionClasesPage() {
    const resource = useResource(listarClases), notices = useNotifications();
    const [operation, setOperation] = useState(null);
    return <><PageHeader title="Gestionar clases" description="Organizá actividades, instructores y cupos. Las modificaciones se reflejan en la agenda."><Link className="button primary" to="/gestion/clases/nueva">Nueva clase</Link></PageHeader>
        <ResourceState resource={resource}><h2 className="list-title">Clases registradas</h2>{resource.data?.length === 0 ? <EmptyState>Todavía no hay clases. Agregá un instructor y creá la primera.</EmptyState> : <div className="card-grid">{resource.data?.map(clase => <ClaseCard key={clase.id} clase={clase}>
            {clase.estado === 'Programada' && <Link className="button secondary" to={`/gestion/clases/${clase.id}/editar`}>Editar</Link>}
            <Link className="button quiet" to={`/gestion/clases/${clase.id}/asistencia`}>Asistencia</Link>
            {!['Cancelada','Finalizada'].includes(clase.estado) && <Button variant="quiet" onClick={() => setOperation({ clase, eliminar: false })}>Cancelar clase</Button>}
            <Button variant="quiet" onClick={() => setOperation({ clase, eliminar: true })}>Eliminar</Button>
        </ClaseCard>)}</div>}</ResourceState>
        {operation && <ConfirmDialog title={operation.eliminar ? '¿Eliminar esta clase?' : '¿Cancelar esta clase?'} onClose={() => setOperation(null)} onConfirm={async () => {
            await (operation.eliminar ? eliminarClase(operation.clase.id) : cancelarClase(operation.clase.id));
            notices.notify(operation.eliminar ? 'Clase eliminada. El historial se conserva.' : 'Clase cancelada y reservas liberadas.');
            setOperation(null); resource.reload();
        }}><p>{operation.clase.nombre} · {operation.clase.fecha} · {operation.clase.horaInicio} h</p><p>Se cancelarán las reservas activas. El historial de asistencia y pagos no se borra.</p></ConfirmDialog>}
    </>;
}
