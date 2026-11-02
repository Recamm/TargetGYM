import { useEffect, useState } from 'react';
import { misInscripciones, cancelarInscripcion } from '../services/inscripcionesService.js';
import useResource from '../utils/useResource.js';
import { fechaTexto } from '../utils/validation.js';
import { useNotifications } from '../components/NotificationContext.js';
import SocioNav from '../components/SocioNav.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
export default function InscripcionesPage() {
    const resource = useResource(misInscripciones, 30000), notices = useNotifications();
    const [seleccion, setSeleccion] = useState(null);
    const [ahora, setAhora] = useState(Date.now);
    useEffect(() => {
        const timer = setInterval(() => setAhora(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);
    return <><SocioNav /><PageHeader title="Mis inscripciones" description="Consultá tus reservas y su estado. Para cancelar, deben faltar al menos 2 horas." />
        <ResourceState resource={resource}>{resource.data?.length === 0 ? <EmptyState>Aún no reservaste una clase. Elegí una desde la agenda.</EmptyState> : <ul className="records">{resource.data?.map(reserva => {
            const cancelable = ['Pendiente','Confirmada'].includes(reserva.estado) && new Date(reserva.inicio).getTime() - ahora >= 2 * 3600000;
            return <li key={reserva.id}><div className="record-heading"><h2>{reserva.nombre}</h2><span className="badge">{reserva.estado}</span></div><p>{fechaTexto(reserva.fecha)} · {reserva.horaInicio} h</p>
                {reserva.estado === 'Pendiente' && <p>Regularizá tu membresía dentro del período de gracia de 3 días para conservar tu lugar. No podrás asistir si sigue vencida al iniciar la clase.</p>}
                {['Pendiente','Confirmada'].includes(reserva.estado) && <Button variant="secondary" disabled={!cancelable} onClick={() => setSeleccion(reserva)}>{cancelable ? 'Cancelar inscripción' : 'Cancelación fuera de plazo'}</Button>}
            </li>;
        })}</ul>}</ResourceState>
        {seleccion && <ConfirmDialog title="¿Cancelar tu inscripción?" onClose={() => setSeleccion(null)} onConfirm={async () => {
            await cancelarInscripcion(seleccion.id); notices.notify('Inscripción cancelada. Tu lugar quedó disponible.'); setSeleccion(null); resource.reload();
        }}><p>{seleccion.nombre} · {seleccion.fecha} · {seleccion.horaInicio} h</p></ConfirmDialog>}
    </>;
}
