import { listarReportes } from '../services/inscripcionesService.js';
import useResource from '../utils/useResource.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
export default function ReportesPage() {
    const resource = useResource(listarReportes);
    return <><PageHeader title="Asistencia y ocupación" description="Datos registrados por clase. Las clases eliminadas conservan su historial." /><ResourceState resource={resource}>
        {resource.data?.length === 0 ? <EmptyState>No hay clases para generar reportes.</EmptyState> : <ul className="records">{resource.data?.map(item => <li key={item.id}><h2>{item.nombre}</h2><p>{item.fecha}</p><dl className="report-values"><div><dt>Inscripciones no canceladas</dt><dd>{item.inscripciones}</dd></div><div><dt>Ocupación</dt><dd>{Math.round(item.inscripciones / item.cupoMaximo * 100)}%</dd></div><div><dt>Asistencias finalizadas</dt><dd>{item.asistencias}</dd></div></dl></li>)}</ul>}
    </ResourceState></>;
}
