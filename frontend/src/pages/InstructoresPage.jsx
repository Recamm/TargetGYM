import { useState } from 'react';
import { listarInstructores, crearInstructor } from '../services/sociosService.js';
import useResource from '../utils/useResource.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import UsuarioForm from '../components/UsuarioForm.jsx';
import Button from '../components/Button.jsx';
export default function InstructoresPage() {
    const resource = useResource(listarInstructores), [crear, setCrear] = useState(false), notices = useNotifications();
    return <><PageHeader title="Instructores" description="El administrador crea sus cuentas y los asigna a las clases. Cada instructor accede solo a sus clases y asistencia."><Button onClick={() => setCrear(true)}>Nuevo instructor</Button></PageHeader>
        {crear && <UsuarioForm instructor buttonLabel="Crear instructor" onCancel={() => setCrear(false)} onSubmit={async body => { await crearInstructor(body); notices.notify('Instructor creado.'); setCrear(false); resource.reload(); }} />}
        <ResourceState resource={resource}>{resource.data?.length === 0 ? <EmptyState>No hay instructores. Agregá el primero para crear clases.</EmptyState> : <ul className="records">{resource.data?.map(item => <li key={item.id}><h2>{item.nombre} {item.apellido}</h2><p>{item.especialidad} · {item.email}</p><span className="badge">{item.estado}</span></li>)}</ul>}</ResourceState>
    </>;
}
