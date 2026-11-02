import { dinero } from '../utils/validation.js';
import { descuentoCondicionado, precioFinal, tieneDescuento, descuentoAutomatico, tarifasPlan, precioPlanTexto } from '../utils/planes.js';

export default function PlanPrice({ plan, metodos }) {
    const condicionado = descuentoCondicionado(plan);
    const tarifas = metodos ? tarifasPlan(plan, metodos) : null;
    return <div className="plan-pricing">
        {tarifas && plan.precioCentavos !== null ? tarifas.length > 0
            ? <dl className="plan-tariffs">{tarifas.map(tarifa => <div className="plan-tariff" key={tarifa.etiqueta}>
                <dt>{tarifa.etiqueta}</dt><dd><p className="plan-price">{precioPlanTexto(tarifa.importeCentavos)}</p></dd>
            </div>)}</dl>
            : <p className="help-text">No hay métodos de pago disponibles para este plan. Consultá en el gimnasio.</p>
            : <p className={`plan-price${plan.precioCentavos === null ? ' is-unpriced' : ''}`}>{plan.precioCentavos === null ? 'Consultá el precio' : dinero(condicionado ? plan.precioCentavos : precioFinal(plan))}</p>}
        {plan.precioCentavos !== null && tieneDescuento(plan) && (!tarifas || (tarifas.length > 0 && !descuentoAutomatico(plan))) && <>
            <p className="plan-discount">{descuentoAutomatico(plan) ? <span>En {plan.metodoDescuento.toLowerCase()}: {dinero(precioFinal(plan))}</span> : condicionado ? <span>Con descuento: {dinero(precioFinal(plan))}</span> : <><span className="sr-only">Precio sin descuento: </span><del>{dinero(plan.precioCentavos)}</del></>}
                {plan.descuentoPorcentaje > 0 && <span>{plan.descuentoPorcentaje}% de descuento</span>}</p>
            {condicionado && !descuentoAutomatico(plan) && <p className="help-text">{plan.metodoDescuento && <>Pagando con {plan.metodoDescuento.toLowerCase()}. </>}{plan.condicionesDescuento} Se confirma al pagar en el gimnasio.</p>}
        </>}
    </div>;
}
