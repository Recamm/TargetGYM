import { useCallback, useState } from 'react';
import FormField from './FormField.jsx';
import Button from './Button.jsx';
import { useNotifications } from './NotificationContext.js';
import { validarUsuario, enfocarError } from '../utils/validation.js';
import { listarPlanes, listarMetodosPago } from '../services/membresiasService.js';
import useResource from '../utils/useResource.js';
import ResourceState from './ResourceState.jsx';
import PlanPrice from './PlanPrice.jsx';
import InstruccionesPago from './InstruccionesPago.jsx';
import MetodoPagoField from './MetodoPagoField.jsx';
import PlanDetails from './PlanDetails.jsx';
import { metodoAdmitido, importeCobro } from '../utils/planes.js';
import { dinero } from '../utils/validation.js';

function PlanChoice({ resource, value, onChange, disabled, error, asociacion, required }) {
    const seleccionado = resource.data?.find(plan => plan.tipo === value);
    const disponibles = (resource.data ?? []).filter(plan => !asociacion || plan.precioCentavos !== null);
    return <ResourceState resource={resource}><FormField name="tipoPlan" label="Plan que querés contratar"
        options={[{ value: '', label: 'Seleccionar plan' }, ...disponibles.map(plan => ({ value: plan.tipo, label: plan.nombre }))]}
        value={value} onChange={onChange} disabled={disabled || disponibles.length === 0} error={error} required={required}
        hint={disponibles.length === 0 ? 'No hay planes habilitados con precio para contratar. Consultá en el gimnasio.' : 'La membresía se activa cuando el administrador registra el pago.'} />
        {seleccionado?.precioCentavos != null && <div className="selected-plan"><h3>{seleccionado.nombre}</h3><PlanPrice plan={seleccionado} /><PlanDetails plan={seleccionado} /><p>Precio en pesos argentinos por el período completo.</p></div>}
    </ResourceState>;
}

const fields = [
    ['nombre','Nombre','text','given-name'], ['apellido','Apellido','text','family-name'],
    ['email','Email','email','email'], ['dni','DNI','text','off'],
    ['telefono','Teléfono','tel','tel'], ['fechaNacimiento','Fecha de nacimiento','date','bday'],
];

export default function UsuarioForm({ initial = {}, editar = false, instructor = false, gestionarEstado = false, elegirPlan = false, asociacion = false, invitacion = false, onSubmit, buttonLabel = 'Guardar', onCancel }) {
    const cargarPlanes = useCallback(signal => elegirPlan ? listarPlanes(signal) : Promise.resolve([]), [elegirPlan]);
    const planes = useResource(cargarPlanes);
    const cargarMetodos = useCallback(signal => asociacion ? listarMetodosPago(signal) : Promise.resolve([]), [asociacion]);
    const metodos = useResource(cargarMetodos, asociacion ? 30000 : 0);
    const [values, setValues] = useState({ nombre: '', apellido: '', email: '', dni: '', telefono: '', fechaNacimiento: '', password: '', tipoPlan: '', metodoPago: '', especialidad: '', estado: 'activo', ...initial });
    const [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);
    const notices = useNotifications();
    const seleccionado = planes.data?.find(plan => plan.tipo === values.tipoPlan);
    const metodosAdmitidos = (metodos.data ?? []).filter(metodo => metodo.habilitado && metodo.permiteSocio && metodoAdmitido(seleccionado, metodo.codigo));
    const change = event => { const { name, value } = event.target; setValues(previous => ({ ...previous, [name]: value, ...(name === 'tipoPlan' ? { metodoPago: '' } : {}) })); setErrors(previous => ({ ...previous, [name]: undefined })); };
    async function submit(event) {
        event.preventDefault();
        const next = validarUsuario(values, { editar: editar || invitacion, instructor });
        if (elegirPlan && !invitacion && !values.tipoPlan) next.tipoPlan = 'Elegí un plan habilitado.';
        if (elegirPlan && values.tipoPlan && (planes.loading || planes.error || !planes.data?.some(plan => plan.tipo === values.tipoPlan && (!asociacion || plan.precioCentavos !== null)))) next.tipoPlan = 'Elegí un plan disponible del catálogo cargado.';
        if (asociacion && (metodos.loading || metodos.error || !metodoAdmitido(seleccionado, values.metodoPago) || !metodos.data?.some(metodo => metodo.codigo === values.metodoPago && metodo.habilitado && metodo.permiteSocio))) next.metodoPago = values.metodoPago ? 'Elegí un método de pago disponible.' : 'Elegí cómo vas a pagar.';
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); enfocarError(event.currentTarget, next); return; }
        const body = Object.fromEntries(fields.map(([name]) => [name, values[name]]));
        if (!invitacion && (!editar || values.password)) body.password = values.password;
        if (elegirPlan && values.tipoPlan) body.tipoPlan = values.tipoPlan;
        if (asociacion) body.metodoPago = values.metodoPago;
        if (instructor) body.especialidad = values.especialidad;
        if (gestionarEstado) body.estado = values.estado;
        setBusy(true);
        try { await onSubmit(body); }
        catch (failure) { notices.error(failure); if (asociacion) { metodos.reload(); planes.reload(); } }
        finally { setBusy(false); }
    }
    return <form className="form-panel" noValidate onSubmit={submit} aria-busy={busy}>
        {elegirPlan && <fieldset className="association-section"><legend>{invitacion ? 'Plan solicitado (opcional)' : 'Elegí tu plan'}</legend><PlanChoice resource={planes} value={values.tipoPlan} onChange={change} disabled={busy} error={errors.tipoPlan} asociacion={asociacion} required={!invitacion} /></fieldset>}
        {asociacion && <h2>Tus datos</h2>}
        <div className="form-grid">{fields.map(([name, label, type, autoComplete]) => <FormField key={name} name={name} label={label} type={type} autoComplete={autoComplete} value={values[name] ?? ''} onChange={change} error={errors[name]} required disabled={busy} />)}
            {!invitacion && <FormField name="password" label={editar ? 'Nueva contraseña (opcional)' : 'Contraseña'} type="password" autoComplete="new-password" value={values.password} onChange={change} error={errors.password} required={!editar} disabled={busy} hint="Al menos 8 caracteres, una mayúscula y un número." />}
            {instructor && <FormField name="especialidad" label="Especialidad" value={values.especialidad} onChange={change} error={errors.especialidad} disabled={busy} required />}
            {gestionarEstado && <FormField name="estado" label="Estado del socio" options={['activo','suspendido','baja'].map(value => ({ value, label: value }))} value={values.estado} onChange={change} disabled={busy} hint="Suspender o dar de baja cancela sus reservas futuras y conserva el historial." />}
        </div>
        {invitacion && <p className="help-text">El socio elegirá su contraseña mediante un enlace de primer acceso. Crear la cuenta no activa una membresía.</p>}
        {asociacion && <fieldset className="association-section"><legend>Cómo vas a pagar</legend>
            <ResourceState resource={metodos}><MetodoPagoField metodos={metodos.data ?? []} plan={seleccionado} value={values.metodoPago} onChange={change} error={errors.metodoPago} disabled={busy || metodos.loading || Boolean(metodos.error)} required /></ResourceState>
            {metodoAdmitido(seleccionado, values.metodoPago) && metodos.data?.some(metodo => metodo.codigo === values.metodoPago && metodo.habilitado && metodo.permiteSocio) && <InstruccionesPago metodo={values.metodoPago} />}
            {seleccionado?.precioCentavos != null && metodosAdmitidos.some(metodo => metodo.codigo === values.metodoPago) && <p role="status">Importe a pagar en recepción: {dinero(importeCobro(seleccionado, values.metodoPago))}</p>}
            <p className="help-text">Tu cuenta se crea ahora. El plan queda pendiente de pago y solo el administrador puede activar tu membresía. Los descuentos con condiciones requieren su confirmación.</p>
        </fieldset>}
        <div className="actions">{onCancel && <Button variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button>}<Button type="submit" busy={busy} disabled={asociacion && (metodos.loading || Boolean(metodos.error) || metodosAdmitidos.length === 0)}>{buttonLabel}</Button></div>
    </form>;
}
