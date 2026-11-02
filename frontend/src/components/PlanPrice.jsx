import { dinero } from '../utils/validation.js';
import { descuentoCondicionado, precioFinal } from '../utils/planes.js';

export default function PlanPrice({ plan }) {
    const condicionado = descuentoCondicionado(plan);
    return <>
        <p className="plan-price">{plan.precioCentavos === null ? 'Consultá el precio' : dinero(condicionado ? plan.precioCentavos : precioFinal(plan))}</p>
        {plan.precioCentavos !== null && plan.descuentoPorcentaje > 0 && <>
            <p className="plan-discount">{condicionado ? <span>Con descuento: {dinero(precioFinal(plan))}</span> : <><span className="sr-only">Precio sin descuento: </span><del>{dinero(plan.precioCentavos)}</del></>}<span>{plan.descuentoPorcentaje}% de descuento</span></p>
            {condicionado && <p className="help-text">{plan.metodoDescuento && <>Pagando con {plan.metodoDescuento.toLowerCase()}. </>}{plan.condicionesDescuento} Se confirma al pagar en el gimnasio.</p>}
        </>}
    </>;
}
