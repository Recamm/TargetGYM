import { useState } from 'react';
import { miMembresia, listarPlanes, misPagos, solicitarPlan } from '../services/membresiasService.js';
import useResource from '../utils/useResource.js';
import { dinero, fechaHora } from '../utils/validation.js';
import { useAuth } from '../components/AuthContext.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import SocioNav from '../components/SocioNav.jsx';
const loader = async signal => {
    const [membresia, planes, pagos] = await Promise.all([miMembresia(signal), listarPlanes(signal), misPagos(signal)]);
    return { membresia, planes, pagos };
};
export default function MembresiaPage() {
    const resource = useResource(loader), { usuario, refresh } = useAuth(), notices = useNotifications();
    const [tipoPlan, setTipoPlan] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    const disponibles = (resource.data?.planes ?? []).filter(plan => plan.precioCentavos !== null);
    async function solicitar(event) {
        event.preventDefault();
        if (!tipoPlan) { setError('Elegí un plan.'); return; }
        setBusy(true);
        try { await solicitarPlan({ tipoPlan }); notices.notify('Solicitud enviada. El administrador debe registrar el pago para activar o renovar la membresía.'); await refresh(); resource.reload(); }
        catch (failure) { notices.error(failure); }
        finally { setBusy(false); }
    }
    return <><SocioNav /><PageHeader title="Mi membresía" description="Tu plan, vencimiento y pagos. Las renovaciones anticipadas conservan los días restantes." />
        {usuario.estado !== 'activo' && <p className="notice error">Tu cuenta está {usuario.estado}. Consultá al administrador antes de reservar.</p>}
        <ResourceState resource={resource}>{resource.data && <>
            {resource.data.membresia ? <article className="summary-panel"><h2>Plan {resource.data.membresia.tipoPlan}</h2><span className="badge">{resource.data.membresia.estado}</span><p>Vencimiento: {fechaHora(resource.data.membresia.fechaVencimiento)}</p></article> : <EmptyState>Todavía no tenés una membresía activa. El administrador debe registrar tu primer pago.</EmptyState>}
            {usuario.tipoPlan && <p className="help-text">Plan solicitado: {usuario.tipoPlan}. Pendiente de registro del pago.</p>}
            <form className="form-panel compact-form" onSubmit={solicitar}><h2>Contratar o renovar</h2>
                <FormField name="tipoPlan" label="Elegí tu plan" value={tipoPlan} onChange={event => { setTipoPlan(event.target.value); setError(''); }} error={error} disabled={busy || disponibles.length === 0} options={[{ value: '', label: 'Seleccionar plan' }, ...disponibles.map(plan => ({ value: plan.tipo, label: `${plan.tipo}: ${dinero(Math.round(plan.precioCentavos * (100 - plan.descuentoPorcentaje) / 100))}` }))]} />
                {disponibles.length === 0 && <p>El administrador todavía no configuró los precios. Consultá en el gimnasio.</p>}
                <p>Solicitá el plan y coordiná el pago en el gimnasio. No se procesa un cobro online.</p><Button type="submit" busy={busy} disabled={disponibles.length === 0}>Enviar solicitud</Button>
            </form>
            <h2>Mis pagos</h2>{resource.data.pagos.length === 0 ? <EmptyState>No hay pagos registrados.</EmptyState> : <ul className="records">{resource.data.pagos.map(pago => <li key={pago.id}><strong>{dinero(pago.montoCentavos)} · {pago.tipoPlan}</strong><p>{fechaHora(pago.fecha)} · {pago.metodoPago}</p></li>)}</ul>}
        </>}</ResourceState>
    </>;
}
