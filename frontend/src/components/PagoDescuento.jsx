import { dinero } from '../utils/validation.js';

export default function PagoDescuento({ pago }) {
    return <>
        {pago.descuentoPorcentaje > 0 ? <p>{pago.descuentoPorcentaje}% de descuento aplicado. {pago.condicionesDescuento}</p>
            : pago.descuentoCentavos > 0 && <p>Descuento aplicado: {dinero(pago.descuentoCentavos)}. {pago.condicionesDescuento}</p>}
        {pago.confirmacionRequisitos && pago.requisitosAcceso && <p>Requisitos verificados: {pago.requisitosAcceso}</p>}
    </>;
}
