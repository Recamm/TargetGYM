import { useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { obtenerClase, crearClase, actualizarClase } from '../services/clasesService.js';
import { listarInstructores } from '../services/sociosService.js';
import useResource from '../utils/useResource.js';
import { useNotifications } from '../components/NotificationContext.js';
import ResourceState from '../components/ResourceState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ClaseForm from '../components/ClaseForm.jsx';
export default function ClaseFormPage() {
    const { id } = useParams(), navigate = useNavigate(), notices = useNotifications();
    const loader = useCallback(signal => Promise.all([listarInstructores(signal), id ? obtenerClase(id, signal) : Promise.resolve(null)]), [id]);
    const resource = useResource(loader);
    return <><PageHeader title={id ? 'Editar clase' : 'Nueva clase'} description="Los horarios se interpretan en la zona de Buenos Aires." /><ResourceState resource={resource}>
        {resource.data && <ClaseForm key={id ?? 'nueva'} initial={resource.data[1] ?? {}} instructores={resource.data[0]} onCancel={() => navigate('/gestion/clases')} onSubmit={async body => {
            await (id ? actualizarClase(id, body) : crearClase(body)); notices.notify(id ? 'Clase actualizada.' : 'Clase creada.'); navigate('/gestion/clases');
        }} />}
    </ResourceState></>;
}
