import { Link } from 'react-router-dom';
import { listarClases } from '../services/clasesService.js';
import useResource from '../utils/useResource.js';
import PageHeader from '../components/PageHeader.jsx';
import ClaseCard from '../components/ClaseCard.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
export default function InstructorPage() {
    const resource = useResource(listarClases, 30000);
    return <><PageHeader title="Mis clases asignadas" description="El servidor limita la consulta a tus clases. Registrá la asistencia desde el inicio." /><ResourceState resource={resource}><h2 className="list-title">Clases a tu cargo</h2>
        {resource.data?.length === 0 ? <EmptyState>No tenés clases asignadas.</EmptyState> : <div className="card-grid">{resource.data?.map(clase => <ClaseCard key={clase.id} clase={clase}><Link className="button secondary" to={`/instructor/clases/${clase.id}/asistencia`}>Ver participantes y asistencia</Link></ClaseCard>)}</div>}
    </ResourceState></>;
}
