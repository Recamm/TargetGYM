import { useState } from 'react';
import { miMembresia, listarPlanesRenovacion, misPagos, solicitarPlan, listarMetodosPago } from '../services/membresiasService.js';
import { importePlan, importeCobro, metodoAdmitido } from '../utils/planes.js';
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
import MetodoPagoField from '../components/MetodoPagoField.jsx';
import PagoAnulado from '../components/PagoAnulado.jsx';
import PlanDetails from '../components/PlanDetails.jsx';
import PagoDescuento from '../components/PagoDescuento.jsx';
const loader = async signal => {
    const [membresia, planes, pagos, metodos] = await Promise.all([miMembresia(signal), listarPlanesRenovacion(signal), misPagos(signal), listarMetodosPago(signal)]);
    return { membresia, planes, pagos, metodos };
};
export default function MembresiaPage() {
    const resource = useResource(loader), { usuario, refresh } = useAuth(), notices = useNotifications();
    const [tipoPlan, setTipoPlan] = useState(''), [metodoPago, setMetodoPago] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState(''), [errorMetodo, setErrorMetodo] = useState('');
    const disponibles = (resource.data?.planes ?? []).filter(plan => plan.precioCentavos !== null);
    const seleccionado = disponibles.find(plan => plan.tipo === tipoPlan);
    const metodoDisponible = metodoAdmitido(seleccionado, metodoPago) && resource.data?.metodos.some(metodo => metodo.codigo === metodoPago && metodo.habilitado && metodo.permiteSocio);
    async function solicitar(event) {
        event.preventDefault();
        if (!disponibles.some(plan => plan.tipo === tipoPlan) || !metodoDisponible || resource.loading || resource.error) {
            setError(disponibles.some(plan => plan.tipo === tipoPlan) ? '' : 'Elegí un plan disponible.'); setErrorMetodo(metodoDisponible ? '' : 'Elegí un método de pago disponible.');
            notices.notify('Revisá el plan y el método de pago disponibles.', 'error');
            event.currentTarget.elements.namedItem(!tipoPlan ? 'tipoPlan' : 'metodoPago')?.focus(); return;
        }
        setBusy(true);
        try { await solicitarPlan({ tipoPlan, metodoPago }); notices.notify('Solicitud enviada. El administrador debe registrar el pago para activar o renovar la membresía.'); await refresh(); resource.reload(); }
        catch (failure) { notices.error(failure); resource.reload(); }
        finally { setBusy(false); }
    }
    return <><SocioNav /><PageHeader title="Mi membresía" description="Tu plan, vencimiento y pagos. Las renovaciones anticipadas conservan los días restantes." />
        {usuario.estado !== 'activo' && <p className="notice error">Tu cuenta está {usuario.estado}. Consultá al administrador antes de reservar.</p>}
        <ResourceState resource={resource}>{resource.data && <>
            {resource.data.membresia ? <article className="summary-panel"><h2>{resource.data.membresia.nombrePlan}</h2><span className="badge">{resource.data.membresia.estado}</span><p>Vencimiento: {fechaHora(resource.data.membresia.fechaVencimiento)}</p></article> : <EmptyState>Todavía no tenés una membresía activa. El administrador debe registrar tu primer pago.</EmptyState>}
            <PagoPendiente />
            <form noValidate className="form-panel compact-form" onSubmit={solicitar}><h2>Contratar o renovar</h2>
                <FormField name="tipoPlan" label="Elegí tu plan" value={tipoPlan} onChange={event => { setTipoPlan(event.target.value); setMetodoPago(''); setError(''); }} error={error} disabled={busy || disponibles.length === 0} options={[{ value: '', label: 'Seleccionar plan' }, ...disponibles.map(plan => ({ value: plan.tipo, label: `${plan.nombre}: ${dinero(importePlan(plan))}${plan.habilitado ? '' : ' · Solo renovación'}` }))]} />
                {disponibles.filter(plan => plan.tipo === tipoPlan).map(plan => <div key={plan.tipo}><PlanPrice plan={plan} /><PlanDetails plan={plan} />{!plan.habilitado && <p>Este plan está cerrado a nuevos socios. Podés renovarlo porque ya lo tuviste.</p>}</div>)}
                {disponibles.length === 0 && <p>No hay planes con precio disponibles para contratar o renovar. Consultá en el gimnasio.</p>}
                <MetodoPagoField metodos={resource.data.metodos} plan={seleccionado} value={metodoPago} onChange={event => { setMetodoPago(event.target.value); setErrorMetodo(''); }} error={errorMetodo} disabled={busy || disponibles.length === 0 || resource.loading || Boolean(resource.error)} required />
                {metodoDisponible && <InstruccionesPago metodo={metodoPago} />}
                {seleccionado && metodoDisponible && <p role="status">Importe a pagar en recepción: {dinero(importeCobro(seleccionado, metodoPago))}</p>}
                <p>Solicitá el plan y coordiná el pago en el gimnasio. No se procesa un cobro online.</p><Button type="submit" busy={busy} disabled={disponibles.length === 0 || !resource.data.metodos.some(metodo => metodo.habilitado && metodo.permiteSocio && metodoAdmitido(seleccionado, metodo.codigo)) || resource.loading || Boolean(resource.error)}>Enviar solicitud</Button>
            </form>
            <h2>Mis pagos</h2>{resource.data.pagos.length === 0 ? <EmptyState>No hay pagos registrados.</EmptyState> : <ul className="records">{resource.data.pagos.map(pago => <li key={pago.id}><strong>{dinero(pago.montoCentavos)} · {pago.nombrePlan}</strong><p>{fechaHora(pago.fecha)} · {pago.metodoPago}</p><PagoDescuento pago={pago} /><PagoAnulado pago={pago} /></li>)}</ul>}
        </>}</ResourceState>
    </>;
}
