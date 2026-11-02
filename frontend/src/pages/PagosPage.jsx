import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarSocios } from '../services/sociosService.js';
import { listarPlanesSocio, listarPagos, registrarPago } from '../services/membresiasService.js';
import { importePlan, descuentoCondicionado } from '../utils/planes.js';
import useResource from '../utils/useResource.js';
import { dinero, fechaHora } from '../utils/validation.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
const loader = async signal => {
    const [socios, pagos] = await Promise.all([listarSocios(signal), listarPagos(signal)]);
    return { socios, pagos };
};
export default function PagosPage() {
    const resource = useResource(loader), [params] = useSearchParams(), notices = useNotifications();
    const [values, setValues] = useState({ socioId: params.get('socio') ?? '', tipoPlan: null, metodoPago: null, aplicarDescuento: false }), [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);
    const [confirmarPago, setConfirmarPago] = useState(false);
    const socioSolicitado = resource.data?.socios.find(item => item.id === Number(values.socioId));
    const tipoPlan = values.tipoPlan ?? socioSolicitado?.tipoPlan ?? '';
    const metodoPago = values.metodoPago ?? socioSolicitado?.metodoPagoSolicitado ?? 'Efectivo';
    const cargarPlanes = useCallback(signal => values.socioId ? listarPlanesSocio(values.socioId, signal) : Promise.resolve([]), [values.socioId]);
    const planes = useResource(cargarPlanes);
    const operacion = useRef(crypto.randomUUID());
    const change = event => {
        const { name, value } = event.target;
        setValues(previous => ({ ...previous, [name]: value, ...(name === 'socioId' ? { tipoPlan: null, metodoPago: null } : {}), aplicarDescuento: false }));
        setConfirmarPago(false);
        setErrors(previous => ({ ...previous, [name]: undefined }));
    };
    const plan = planes.data?.find(item => item.tipo === tipoPlan);
    const condicionado = plan && descuentoCondicionado(plan);
    const metodoAdmiteDescuento = plan && (!plan.metodoDescuento || plan.metodoDescuento === metodoPago);
    async function submit(event) {
        event.preventDefault();
        const next = {};
        if (!resource.data.socios.some(item => item.id === Number(values.socioId) && item.estado !== 'baja')) next.socioId = 'Seleccioná un socio disponible.';
        if (!plan?.precioCentavos) next.tipoPlan = 'Seleccioná un plan con precio configurado.';
        if (!confirmarPago) next.pagoConfirmado = 'Confirmá que recibiste el dinero antes de activar la membresía.';
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); event.currentTarget.elements.namedItem(Object.keys(next)[0])?.focus(); return; }
        setBusy(true);
        try {
            const result = await registrarPago({ ...values, tipoPlan, metodoPago, socioId: Number(values.socioId), operacionId: operacion.current });
            notices.notify(`Pago ${dinero(result.montoCentavos)} registrado. Membresía actualizada.`);
            setValues(previous => ({ ...previous, tipoPlan: '', aplicarDescuento: false }));
            setConfirmarPago(false);
            operacion.current = crypto.randomUUID(); resource.reload();
        } catch (failure) { notices.error(failure); }
        finally { setBusy(false); }
    }
    return <><PageHeader title="Pagos de membresía" description="Registrá solo dinero recibido y verificado. Esta acción activa o renueva la membresía; no cobra dinero desde la web." /><ResourceState resource={resource}>{resource.data && <>
        <form noValidate className="form-panel" onSubmit={submit}><div className="form-grid">
            <FormField name="socioId" label="Socio" value={values.socioId} onChange={change} error={errors.socioId} disabled={busy} options={[{ value: '', label: 'Seleccionar socio' }, ...resource.data.socios.filter(item => item.estado !== 'baja').map(item => ({ value: item.id, label: `${item.nombre} ${item.apellido} · ${item.email}` }))]} />
            <ResourceState resource={planes}><FormField name="tipoPlan" label="Plan" value={tipoPlan} onChange={change} error={errors.tipoPlan} disabled={busy || !values.socioId || planes.loading} options={[{ value: '', label: 'Seleccionar plan' }, ...(planes.data ?? []).filter(item => item.precioCentavos !== null).map(item => ({ value: item.tipo, label: `${item.nombre}${item.habilitado ? '' : ' · Solo renovación'}` }))]} /></ResourceState>
            <FormField name="metodoPago" label="Método de pago" value={metodoPago} onChange={change} disabled={busy} options={['Efectivo','Transferencia','Tarjeta'].map(value => ({ value, label: value }))} />
        </div>
            {condicionado && plan.descuentoPorcentaje > 0 && <><p>{plan.descuentoPorcentaje}% de descuento. {plan.metodoDescuento && `Solo con ${plan.metodoDescuento.toLowerCase()}. `}{plan.condicionesDescuento}</p>
                <label className="check-field"><input type="checkbox" checked={values.aplicarDescuento} onChange={event => { setValues(previous => ({ ...previous, aplicarDescuento: event.target.checked })); setConfirmarPago(false); }} disabled={busy || !metodoAdmiteDescuento} />Confirmo que se cumplen las condiciones y aplico el descuento</label>
                {!metodoAdmiteDescuento && <p className="help-text">El método elegido no admite este descuento. Se cobra el precio base.</p>}
            </>}
            {plan?.precioCentavos && <p className="payment-total" role="status">Importe: {dinero(importePlan(plan, values.aplicarDescuento))}</p>}
            {socioSolicitado?.pagoReportadoEn && <p className="help-text">El socio informó una transferencia. Verificá el ingreso del dinero; su aviso no confirma el cobro.</p>}
            <label className="check-field"><input id="pagoConfirmado" name="pagoConfirmado" type="checkbox" checked={confirmarPago} onChange={event => { setConfirmarPago(event.target.checked); setErrors(previous => ({ ...previous, pagoConfirmado: undefined })); }}
                disabled={busy} required aria-invalid={errors.pagoConfirmado ? true : undefined} aria-describedby={errors.pagoConfirmado ? 'pagoConfirmado-error' : undefined} />Confirmo que recibí el pago y quiero activar o renovar la membresía</label>
            {errors.pagoConfirmado && <p id="pagoConfirmado-error" className="field-error">{errors.pagoConfirmado}</p>}
            <Button type="submit" busy={busy} disabled={planes.loading}>Registrar pago</Button></form>
        <h2>Pagos registrados</h2>{resource.data.pagos.length === 0 ? <EmptyState>No hay pagos registrados.</EmptyState> : <ul className="records">{resource.data.pagos.map(item => <li key={item.id}><strong>{item.socio} · {dinero(item.montoCentavos)}</strong><p>{item.nombrePlan} · {item.metodoPago} · {fechaHora(item.fecha)}</p>{item.descuentoPorcentaje > 0 && <p>{item.descuentoPorcentaje}% de descuento aplicado. {item.condicionesDescuento}</p>}</li>)}</ul>}
    </>}</ResourceState></>;
}
