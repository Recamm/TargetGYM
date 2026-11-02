import { useState } from 'react';
import { Link } from 'react-router-dom';
import { listarClases } from '../services/clasesService.js';
import { reservarClase } from '../services/inscripcionesService.js';
import useResource from '../utils/useResource.js';
import { fechaActual, semanaDe, moverSemana, fechaTexto } from '../utils/validation.js';
import { useAuth } from '../components/AuthContext.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import ClaseCard from '../components/ClaseCard.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import SocioNav from '../components/SocioNav.jsx';

export default function ClasesPage() {
    const resource = useResource(listarClases, 30000);
    const [semana, setSemana] = useState(fechaActual()), [tipo, setTipo] = useState(''), [reserva, setReserva] = useState(null);
    const { usuario } = useAuth(), notices = useNotifications();
    const dias = semana ? semanaDe(semana) : [];
    const clases = (resource.data ?? []).filter(clase => dias.includes(clase.fecha) && (!tipo || clase.tipo === tipo));
    return <>
        {usuario?.rol === 'Socio' && <SocioNav />}
        <PageHeader title="Tu próxima clase" description="Elegí la semana y encontrá una actividad a tu ritmo. La disponibilidad se actualiza cada 30 segundos." />
        <div className="filters"><FormField name="semana" label="Semana de referencia" type="date" value={semana} onChange={event => setSemana(event.target.value)} error={!semana ? 'Elegí una fecha para ver la agenda.' : undefined} />
            <FormField name="tipo" label="Actividad" value={tipo} onChange={event => setTipo(event.target.value)} options={[{ value: '', label: 'Todas las actividades' }, ...[...new Set((resource.data ?? []).map(clase => clase.tipo))].map(value => ({ value, label: value }))]} />
            <div className="actions"><Button variant="secondary" disabled={!semana} onClick={() => setSemana(moverSemana(semana, -1))}>Semana anterior</Button><Button variant="secondary" disabled={!semana} onClick={() => setSemana(moverSemana(semana, 1))}>Semana siguiente</Button><Button variant="quiet" onClick={() => { setSemana(fechaActual()); setTipo(''); }}>Limpiar filtros</Button></div>
        </div>
        <ResourceState resource={resource}>{clases.length === 0 ? <EmptyState>No hay clases para estos filtros. Probá otra semana o actividad.</EmptyState> : dias.map(dia => {
            const items = clases.filter(clase => clase.fecha === dia);
            return items.length > 0 && <section key={dia} className="day-group"><h2>{fechaTexto(dia)}</h2><div className="card-grid">{items.map(clase => <ClaseCard key={clase.id} clase={clase}>
                {usuario?.rol === 'Socio' ? <Button disabled={clase.estado !== 'Programada' || clase.cupoDisponible === 0} onClick={() => setReserva(clase)}>{clase.cupoDisponible === 0 ? 'Sin cupos' : 'Reservar lugar'}</Button> : !usuario && clase.estado === 'Programada' ? <Link className="button secondary" to="/login">Ingresar para reservar</Link> : null}
            </ClaseCard>)}</div></section>;
        })}</ResourceState>
        {usuario?.rol === 'Socio' && <p className="help-text">Para reservar necesitás una membresía activa. <Link to="/mi-membresia">Consultá tu membresía</Link>.</p>}
        {reserva && <ConfirmDialog title="Confirmar tu lugar" confirmLabel="Confirmar inscripción" onClose={() => setReserva(null)} onConfirm={async () => {
            await reservarClase(reserva.id); notices.notify(`Tu lugar en ${reserva.nombre} está confirmado.`); setReserva(null); resource.reload();
        }}><p>{reserva.nombre} · {fechaTexto(reserva.fecha)} · {reserva.horaInicio} h</p><p>Podés cancelar hasta 2 horas antes del inicio.</p></ConfirmDialog>}
    </>;
}
