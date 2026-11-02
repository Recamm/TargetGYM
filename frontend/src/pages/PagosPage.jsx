import { useCallback, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { listarSocios } from '../services/sociosService.js';
import { listarPlanesSocio, listarPagos, registrarPago, listarMetodosPagoGestion, eliminarPago } from '../services/membresiasService.js';
import { importeCobro, descuentoCondicionado, descuentoAutomatico, tieneDescuento, metodoAdmitido } from '../utils/planes.js';
import useResource from '../utils/useResource.js';
import { dinero, fechaHora } from '../utils/validation.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import MetodoPagoField from '../components/MetodoPagoField.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PagoAnulado from '../components/PagoAnulado.jsx';
import PagoDescuento from '../components/PagoDescuento.jsx';
const loader = async signal => {
    const [socios, pagos, metodos] = await Promise.all([listarSocios(signal), listarPagos(signal), listarMetodosPagoGestion(signal)]);
    return { socios, pagos, metodos };
};
export default function PagosPage() {
    const resource = useResource(loader), [params] = useSearchParams(), notices = useNotifications();
    const [values, setValues] = useState({ socioId: params.get('socio') ?? '', tipoPlan: null, metodoPago: null, aplicarDescuento: false, confirmarRequisitos: false }), [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);
    const [confirmarPago, setConfirmarPago] = useState(false);
    const [eliminando, setEliminando] = useState(null), [motivo, setMotivo] = useState(''), [mostrarAnulados, setMostrarAnulados] = useState(false);
    const focusTrasEliminar = useRef(null);
    const getReturnFocus = useCallback(() => focusTrasEliminar.current, []);
    const pagosVisibles = resource.data?.pagos.filter(pago => mostrarAnulados || !pago.anuladoEn) ?? [];
    const socioSolicitado = resource.data?.socios.find(item => item.id === Number(values.socioId));
    const tipoPlan = values.tipoPlan ?? socioSolicitado?.tipoPlan ?? '';
    const metodoPago = values.metodoPago ?? socioSolicitado?.metodoPagoSolicitado ?? 'Efectivo';
    const cargarPlanes = useCallback(signal => values.socioId ? listarPlanesSocio(values.socioId, signal) : Promise.resolve([]), [values.socioId]);
    const planes = useResource(cargarPlanes);
    const operacion = useRef(crypto.randomUUID());
    const change = event => {
        const { name, value } = event.target;
        setValues(previous => ({ ...previous, [name]: value, ...(name === 'socioId' ? { tipoPlan: null, metodoPago: null } : {}), aplicarDescuento: false, confirmarRequisitos: false }));
        setConfirmarPago(false);
        setErrors(previous => ({ ...previous, [name]: undefined }));
    };
    const plan = planes.data?.find(item => item.tipo === tipoPlan);
    const condicionado = plan && descuentoCondicionado(plan) && !descuentoAutomatico(plan);
    const metodoAdmiteDescuento = plan && (!plan.metodoDescuento || plan.metodoDescuento === metodoPago);
    async function submit(event) {
        event.preventDefault();
        if (resource.loading || resource.error) { notices.notify('Reintentá cargar los datos de caja antes de registrar el pago.', 'error'); return; }
        const next = {};
        if (!resource.data.socios.some(item => item.id === Number(values.socioId) && item.estado !== 'baja')) next.socioId = 'Seleccioná un socio disponible.';
        if (planes.loading || planes.error || !plan?.precioCentavos) next.tipoPlan = 'Seleccioná un plan con precio configurado.';
        if (!metodoAdmitido(plan, metodoPago) || !resource.data.metodos.some(metodo => metodo.codigo === metodoPago)) next.metodoPago = 'Seleccioná un método admitido por este plan.';
        if (plan?.requisitosAcceso && !values.confirmarRequisitos) next.confirmarRequisitos = 'Verificá los requisitos de acceso antes de registrar el pago.';
        if (!confirmarPago) next.pagoConfirmado = 'Confirmá que recibiste el dinero antes de activar la membresía.';
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); event.currentTarget.elements.namedItem(Object.keys(next)[0])?.focus(); return; }
        setBusy(true);
        try {
            const result = await registrarPago({ ...values, tipoPlan, metodoPago, socioId: Number(values.socioId), operacionId: operacion.current });
            notices.notify(`Pago ${dinero(result.montoCentavos)} registrado. Membresía actualizada.`);
            setValues(previous => ({ ...previous, tipoPlan: '', aplicarDescuento: false, confirmarRequisitos: false }));
            setConfirmarPago(false);
            operacion.current = crypto.randomUUID(); resource.reload();
        } catch (failure) { notices.error(failure); }
        finally { setBusy(false); }
    }
    return <><PageHeader title="Pagos de membresía" description="Registrá solo dinero recibido y verificado. Esta acción activa o renueva la membresía; no cobra dinero desde la web." /><ResourceState resource={resource}>{resource.data && <>
        <form noValidate className="form-panel" onSubmit={submit}><div className="form-grid">
            <FormField name="socioId" label="Socio" value={values.socioId} onChange={change} error={errors.socioId} disabled={busy} options={[{ value: '', label: 'Seleccionar socio' }, ...resource.data.socios.filter(item => item.estado !== 'baja').map(item => ({ value: item.id, label: `${item.nombre} ${item.apellido} · ${item.email}` }))]} />
            <ResourceState resource={planes}><FormField name="tipoPlan" label="Plan" value={tipoPlan} onChange={change} error={errors.tipoPlan} disabled={busy || !values.socioId || planes.loading} options={[{ value: '', label: 'Seleccionar plan' }, ...(planes.data ?? []).filter(item => item.precioCentavos !== null).map(item => ({ value: item.tipo, label: `${item.nombre}${item.habilitado ? '' : ' · Solo renovación'}` }))]} /></ResourceState>
            <MetodoPagoField metodos={resource.data.metodos} plan={plan} administrador label="Método de pago" value={metodoPago} onChange={change} error={errors.metodoPago} disabled={busy || resource.loading || Boolean(resource.error)} />
        </div>
            {condicionado && tieneDescuento(plan) && <><p>{plan.descuentoPorcentaje > 0 ? `${plan.descuentoPorcentaje}% de descuento.` : `Precio promocional: ${dinero(plan.precioDescuentoCentavos)}.`} {plan.metodoDescuento && `Solo con ${plan.metodoDescuento.toLowerCase()}. `}{plan.condicionesDescuento}</p>
                <label className="check-field"><input type="checkbox" checked={values.aplicarDescuento} onChange={event => { setValues(previous => ({ ...previous, aplicarDescuento: event.target.checked })); setConfirmarPago(false); }} disabled={busy || !metodoAdmiteDescuento} />Confirmo que se cumplen las condiciones y aplico el descuento</label>
                {!metodoAdmiteDescuento && <p className="help-text">El método elegido no admite este descuento. Se cobra el precio base.</p>}
            </>}
            {plan && descuentoAutomatico(plan) && metodoAdmiteDescuento && <p className="help-text">Precio promocional aplicado automáticamente por el método de pago.</p>}
            {plan?.requisitosAcceso && <><p>{plan.requisitosAcceso}</p><label className="check-field"><input name="confirmarRequisitos" type="checkbox" checked={values.confirmarRequisitos} onChange={event => { setValues(previous => ({ ...previous, confirmarRequisitos: event.target.checked })); setConfirmarPago(false); setErrors(previous => ({ ...previous, confirmarRequisitos: undefined })); }} disabled={busy} aria-invalid={errors.confirmarRequisitos ? true : undefined} aria-describedby={errors.confirmarRequisitos ? 'requisitos-error' : undefined} />Confirmo que verifiqué los requisitos de acceso del plan</label>{errors.confirmarRequisitos && <p id="requisitos-error" className="field-error">{errors.confirmarRequisitos}</p>}</>}
            {plan?.precioCentavos && <p className="payment-total" role="status">Importe: {dinero(importeCobro(plan, metodoPago, values.aplicarDescuento))}</p>}
            {socioSolicitado?.pagoReportadoEn && <p className="help-text">El socio informó una transferencia. Verificá el ingreso del dinero; su aviso no confirma el cobro.</p>}
            <label className="check-field"><input id="pagoConfirmado" name="pagoConfirmado" type="checkbox" checked={confirmarPago} onChange={event => { setConfirmarPago(event.target.checked); setErrors(previous => ({ ...previous, pagoConfirmado: undefined })); }}
                disabled={busy} required aria-invalid={errors.pagoConfirmado ? true : undefined} aria-describedby={errors.pagoConfirmado ? 'pagoConfirmado-error' : undefined} />Confirmo que recibí el pago y quiero activar o renovar la membresía</label>
            {errors.pagoConfirmado && <p id="pagoConfirmado-error" className="field-error">{errors.pagoConfirmado}</p>}
            <Button type="submit" busy={busy} disabled={planes.loading || Boolean(planes.error) || resource.loading || Boolean(resource.error)}>Registrar pago</Button></form>
        <h2 id="pagos-title" tabIndex={-1}>Pagos registrados</h2>
        <label className="check-field"><input type="checkbox" checked={mostrarAnulados} onChange={event => setMostrarAnulados(event.target.checked)} />Mostrar pagos anulados</label>
        {pagosVisibles.length === 0 ? <EmptyState>{resource.data.pagos.length === 0 ? 'No hay pagos registrados.' : 'No hay pagos vigentes. Podés consultar los anulados.'}</EmptyState> : <ul className="records">{pagosVisibles.map(item => <li key={item.id}>
            <span className="badge">Pago #{item.id}</span><strong>{item.socio} · {dinero(item.montoCentavos)}</strong><p>{item.nombrePlan} · {item.metodoPago} · {fechaHora(item.fecha)}</p>
            <PagoDescuento pago={item} />
            <PagoAnulado pago={item} administrador />
            {!item.anuladoEn && <Button variant="danger" disabled={busy || resource.loading || Boolean(resource.error)} onClick={() => { focusTrasEliminar.current = null; setEliminando(item); setMotivo(''); }}>Eliminar pago</Button>}
        </li>)}</ul>}
    </>}</ResourceState>
        {eliminando && <ConfirmDialog title="¿Eliminar este pago?" confirmLabel="Eliminar pago" getReturnFocus={getReturnFocus} onClose={() => setEliminando(null)} onConfirm={async () => {
            await eliminarPago(eliminando.id, { motivo });
            notices.notify('Pago anulado. La membresía se recalculó con los pagos válidos.');
            focusTrasEliminar.current = document.getElementById('pagos-title');
            setEliminando(null); setConfirmarPago(false); resource.reload(); planes.reload();
        }}><p>Pago #{eliminando.id}: {eliminando.socio} · {dinero(eliminando.montoCentavos)} · {eliminando.nombrePlan} · {eliminando.metodoPago} · {fechaHora(eliminando.fecha)}.</p>
            <p>Se anulará el pago y se recalculará la membresía con los pagos válidos. Las reservas se ajustarán a la vigencia resultante. Se conserva el historial y no se devuelve dinero automáticamente.</p>
            <FormField name="motivoAnulacion" label="Motivo (opcional)" value={motivo} onChange={event => setMotivo(event.target.value)} maxLength={500} multiline hint="Por ejemplo: pago registrado dos veces." />
        </ConfirmDialog>}
    </>;
}
