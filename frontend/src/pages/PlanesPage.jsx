import { useState } from 'react';
import { listarPlanesGestion, crearPlan, configurarPlan, eliminarPlan } from '../services/membresiasService.js';
import useResource from '../utils/useResource.js';
import { enfocarError } from '../utils/validation.js';
import { useNotifications } from '../components/NotificationContext.js';
import PageHeader from '../components/PageHeader.jsx';
import ResourceState, { EmptyState } from '../components/ResourceState.jsx';
import FormField from '../components/FormField.jsx';
import Button from '../components/Button.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import PlanPrice from '../components/PlanPrice.jsx';

function PlanForm({ plan, onSaved, onCancel }) {
    const [values, setValues] = useState({ nombre: plan?.nombre ?? '', meses: String(plan?.meses ?? 1),
        precio: plan?.precioCentavos == null ? '' : (plan.precioCentavos / 100).toFixed(2), descuento: String(plan?.descuentoPorcentaje ?? 0),
        condiciones: plan?.condicionesDescuento ?? '', metodo: plan?.metodoDescuento ?? '', habilitado: plan?.habilitado ?? true });
    const [errors, setErrors] = useState({}), [busy, setBusy] = useState(false), notices = useNotifications();
    const change = event => { const { name, value } = event.target; setValues(previous => ({ ...previous, [name]: value })); setErrors(previous => ({ ...previous, [name]: undefined })); };
    async function submit(event) {
        event.preventDefault();
        const normalizado = values.precio.replace(',', '.');
        const centavos = values.precio === '' ? null : Math.round(Number(normalizado) * 100), porcentaje = Number(values.descuento);
        const next = {};
        if (!values.nombre.trim() || values.nombre.trim().length > 120) next.nombre = 'Completá el nombre (hasta 120 caracteres).';
        if (!/^\d+$/.test(values.meses) || Number(values.meses) < 1 || Number(values.meses) > 120) next.meses = 'Ingresá de 1 a 120 meses.';
        if (centavos !== null && (!/^\d+(\.\d{1,2})?$/.test(normalizado) || centavos <= 0 || centavos > 100000000)) next.precio = 'Ingresá un precio positivo, hasta ARS 1.000.000.';
        if (!/^\d+$/.test(values.descuento) || porcentaje < 0 || porcentaje > 99) next.descuento = 'Ingresá un descuento entero de 0 a 99%.';
        if (!next.precio && !next.descuento && centavos !== null && Math.round(centavos * (100 - porcentaje) / 100) < 1) next.descuento = 'El precio final debe ser de al menos un centavo.';
        if (values.condiciones.length > 500) next.condiciones = 'Usá hasta 500 caracteres.';
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); enfocarError(event.currentTarget, next); return; }
        setBusy(true);
        const body = { nombre: values.nombre.trim(), meses: Number(values.meses), precioCentavos: centavos, descuentoPorcentaje: porcentaje,
            condicionesDescuento: porcentaje ? values.condiciones.trim() : '', metodoDescuento: porcentaje ? values.metodo || null : null, habilitado: values.habilitado };
        try {
            await (plan ? configurarPlan(plan.tipo, body) : crearPlan(body));
            notices.notify(plan ? `${body.nombre} actualizado.` : 'Plan creado.');
            onSaved();
        } catch (failure) { notices.error(failure); }
        finally { setBusy(false); }
    }
    return <form className="form-panel" noValidate onSubmit={submit} aria-busy={busy}><h2>{plan ? 'Editar plan' : 'Nuevo plan'}</h2>
        <div className="form-grid">
            <FormField name="nombre" label="Nombre del plan" value={values.nombre} onChange={change} maxLength={120} disabled={busy} error={errors.nombre} required />
            <FormField name="meses" label="Duración (meses calendario)" type="number" min="1" max="120" value={values.meses} onChange={change} disabled={busy} error={errors.meses} required />
            <FormField name="precio" label="Precio base (ARS)" inputMode="decimal" value={values.precio} onChange={change} disabled={busy} error={errors.precio} hint="Total del período. Vacío: precio sin configurar, no admite pagos." />
            <FormField name="descuento" label="Descuento (%)" type="number" min="0" max="99" value={values.descuento} onChange={change} disabled={busy} error={errors.descuento} />
            <FormField name="metodo" label="Método para el descuento" value={values.metodo} onChange={change} disabled={busy || Number(values.descuento) === 0} options={[{ value: '', label: 'Cualquier método' }, ...['Efectivo','Transferencia','Tarjeta'].map(value => ({ value, label: value }))]} />
            <FormField name="condiciones" label="Condiciones del descuento (opcional)" multiline maxLength={500} value={values.condiciones} onChange={change} disabled={busy || Number(values.descuento) === 0} error={errors.condiciones} hint="Por ejemplo: pago presencial. El administrador confirma su cumplimiento al cobrar." />
        </div>
        <label className="check-field"><input type="checkbox" checked={values.habilitado} onChange={event => setValues(previous => ({ ...previous, habilitado: event.target.checked }))} disabled={busy} />Habilitado para nuevos socios y visible en inicio</label>
        <div className="actions"><Button variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button><Button type="submit" busy={busy}>{plan ? 'Guardar cambios' : 'Crear plan'}</Button></div>
    </form>;
}

export default function PlanesPage() {
    const resource = useResource(listarPlanesGestion), notices = useNotifications();
    const [editor, setEditor] = useState(null), [operation, setOperation] = useState(null);
    const saved = () => { setEditor(null); resource.reload(); };
    return <><PageHeader title="Planes y precios" description="Creá planes y promociones. Deshabilitar evita nuevas contrataciones; los socios anteriores pueden renovar. Eliminar conserva el historial, pero impide toda renovación." />
        {editor ? <PlanForm plan={editor === 'nuevo' ? null : editor} onSaved={saved} onCancel={() => setEditor(null)} /> : <Button onClick={() => setEditor('nuevo')}>Nuevo plan</Button>}
        <ResourceState resource={resource}>
            {resource.data?.length === 0 && <EmptyState>No hay planes. Creá el primero para ofrecerlo en el gimnasio.</EmptyState>}
            <div className="card-grid plan-management">{resource.data?.map(plan => <article className="form-panel" key={plan.tipo} aria-labelledby={`gestion-${plan.tipo}`}>
                <h2 id={`gestion-${plan.tipo}`}>{plan.nombre}</h2><span className="badge">{plan.habilitado ? 'Habilitado' : 'Solo renovaciones'}</span>
                <p>{plan.meses} {plan.meses === 1 ? 'mes calendario' : 'meses calendario'}</p><PlanPrice plan={plan} />
                <div className="actions"><Button variant="secondary" disabled={Boolean(editor)} onClick={() => setEditor(plan)}>Editar</Button><Button variant="secondary" disabled={Boolean(editor)} onClick={() => setOperation({ plan, eliminar: false })}>{plan.habilitado ? 'Deshabilitar' : 'Habilitar'}</Button><Button variant="danger" disabled={Boolean(editor)} onClick={() => setOperation({ plan, eliminar: true })}>Eliminar</Button></div>
            </article>)}</div>
        </ResourceState>
        {operation && <ConfirmDialog title={operation.eliminar ? '¿Eliminar el plan?' : operation.plan.habilitado ? '¿Deshabilitar el plan?' : '¿Habilitar el plan?'} onClose={() => setOperation(null)} onConfirm={async () => {
            if (operation.eliminar) await eliminarPlan(operation.plan.tipo);
            else await configurarPlan(operation.plan.tipo, { habilitado: !operation.plan.habilitado });
            notices.notify(operation.eliminar ? 'Plan eliminado. El historial se conserva.' : operation.plan.habilitado ? 'Plan deshabilitado. Los socios anteriores pueden renovar.' : 'Plan habilitado.');
            setOperation(null); setEditor(null); resource.reload();
        }}><p>{operation.plan.nombre}. {operation.eliminar ? 'Se quitará del catálogo y no admitirá más renovaciones. Los pagos y membresías existentes se conservan.' : operation.plan.habilitado ? 'No aparecerá en inicio ni para nuevos socios. Las membresías actuales y sus renovaciones se mantienen.' : 'Volverá a aparecer en inicio y podrá contratarse por nuevos socios.'}</p></ConfirmDialog>}
    </>;
}
