export const descuentoCondicionado = plan => Boolean(plan.condicionesDescuento || plan.metodoDescuento);
export const tieneDescuento = plan => plan.precioDescuentoCentavos != null || plan.descuentoPorcentaje > 0;
export const descuentoAutomatico = plan => plan.precioDescuentoCentavos != null && Boolean(plan.metodoDescuento) && !plan.condicionesDescuento;
export const precioFinal = plan => plan.precioCentavos === null ? null : plan.precioDescuentoCentavos ?? Math.round(plan.precioCentavos * (100 - plan.descuentoPorcentaje) / 100);
export const importePlan = (plan, confirmar = false) => descuentoCondicionado(plan) && !confirmar ? plan.precioCentavos : precioFinal(plan);
export const importeCobro = (plan, metodo, confirmar = false) => descuentoAutomatico(plan)
    ? metodo === plan.metodoDescuento ? precioFinal(plan) : plan.precioCentavos : importePlan(plan, confirmar);
export const metodoAdmitido = (plan, metodo) => (!plan?.metodoExclusivo || plan.metodoExclusivo === metodo)
    && (metodo !== 'Tarjeta' || plan?.permiteTarjeta !== false);
export const periodoPlan = plan => plan.dias != null ? `${plan.dias} ${plan.dias === 1 ? 'día corrido' : 'días corridos'}`
    : `${plan.meses} ${plan.meses === 1 ? 'mes calendario' : 'meses calendario'}`;
