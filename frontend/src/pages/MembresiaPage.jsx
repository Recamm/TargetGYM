import { useState } from 'react';
import { miMembresia, listarPlanesRenovacion, misPagos, solicitarPlan } from '../services/membresiasService.js';
import { importePlan } from '../utils/planes.js';
import PlanPrice from '../components/PlanPrice.jsx';
import useResource from '../utils/useResource.js';
import { dinero, fechaHora } from '../utils/validation.js';
import { useAuth } from '../components/AuthContext.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import SocioNav from '../components/SocioNav.jsx';
import PagoPendiente from '../components/PagoPendiente.jsx';
import InstruccionesPago from '../components/InstruccionesPago.jsx';
const loader = async signal => {
    const [membresia, planes, pagos] = await Promise.all([miMembresia(signal), listarPlanesRenovacion(signal), misPagos(signal)]);
    return { membresia, planes, pagos };
};
export default function MembresiaPage() {
    const resource = useResource(loader), { usuario, refresh } = useAuth(), notices = useNotifications();
    const [tipoPlan, setTipoPlan] = useState(''), [metodoPago, setMetodoPago] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [errorMetodo, setErrorMetodo] = useState('');
    const disponibles = (resource.data?.planes ?? []).filter(plan => plan.precioCentavos !== null);
    async function solicitar(event) {
        event.preventDefault();
        if (!tipoPlan || !metodoPago) {
            setError(tipoPlan ? '' : 'Elegí un plan.'); setErrorMetodo(metodoPago ? '' : 'Elegí cómo vas a pagar.');
            event.currentTarget.elements.namedItem(!tipoPlan ? 'tipoPlan' : 'metodoPago')?.focus(); return;
        }
        setBusy(true);
        try { await solicitarPlan({ tipoPlan, metodoPago }); notices.notify('Solicitud enviada. El administrador debe registrar el pago para activar o renovar la membresía.'); await refresh(); resource.reload(); }
        catch (failure) { notices.error(failure); }
        finally { setBusy(false); }
    }
    return <><SocioNav /><PageHeader title="Mi membresía" description="Tu plan, vencimiento y pagos. Las renovaciones anticipadas conservan los días restantes." />
        {usuario.estado !== 'activo' && <p className="notice error">Tu cuenta está {usuario.estado}. Consultá al administrador antes de reservar.</p>}
        <ResourceState resource={resource}>{resource.data && <>
            {resource.data.membresia ? <article className="summary-panel"><h2>{resource.data.membresia.nombrePlan}</h2><span className="badge">{resource.data.membresia.estado}</span><p>Vencimiento: {fechaHora(resource.data.membresia.fechaVencimiento)}</p></article> : <EmptyState>Todavía no tenés una membresía activa. El administrador debe registrar tu primer pago.</EmptyState>}
            <PagoPendiente />
            <form className="form-panel compact-form" onSubmit={solicitar}><h2>Contratar o renovar</h2>
                <FormField name="tipoPlan" label="Elegí tu plan" value={tipoPlan} onChange={event => { setTipoPlan(event.target.value); setError(''); }} error={error} disabled={busy || disponibles.length === 0} options={[{ value: '', label: 'Seleccionar plan' }, ...disponibles.map(plan => ({ value: plan.tipo, label: `${plan.nombre}: ${dinero(importePlan(plan))}${plan.habilitado ? '' : ' · Solo renovación'}` }))]} />
                {disponibles.filter(plan => plan.tipo === tipoPlan).map(plan => <div key={plan.tipo}><PlanPrice plan={plan} />{!plan.habilitado && <p>Este plan está cerrado a nuevos socios. Podés renovarlo porque ya lo tuviste.</p>}</div>)}
                {disponibles.length === 0 && <p>No hay planes con precio disponibles para contratar o renovar. Consultá en el gimnasio.</p>}
                <FormField name="metodoPago" label="Cómo vas a pagar" value={metodoPago} onChange={event => { setMetodoPago(event.target.value); setErrorMetodo(''); }} error={errorMetodo} disabled={busy || disponibles.length === 0} required options={[{ value: '', label: 'Seleccionar método' }, { value: 'Efectivo', label: 'Efectivo' }, { value: 'Transferencia', label: 'Transferencia' }]} />
                {metodoPago && <InstruccionesPago metodo={metodoPago} />}
                <p>Solicitá el plan y coordiná el pago en el gimnasio. No se procesa un cobro online.</p><Button type="submit" busy={busy} disabled={disponibles.length === 0}>Enviar solicitud</Button>
            </form>
            <h2>Mis pagos</h2>{resource.data.pagos.length === 0 ? <EmptyState>No hay pagos registrados.</EmptyState> : <ul className="records">{resource.data.pagos.map(pago => <li key={pago.id}><strong>{dinero(pago.montoCentavos)} · {pago.nombrePlan}</strong><p>{fechaHora(pago.fecha)} · {pago.metodoPago}</p>{pago.descuentoPorcentaje > 0 && <p>{pago.descuentoPorcentaje}% de descuento aplicado. {pago.condicionesDescuento}</p>}</li>)}</ul>}
        </>}</ResourceState>
    </>;
}
