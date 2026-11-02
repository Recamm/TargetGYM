export const descuentoCondicionado = plan => Boolean(plan.condicionesDescuento || plan.metodoDescuento);
export const precioFinal = plan => plan.precioCentavos === null ? null : Math.round(plan.precioCentavos * (100 - plan.descuentoPorcentaje) / 100);
export const importePlan = (plan, confirmar = false) => descuentoCondicionado(plan) && !confirmar ? plan.precioCentavos : precioFinal(plan);
