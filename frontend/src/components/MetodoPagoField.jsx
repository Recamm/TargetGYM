import FormField from './FormField.jsx';
import { metodoAdmitido } from '../utils/planes.js';

export default function MetodoPagoField({ metodos, plan, administrador = false, value, name = 'metodoPago', label = 'Cómo vas a pagar', placeholder = 'Seleccionar método', disabled, hint, ...props }) {
    const opciones = metodos.filter(metodo => metodoAdmitido(plan, metodo.codigo) && (administrador || (metodo.habilitado && metodo.permiteSocio)));
    const seleccionado = opciones.find(metodo => metodo.codigo === value);
    const aviso = administrador && seleccionado && !seleccionado.habilitado
        ? 'Método deshabilitado para socios. Como administrador podés usarlo para registrar un pago recibido.'
        : opciones.length === 0 ? 'No hay métodos de pago habilitados. Consultá en el gimnasio para coordinar tu asociación o renovación.' : hint;
    return <FormField {...props} name={name} label={label} value={value} disabled={disabled || opciones.length === 0} hint={aviso}
        options={[{ value: '', label: placeholder }, ...opciones.map(metodo => ({
            value: metodo.codigo, label: `${metodo.codigo}${administrador && !metodo.habilitado ? ' · Deshabilitado para socios' : ''}`,
        }))]} />;
}
