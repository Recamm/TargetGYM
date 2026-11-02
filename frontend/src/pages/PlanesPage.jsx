import { useState } from 'react';
import { listarPlanes, configurarPlan } from '../services/membresiasService.js';
import useResource from '../utils/useResource.js';
import { useNotifications } from '../components/NotificationContext.js';
import { dinero } from '../utils/validation.js';
import GestionNav from '../components/GestionNav.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState from '../components/ResourceState.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
function PlanForm({ plan, reload }) {
    const [precio, setPrecio] = useState(plan.precioCentavos === null ? '' : (plan.precioCentavos / 100).toFixed(2)), [descuento, setDescuento] = useState(String(plan.descuentoPorcentaje));
    const [errors, setErrors] = useState({}), [busy, setBusy] = useState(false), notices = useNotifications();
    async function submit(event) {
        event.preventDefault();
        const normalizado = precio.replace(',', '.');
        const centavos = Math.round(Number(normalizado) * 100), porcentaje = Number(descuento);
        const next = {};
        if (!/^\d+(\.\d{1,2})?$/.test(normalizado) || centavos <= 0 || centavos > 100000000) next.precio = 'Ingresá un precio positivo, hasta ARS 1.000.000.';
        if (!/^\d+$/.test(descuento) || !Number.isInteger(porcentaje) || porcentaje < 0 || porcentaje > 99) next.descuento = 'Ingresá un descuento entero de 0 a 99%.';
        if (!next.precio && !next.descuento && Math.round(centavos * (100 - porcentaje) / 100) < 1) next.descuento = 'El precio final debe ser de al menos un centavo.';
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); event.currentTarget.elements.namedItem(next.precio ? `precio-${plan.tipo}` : 'descuento-anual')?.focus(); return; }
        setBusy(true);
        try { await configurarPlan(plan.tipo, { precioCentavos: centavos, descuentoPorcentaje: plan.tipo === 'anual' ? porcentaje : 0 }); notices.notify(`Plan ${plan.tipo} actualizado.`); reload(); }
        catch (failure) { notices.error(failure); }
        finally { setBusy(false); }
    }
    return <form className="form-panel" noValidate onSubmit={submit}><h2>Plan {plan.tipo}</h2><p>{plan.meses} {plan.meses === 1 ? 'mes calendario' : 'meses calendario'}</p>
        <FormField name={`precio-${plan.tipo}`} label="Precio base (ARS)" inputMode="decimal" value={precio} onChange={event => setPrecio(event.target.value)} disabled={busy} error={errors.precio} required />
        {plan.tipo === 'anual' && <FormField name="descuento-anual" label="Descuento anual (%)" type="number" min="0" max="99" value={descuento} onChange={event => setDescuento(event.target.value)} disabled={busy} error={errors.descuento} />}
        <p>{plan.precioCentavos === null ? 'Sin configurar: no se pueden registrar pagos de este plan.' : `Precio vigente: ${dinero(Math.round(plan.precioCentavos * (100 - plan.descuentoPorcentaje) / 100))}`}</p><Button type="submit" busy={busy}>Guardar precio</Button>
    </form>;
}
export default function PlanesPage() {
    const resource = useResource(listarPlanes);
    return <><GestionNav /><PageHeader title="Planes y precios" description="No hay importes inventados. Configurá precios reales antes de registrar pagos; el descuento anual no se traslada a otros planes." /><ResourceState resource={resource}>
        <div className="card-grid">{resource.data?.map(plan => <PlanForm key={`${plan.tipo}:${plan.precioCentavos}:${plan.descuentoPorcentaje}`} plan={plan} reload={resource.reload} />)}</div>
    </ResourceState></>;
}
