import { useState } from 'react';
import FormField from './FormField.jsx';
import Button from './Button.jsx';
import { useNotifications } from './NotificationContext.js';
import { validarUsuario, enfocarError } from '../utils/validation.js';

const fields = [
    ['nombre','Nombre','text','given-name'], ['apellido','Apellido','text','family-name'],
    ['email','Email','email','email'], ['dni','DNI','text','off'],
    ['telefono','Teléfono','tel','tel'], ['fechaNacimiento','Fecha de nacimiento','date','bday'],
];

export default function UsuarioForm({ initial = {}, editar = false, instructor = false, gestionarEstado = false, elegirPlan = false, onSubmit, buttonLabel = 'Guardar', onCancel }) {
    const [values, setValues] = useState({ nombre: '', apellido: '', email: '', dni: '', telefono: '', fechaNacimiento: '', password: '', tipoPlan: 'mensual', especialidad: '', estado: 'activo', ...initial });
    const [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);
    const notices = useNotifications();
    const change = event => { const { name, value } = event.target; setValues(previous => ({ ...previous, [name]: value })); setErrors(previous => ({ ...previous, [name]: undefined })); };
    async function submit(event) {
        event.preventDefault();
        const next = validarUsuario(values, { editar, instructor });
        setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); enfocarError(event.currentTarget, next); return; }
        const body = Object.fromEntries(fields.map(([name]) => [name, values[name]]));
        if (!editar || values.password) body.password = values.password;
        if (elegirPlan) body.tipoPlan = values.tipoPlan;
        if (instructor) body.especialidad = values.especialidad;
        if (gestionarEstado) body.estado = values.estado;
        setBusy(true);
        try { await onSubmit(body); }
        catch (failure) { notices.error(failure); }
        finally { setBusy(false); }
    }
    return <form className="form-panel" noValidate onSubmit={submit} aria-busy={busy}>
        <div className="form-grid">{fields.map(([name, label, type, autoComplete]) => <FormField key={name} name={name} label={label} type={type} autoComplete={autoComplete} value={values[name] ?? ''} onChange={change} error={errors[name]} required disabled={busy} />)}
            <FormField name="password" label={editar ? 'Nueva contraseña (opcional)' : 'Contraseña'} type="password" autoComplete={editar ? 'new-password' : 'new-password'} value={values.password} onChange={change} error={errors.password} required={!editar} disabled={busy} hint="Al menos 8 caracteres, una mayúscula y un número." />
            {elegirPlan && <FormField name="tipoPlan" label="Plan que querés contratar" options={['mensual','trimestral','anual'].map(value => ({ value, label: value[0].toUpperCase() + value.slice(1) }))} value={values.tipoPlan} onChange={change} disabled={busy} hint="La membresía se activa cuando el administrador registra el pago." />}
            {instructor && <FormField name="especialidad" label="Especialidad" value={values.especialidad} onChange={change} error={errors.especialidad} disabled={busy} required />}
            {gestionarEstado && <FormField name="estado" label="Estado del socio" options={['activo','suspendido','baja'].map(value => ({ value, label: value }))} value={values.estado} onChange={change} disabled={busy} hint="Suspender o dar de baja cancela sus reservas futuras y conserva el historial." />}
        </div>
        <div className="actions">{onCancel && <Button variant="secondary" disabled={busy} onClick={onCancel}>Cancelar</Button>}<Button type="submit" busy={busy}>{buttonLabel}</Button></div>
    </form>;
}
