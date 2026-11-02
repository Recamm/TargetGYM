import { importeCobro, metodoAdmitido } from '../../../shared/planes.js';

export { descuentoCondicionado, tieneDescuento, descuentoAutomatico, precioFinal, importePlan, importeCobro, metodoAdmitido, periodoPlan } from '../../../shared/planes.js';

const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const precioPlanTexto = centavos => centavos === null ? 'Consultá el precio' : moneda.format(centavos / 100);

export function tarifasPlan(plan, metodos) {
    const grupos = new Map(), orden = ['Efectivo', 'Transferencia', 'Tarjeta'];
    const disponibles = metodos.filter(m => m.habilitado && m.permiteSocio && metodoAdmitido(plan, m.codigo))
        .sort((a, b) => orden.indexOf(a.codigo) - orden.indexOf(b.codigo));
    for (const metodo of disponibles) {
        const importe = importeCobro(plan, metodo.codigo);
        if (!grupos.has(importe)) grupos.set(importe, []);
        grupos.get(importe).push(metodo.codigo.toLowerCase());
    }
    return [...grupos].map(([importeCentavos, nombres]) => {
        const etiqueta = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} o ${nombres.at(-1)}`;
        return { importeCentavos, etiqueta: etiqueta.charAt(0).toUpperCase() + etiqueta.slice(1) };
    });
}
