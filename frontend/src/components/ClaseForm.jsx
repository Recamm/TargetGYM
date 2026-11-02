import { useState } from 'react';
import { useNotifications } from './NotificationContext.js';
import { validarClase, enfocarError, fechaActual } from '../utils/validation.js';
import FormField from './FormField.jsx';
import Button from './Button.jsx';

export default function ClaseForm({ initial = {}, instructores, onSubmit, onCancel }) {
    const [values, setValues] = useState({ nombre: '', tipo: '', fecha: '', horaInicio: '', cupoMaximo: '', instructorId: '', duracionMinutos: '', ...initial });
    const [errors, setErrors] = useState({}), [busy, setBusy] = useState(false);
    const notices = useNotifications();
    const change = event => { setValues(previous => ({ ...previous, [event.target.name]: event.target.value })); setErrors(previous => ({ ...previous, [event.target.name]: undefined })); };
    async function submit(event) {
        event.preventDefault();
        const next = validarClase(values); setErrors(next);
        if (Object.keys(next).length) { notices.notify('Revisá los campos indicados.', 'error'); enfocarError(event.currentTarget, next); return; }
        const body = Object.fromEntries(['nombre','tipo','fecha','horaInicio','cupoMaximo','instructorId','duracionMinutos'].map(name => [name, ['cupoMaximo','instructorId','duracionMinutos'].includes(name) ? Number(values[name]) : values[name]]));
        setBusy(true);
        try { await onSubmit(body); } catch (failure) { notices.error(failure); } finally { setBusy(false); }
    }
    const field = (name, label, props = {}) => <FormField name={name} label={label} value={values[name]} onChange={change} error={errors[name]} disabled={busy} required {...props} />;
    return <form noValidate className="form-panel" onSubmit={submit} aria-busy={busy}>
        <div className="form-grid">
            {field('nombre', 'Nombre de la clase', { maxLength: 120 })}
            {field('tipo', 'Actividad', { maxLength: 120 })}
            {field('fecha', 'Fecha', { type: 'date', min: fechaActual() })}
            {field('horaInicio', 'Hora de inicio', { type: 'time' })}
            {field('duracionMinutos', 'Duración (minutos)', { type: 'number', min: 1, max: 480 })}
            {field('cupoMaximo', 'Cupo máximo', { type: 'number', min: 1, max: 1000 })}
            {field('instructorId', 'Instructor', { options: [{ value: '', label: 'Seleccioná un instructor' }, ...instructores.filter(item => item.estado === 'activo').map(item => ({ value: item.id, label: `${item.nombre} ${item.apellido}` }))] })}
        </div>
        {instructores.length === 0 && <p>Primero agregá un instructor desde Gestión.</p>}
        <div className="actions"><Button variant="secondary" onClick={onCancel} disabled={busy}>Cancelar</Button><Button type="submit" busy={busy}>Guardar clase</Button></div>
    </form>;
}
