import { lista, precio, metodoPago } from '../../frontend/src/services/contratos.js';
import { tarifasPlan, precioPlanTexto as dinero, periodoPlan, descuentoCondicionado, descuentoAutomatico, precioFinal, tieneDescuento } from '../../frontend/src/utils/planes.js';

export function nodo(tag, clase, texto) {
    const element = document.createElement(tag);
    if (clase) element.className = clase;
    if (texto) element.textContent = texto;
    return element;
}

export async function cargarCatalogo() {
    const recursos = await Promise.all(['/api/planes', '/api/metodos-pago'].map(async url => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Error HTTP ${response.status} al cargar ${url}.`);
        const body = await response.json();
        if (body.success !== true) throw new Error(`Respuesta incorrecta de ${url}.`);
        return body.data;
    }));
    const [planes, metodos] = recursos;
    if (!lista(precio)(planes) || !lista(metodoPago)(metodos)) throw new Error('El catálogo no tiene el formato esperado.');
    return { planes: planes.filter(p => p.habilitado), metodos: metodos.filter(m => m.habilitado && m.permiteSocio) };
}

export function crearTarjeta(plan, metodos) {
    const card = nodo('article', 'sample');
    const header = nodo('header');
    const titulo = nodo('h3', '', plan.nombre);
    titulo.id = `propuesta-${plan.tipo}`;
    card.setAttribute('aria-labelledby', titulo.id);
    header.append(titulo, nodo('p', 'period', periodoPlan(plan)));
    card.append(header);
    if (plan.descripcion) card.append(nodo('p', 'description', plan.descripcion));
    const tarifas = tarifasPlan(plan, metodos);
    const precios = nodo('dl', 'quotes');
    for (const { importeCentavos: importe, etiqueta } of tarifas) {
        const quote = nodo('div', 'quote');
        const dd = nodo('dd');
        dd.append(nodo('span', `amount${importe === null ? ' is-unpriced' : ''}`, dinero(importe)));
        quote.append(nodo('dt', '', etiqueta), dd);
        precios.append(quote);
    }
    if (tarifas.length) card.append(precios);
    const notas = tarifas.length ? [] : ['Sin métodos disponibles. Consultá en recepción.'];
    if (plan.metodoExclusivo) notas.push(`Solo ${plan.metodoExclusivo.toLowerCase()}.`);
    if (plan.permiteTarjeta === false && !plan.metodoExclusivo) notas.push('Pago en efectivo o transferencia.');
    if (plan.requisitosAcceso) notas.push(plan.requisitosAcceso);
    if (plan.precioCentavos !== null && tieneDescuento(plan) && descuentoCondicionado(plan) && !descuentoAutomatico(plan)) {
        notas.push(`Promoción: ${dinero(precioFinal(plan))}. ${plan.metodoDescuento ? `Con ${plan.metodoDescuento.toLowerCase()}. ` : ''}${plan.condicionesDescuento} Se confirma en recepción.`);
    }
    if (notas.length) card.append(nodo('p', 'notes', notas.join(' ')));
    const consultar = plan.precioCentavos === null || !tarifas.length;
    const accion = nodo('a', 'choose', consultar ? 'Consultar plan' : 'Elegir plan');
    accion.href = consultar ? '/#contacto' : `/asociate?plan=${encodeURIComponent(plan.tipo)}`;
    accion.setAttribute('aria-label', `${accion.textContent}: ${plan.nombre}`);
    card.append(accion);
    return card;
}
