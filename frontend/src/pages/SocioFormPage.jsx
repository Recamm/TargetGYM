import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { crearSocio, obtenerSocio, actualizarSocio, historialSocio } from '../services/sociosService.js';
import useResource from '../utils/useResource.js';
import { fechaHora, dinero } from '../utils/validation.js';
import { useNotifications } from '../components/NotificationContext.js';
import GestionNav from '../components/GestionNav.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState from '../components/ResourceState.jsx';
import UsuarioForm from '../components/UsuarioForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
export default function SocioFormPage() {
    const { id } = useParams(), navigate = useNavigate(), notices = useNotifications();
    const [pendiente, setPendiente] = useState(null);
    const loader = useCallback(async signal => id ? Promise.all([obtenerSocio(id, signal), historialSocio(id, signal)]) : [null, []], [id]);
    const resource = useResource(loader);
    async function guardar(body) {
        await (id ? actualizarSocio(id, body) : crearSocio(body));
        notices.notify(id ? 'Socio actualizado.' : 'Socio creado.');
        if (id) resource.reload(); else navigate('/gestion/socios');
    }
    return <><GestionNav /><PageHeader title={id ? 'Gestionar socio' : 'Nuevo socio'} description="El historial se conserva al suspender o dar de baja una cuenta." />
        <ResourceState resource={resource}>{resource.data && <>
            <UsuarioForm key={id ?? 'nuevo'} initial={resource.data[0] ?? {}} editar={Boolean(id)} gestionarEstado={Boolean(id)} elegirPlan={!id} onCancel={() => navigate('/gestion/socios')} onSubmit={async body => {
                if (id && body.estado !== 'activo' && body.estado !== resource.data[0].estado) setPendiente(body); else await guardar(body);
            }} />
            {id && <><h2>Historial de membresías y pagos</h2><Link className="button secondary" to={`/gestion/pagos?socio=${id}`}>Registrar pago de este socio</Link>
                <ul className="records">{resource.data[0].membresias.map(item => <li key={item.id}>Plan {item.tipoPlan} · {item.estado} · {fechaHora(item.fechaInicio)} a {fechaHora(item.fechaVencimiento)}</li>)}</ul>
                <ul className="records">{resource.data[0].pagos.map(item => <li key={item.id}>{dinero(item.montoCentavos)} · {item.metodoPago} · {fechaHora(item.fecha)}</li>)}</ul>
                <h2>Asistencia registrada</h2><ul className="records">{resource.data[1].map(item => <li key={item.id}>{item.nombre} · {item.fecha} · {item.horaInicio} h</li>)}</ul>
            </>}
        </>}</ResourceState>
        {pendiente && <ConfirmDialog title={pendiente.estado === 'baja' ? '¿Dar de baja al socio?' : '¿Suspender al socio?'} onClose={() => setPendiente(null)} onConfirm={async () => { await guardar(pendiente); setPendiente(null); }}>
            <p>Sus reservas futuras se cancelarán. La cuenta, los pagos y el historial se conservan.</p>
        </ConfirmDialog>}
    </>;
}
