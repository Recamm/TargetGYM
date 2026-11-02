import { fechaHora } from '../utils/validation.js';

export default function PagoAnulado({ pago, administrador = false }) {
    if (!pago.anuladoEn) return null;
    return <div><span className="badge">Anulado</span>
        <p className="help-text">Anulado el {fechaHora(pago.anuladoEn)}{administrador && ` por ${pago.anuladoPor}`}. No cuenta como un pago vigente.</p>
        {pago.motivoAnulacion && <p>Motivo: {pago.motivoAnulacion}</p>}
    </div>;
}
