import { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarSocios } from '../services/sociosService.js';
import { listarPlanes, listarPagos, registrarPago } from '../services/membresiasService.js';
import useResource from '../utils/useResource.js';
import { dinero, fechaHora } from '../utils/validation.js';
import { useNotifications } from '../components/NotificationContext.js';
import GestionNav from '../components/GestionNav.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
const loader = async signal => {
    const [socios, planes, pagos] = await Promise.all([listarSocios(signal), listarPlanes(signal), listarPagos(signal)]);
    return { socios, planes, pagos };
};
export default function PagosPage() {
    const resource = useResource(loader), [params] = useSearchParams(), notices = useNotifications();
    const [values, setValues] = useState({ socioId: params.get('socio') ?? '', tipoPlan: '', metodoPago: 'Efectivo' }), [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);
    const operacion = useRef(crypto.randomUUID());
    const change = event => { setValues(previous => ({ ...previous, [event.target.name]: event.target.value })); setErrors(previous => ({ ...previous, [event.target.name]: undefined })); };
    const plan = resource.data?.planes.find(item => item.tipo === values.tipoPlan);
    async function submit(event) {
        event.preventDefault();
        const next = {};
        if (!resource.data.socios.some(item => item.id === Number(values.socioId) && item.estado !== 'baja')) next.socioId = 'Seleccioná un socio disponible.';
        if (!plan?.precioCentavos) next.tipoPlan = 'Seleccioná un plan con precio configurado.';
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); event.currentTarget.elements.namedItem(Object.keys(next)[0])?.focus(); return; }
        setBusy(true);
        try {
            const result = await registrarPago({ ...values, socioId: Number(values.socioId), operacionId: operacion.current });
            notices.notify(`Pago ${dinero(result.montoCentavos)} registrado. Membresía actualizada.`);
            setValues(previous => ({ ...previous, tipoPlan: '' }));
            operacion.current = crypto.randomUUID(); resource.reload();
        } catch (failure) { notices.error(failure); }
        finally { setBusy(false); }
    }
    return <><GestionNav /><PageHeader title="Pagos de membresía" description="Registro manual de pagos realizados en el gimnasio. No se cobra dinero desde esta pantalla." /><ResourceState resource={resource}>{resource.data && <>
        <form noValidate className="form-panel" onSubmit={submit}><div className="form-grid">
            <FormField name="socioId" label="Socio" value={values.socioId} onChange={change} error={errors.socioId} disabled={busy} options={[{ value: '', label: 'Seleccionar socio' }, ...resource.data.socios.filter(item => item.estado !== 'baja').map(item => ({ value: item.id, label: `${item.nombre} ${item.apellido} · ${item.email}` }))]} />
            <FormField name="tipoPlan" label="Plan" value={values.tipoPlan} onChange={change} error={errors.tipoPlan} disabled={busy} options={[{ value: '', label: 'Seleccionar plan' }, ...resource.data.planes.filter(item => item.precioCentavos !== null).map(item => ({ value: item.tipo, label: item.tipo }))]} />
            <FormField name="metodoPago" label="Método de pago" value={values.metodoPago} onChange={change} disabled={busy} options={['Efectivo','Transferencia','Tarjeta'].map(value => ({ value, label: value }))} />
        </div>{plan?.precioCentavos && <p className="payment-total">Importe: {dinero(Math.round(plan.precioCentavos * (100 - plan.descuentoPorcentaje) / 100))}</p>}<Button type="submit" busy={busy}>Registrar pago</Button></form>
        <h2>Pagos registrados</h2>{resource.data.pagos.length === 0 ? <EmptyState>No hay pagos registrados.</EmptyState> : <ul className="records">{resource.data.pagos.map(item => <li key={item.id}><strong>{item.socio} · {dinero(item.montoCentavos)}</strong><p>{item.tipoPlan} · {item.metodoPago} · {fechaHora(item.fecha)}</p></li>)}</ul>}
    </>}</ResourceState></>;
}
