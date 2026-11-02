import { useCallback, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { crearSocio, obtenerSocio, actualizarSocio, historialSocio, crearInvitacion } from '../services/sociosService.js';
import useResource from '../utils/useResource.js';
import { fechaHora, dinero } from '../utils/validation.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState from '../components/ResourceState.jsx';
import UsuarioForm from '../components/UsuarioForm.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { listarPlanes, cambiarPlanSocio } from '../services/membresiasService.js';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';

function InvitacionSocio({ socioId }) {
    const notices = useNotifications(), [enlace, setEnlace] = useState(null), [busy, setBusy] = useState(false);
    async function generar() {
        setBusy(true);
        try {
            const result = await crearInvitacion(socioId);
            const url = new URL('/activar-acceso', window.location.origin);
            url.hash = `token=${result.token}`;
            setEnlace({ url: url.href, expira: result.expira });
            notices.notify('Enlace generado. Entregalo únicamente a este socio; cualquier enlace anterior deja de funcionar.');
        } catch (error) { notices.error(error); }
        finally { setBusy(false); }
    }
    async function copiar() {
        try {
            if (!navigator.clipboard?.writeText) throw new Error('No se puede copiar automáticamente. Seleccioná el enlace y copialo manualmente.');
            await navigator.clipboard.writeText(enlace.url);
            notices.notify('Enlace copiado.');
        } catch (error) { notices.error(error); }
    }
    return <section className="form-panel" aria-labelledby="invitacion-title"><h2 id="invitacion-title">Primer acceso del socio</h2>
        <p>El socio elegirá su contraseña. El enlace es personal, dura 48 horas y funciona una sola vez. No confirma un pago ni activa una membresía.</p>
        <Button variant="secondary" busy={busy} onClick={generar}>{enlace ? 'Generar nuevo enlace' : 'Generar enlace de acceso'}</Button>
        {enlace && <><p className="help-text">Vence: {fechaHora(enlace.expira)}. No lo publiques ni lo compartas con otra persona.</p>
            <FormField name="enlaceAcceso" label="Enlace personal de primer acceso" value={enlace.url} readOnly autoComplete="off" onFocus={event => event.target.select()} />
            <Button variant="secondary" onClick={copiar}>Copiar enlace de acceso</Button>
        </>}
    </section>;
}

function CambioPlan({ socioId, actual, reload }) {
    const planes = useResource(listarPlanes), notices = useNotifications();
    const [tipoPlan, setTipoPlan] = useState(''), [error, setError] = useState(''), [confirmar, setConfirmar] = useState(false);
    const disponibles = (planes.data ?? []).filter(plan => plan.tipo !== actual.tipoPlan && plan.precioCentavos !== null);
    return <section className="form-panel" aria-labelledby="cambio-plan-title"><h2 id="cambio-plan-title">Cambiar plan vigente</h2>
        <p>Plan actual: {actual.nombrePlan}. Se mantienen las fechas de inicio y vencimiento, sin registrar un cobro ni modificar pagos anteriores.</p>
        <ResourceState resource={planes}><form onSubmit={event => {
            event.preventDefault();
            if (!disponibles.some(plan => plan.tipo === tipoPlan)) { setError('Elegí un plan habilitado diferente.'); event.currentTarget.elements.namedItem('nuevoPlan')?.focus(); return; }
            setConfirmar(true);
        }}><FormField name="nuevoPlan" label="Nuevo plan del socio" value={tipoPlan} onChange={event => { setTipoPlan(event.target.value); setError(''); }} error={error}
            options={[{ value: '', label: 'Seleccionar plan' }, ...disponibles.map(plan => ({ value: plan.tipo, label: plan.nombre }))]} disabled={!disponibles.length} />
            <Button type="submit" variant="secondary" disabled={!disponibles.length}>Cambiar plan</Button>
        </form></ResourceState>
        {confirmar && <ConfirmDialog title="¿Cambiar el plan del socio?" onClose={() => setConfirmar(false)} onConfirm={async () => {
            await cambiarPlanSocio(socioId, { tipoPlan }); notices.notify('Plan cambiado. La vigencia y los pagos anteriores se conservan.'); setConfirmar(false); reload();
        }}><p>Nuevo plan: {disponibles.find(plan => plan.tipo === tipoPlan)?.nombre}. El vencimiento seguirá siendo {fechaHora(actual.fechaVencimiento)}. No se realizará un cobro.</p></ConfirmDialog>}
    </section>;
}
export default function SocioFormPage() {
    const { id } = useParams(), navigate = useNavigate(), notices = useNotifications();
    const [pendiente, setPendiente] = useState(null);
    const loader = useCallback(async signal => id ? Promise.all([obtenerSocio(id, signal), historialSocio(id, signal)]) : [null, []], [id]);
    const resource = useResource(loader);
    async function guardar(body) {
        const result = await (id ? actualizarSocio(id, body) : crearSocio(body));
        notices.notify(id ? 'Socio actualizado.' : 'Socio creado.');
        if (id) resource.reload(); else navigate(`/gestion/socios/${result.id}`);
    }
    return <><PageHeader title={id ? 'Gestionar socio' : 'Nuevo socio'} description="Crear una cuenta no activa su membresía. El historial se conserva al suspender o dar de baja." />
        <ResourceState resource={resource}>{resource.data && (!id || resource.data[0]?.id === Number(id)) && <>
            <UsuarioForm key={id ?? 'nuevo'} initial={resource.data[0] ?? {}} editar={Boolean(id)} invitacion gestionarEstado={Boolean(id)} elegirPlan={!id} onCancel={() => navigate('/gestion/socios')} onSubmit={async body => {
                if (id && body.estado !== 'activo' && body.estado !== resource.data[0].estado) setPendiente(body); else await guardar(body);
            }} />
            {id && <>{resource.data[0].accesoPendiente && resource.data[0].estado === 'activo' && <InvitacionSocio socioId={id} />}
                {resource.data[0].nombrePlanSolicitado && <p className="help-text">Plan solicitado: {resource.data[0].nombrePlanSolicitado}. {resource.data[0].metodoPagoSolicitado ?? 'Método por coordinar'}.{resource.data[0].pagoReportadoEn && ' El socio informó una transferencia; verificá el dinero recibido antes de activar.'}</p>}
                {resource.data[0].membresias[0]?.estado === 'activa' && <CambioPlan key={resource.data[0].membresias[0].id} socioId={id} actual={resource.data[0].membresias[0]} reload={resource.reload} />}
                <h2>Historial de membresías y pagos</h2><Link className="button secondary" to={`/gestion/pagos?socio=${id}`}>Registrar pago de este socio</Link>
                <ul className="records">{resource.data[0].membresias.map(item => <li key={item.id}>{item.nombrePlan} · {item.estado} · {fechaHora(item.fechaInicio)} a {fechaHora(item.fechaVencimiento)}</li>)}</ul>
                <ul className="records">{resource.data[0].pagos.map(item => <li key={item.id}>{item.nombrePlan} · {dinero(item.montoCentavos)} · {item.metodoPago} · {fechaHora(item.fecha)}{item.descuentoPorcentaje > 0 && <p>{item.descuentoPorcentaje}% de descuento aplicado. {item.condicionesDescuento}</p>}</li>)}</ul>
                {resource.data[0].cambiosPlan.length > 0 && <><h3>Cambios administrativos de plan</h3><ul className="records">{resource.data[0].cambiosPlan.map(item => <li key={item.id}>{item.planAnterior} a {item.planNuevo}<p>{fechaHora(item.fecha)} · {item.administrador}. Sin cobro ni cambio de vigencia.</p></li>)}</ul></>}
                <h2>Asistencia registrada</h2><ul className="records">{resource.data[1].map(item => <li key={item.id}>{item.nombre} · {item.fecha} · {item.horaInicio} h</li>)}</ul>
            </>}
        </>}</ResourceState>
        {pendiente && <ConfirmDialog title={pendiente.estado === 'baja' ? '¿Dar de baja al socio?' : '¿Suspender al socio?'} onClose={() => setPendiente(null)} onConfirm={async () => { await guardar(pendiente); setPendiente(null); }}>
            <p>Sus reservas futuras se cancelarán. La cuenta, los pagos y el historial se conservan.</p>
        </ConfirmDialog>}
    </>;
}
