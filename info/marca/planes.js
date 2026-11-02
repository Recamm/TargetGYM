import { lista, precio, metodoPago } from '../../frontend/src/services/contratos.js';
import { tarifasPlan, precioPlanTexto as dinero, periodoPlan, descuentoCondicionado, descuentoAutomatico, precioFinal, tieneDescuento } from '../../frontend/src/utils/planes.js';

const propuestas = {
    clara: ['A. Clara', 'Más aire y fondo blanco. La tarifa en efectivo se identifica siempre, no se presenta como un precio universal.'],
    grafito: ['B. Grafito', 'La presencia de la tarjeta actual, con precios separados por método y menos texto mezclado con los importes.'],
    comparativa: ['C. Comparativa', 'En escritorio, cada plan ocupa una fila. En móvil se apila sin esconder precios ni condiciones.'],
    ficha: ['D. Ficha', 'Una ficha compacta sobre gris claro. Mandarina destaca únicamente la banda de la tarifa principal.'],
};
const tarjetas = document.querySelector('#tarjetas');
const estado = document.querySelector('#estado');
const reintentar = document.querySelector('#reintentar');
const nodo = (tag, clase, texto) => {
    const element = document.createElement(tag);
    if (clase) element.className = clase;
    if (texto) element.textContent = texto;
    return element;
};

function mostrarDiseno(diseno) {
    tarjetas.dataset.design = diseno;
    document.querySelector('#design-title').textContent = propuestas[diseno][0];
    document.querySelector('#design-description').textContent = propuestas[diseno][1];
    document.querySelector(`input[value="${diseno}"]`).checked = true;
}

for (const input of document.querySelectorAll('input[name="diseno"]')) {
    input.addEventListener('change', () => {
        mostrarDiseno(input.value);
        history.replaceState(null, '', `#${input.value}`);
    });
}
function desdeEnlace() {
    const diseno = location.hash.slice(1);
    mostrarDiseno(Object.hasOwn(propuestas, diseno) ? diseno : 'clara');
}
addEventListener('hashchange', desdeEnlace);
desdeEnlace();

function crearTarjeta(plan, metodos) {
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
    else card.append(nodo('p', 'notes', 'Sin métodos disponibles. Consultá en recepción.'));
    const notas = [];
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

async function cargar() {
    document.querySelector('#propuestas').setAttribute('aria-busy', 'true');
    estado.textContent = 'Cargando el catálogo del gimnasio…';
    reintentar.hidden = true;
    tarjetas.replaceChildren();
    try {
        const recursos = await Promise.all(['/api/planes', '/api/metodos-pago'].map(async url => {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Error HTTP ${response.status} al cargar ${url}.`);
            const body = await response.json();
            if (body.success !== true) throw new Error(`Respuesta incorrecta de ${url}.`);
            return body.data;
        }));
        const [planes, metodos] = recursos;
        if (!lista(precio)(planes) || !lista(metodoPago)(metodos)) throw new Error('El catálogo no tiene el formato esperado.');
        tarjetas.replaceChildren(...planes.map(plan => crearTarjeta(plan, metodos.filter(m => m.habilitado && m.permiteSocio))));
        estado.textContent = planes.length ? '' : 'No hay planes publicados. Podés habilitarlos desde administración.';
    } catch (error) {
        console.error('No se pudo cargar la comparación de planes.', error);
        estado.textContent = 'No se pudo cargar el catálogo. Abrí esta muestra desde el servidor local y comprobá que la API esté disponible.';
        reintentar.hidden = false;
    } finally {
        document.querySelector('#propuestas').setAttribute('aria-busy', 'false');
    }
}
reintentar.addEventListener('click', cargar);
cargar();
