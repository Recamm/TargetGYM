import { cargarCatalogo, crearTarjeta, nodo } from './planes-muestra.js';
import { tarifasPlan, precioPlanTexto, periodoPlan } from '../../frontend/src/utils/planes.js';

const propuestas = {
    compactas: ['A. Compactas', 'Precios lado a lado, menos espacio interior y descripción desplegable. Todos los planes siguen a la vista.'],
    filas: ['B. Filas', 'Una lista ordenada: nombre, tarifas y acción en una fila. En móvil se apila sin recortar los importes.'],
    desplegables: ['C. Desplegables · Aprobada', 'Aplicada a la web: solo lo esencial al entrar. Abrí el plan para ver todas las tarifas, sus condiciones y cómo elegirlo.'],
    horizontal: ['D. Horizontal', 'Las tarjetas ocupan una sola fila. Deslizá para ver las demás, sin cambios automáticos ni precios recortados.'],
};
const tarjetas = document.querySelector('#tarjetas'), estado = document.querySelector('#estado');
const reintentar = document.querySelector('#reintentar'), recorrido = document.querySelector('#recorrido');
const anterior = document.querySelector('#anterior'), siguiente = document.querySelector('#siguiente');
let catalogo = null;
let actual = 'compactas';

function crearCompacta(plan, metodos) {
    const card = crearTarjeta(plan, metodos), descripcion = card.querySelector('.description');
    if (descripcion) {
        const detalle = nodo('details', 'plan-description-toggle');
        detalle.append(nodo('summary', '', 'Detalle del plan'), descripcion);
        card.insertBefore(detalle, card.querySelector('.choose'));
    }
    return card;
}

function crearDesplegable(plan, metodos) {
    const fold = nodo('details', 'plan-fold'), summary = nodo('summary');
    const heading = nodo('span', 'fold-heading');
    heading.append(nodo('strong', '', plan.nombre), nodo('span', 'period', periodoPlan(plan)));
    const tarifas = tarifasPlan(plan, metodos), primera = tarifas[0];
    const price = nodo('span', 'fold-price');
    price.append(nodo('small', '', primera ? primera.etiqueta : 'Sin métodos disponibles'),
        nodo('span', `amount${!primera || primera.importeCentavos === null ? ' is-unpriced' : ''}`,
            primera ? precioPlanTexto(primera.importeCentavos) : 'Consultá en recepción'));
    summary.append(heading, price, nodo('span', 'fold-action', 'Tarifas y condiciones'));
    const card = crearTarjeta(plan, metodos);
    card.querySelector('header').remove();
    card.removeAttribute('aria-labelledby');
    card.setAttribute('aria-label', plan.nombre);
    fold.append(summary, card);
    return fold;
}

function actualizarRecorrido() {
    anterior.disabled = tarjetas.scrollLeft <= 1;
    siguiente.disabled = tarjetas.scrollLeft + tarjetas.clientWidth >= tarjetas.scrollWidth - 1;
}
tarjetas.addEventListener('scroll', actualizarRecorrido, { passive: true });
addEventListener('resize', actualizarRecorrido);
for (const [boton, direccion] of [[anterior, -1], [siguiente, 1]]) {
    boton.addEventListener('click', () => tarjetas.scrollBy({ left: direccion * tarjetas.clientWidth * .85 }));
}

function mostrar(diseno) {
    actual = diseno;
    tarjetas.dataset.layout = diseno;
    document.querySelector('#design-title').textContent = propuestas[diseno][0];
    document.querySelector('#design-description').textContent = propuestas[diseno][1];
    document.querySelector(`input[value="${diseno}"]`).checked = true;
    recorrido.hidden = diseno !== 'horizontal' || !catalogo?.planes.length;
    if (diseno === 'horizontal') {
        tarjetas.tabIndex = 0;
        tarjetas.setAttribute('role', 'region');
        tarjetas.setAttribute('aria-label', 'Todos los planes, desplazamiento horizontal');
    } else {
        tarjetas.removeAttribute('tabindex');
        tarjetas.removeAttribute('role');
        tarjetas.removeAttribute('aria-label');
    }
    if (catalogo) {
        const crear = diseno === 'desplegables' ? crearDesplegable : crearCompacta;
        tarjetas.replaceChildren(...catalogo.planes.map(plan => crear(plan, catalogo.metodos)));
        tarjetas.scrollLeft = 0;
        requestAnimationFrame(actualizarRecorrido);
    }
}
for (const input of document.querySelectorAll('input[name="distribucion"]')) {
    input.addEventListener('change', () => {
        mostrar(input.value);
        history.replaceState(null, '', `#${input.value}`);
    });
}
function desdeEnlace() {
    const diseno = location.hash.slice(1);
    mostrar(Object.hasOwn(propuestas, diseno) ? diseno : 'compactas');
}
addEventListener('hashchange', desdeEnlace);
desdeEnlace();

async function cargar() {
    document.querySelector('#propuestas').setAttribute('aria-busy', 'true');
    reintentar.hidden = true;
    recorrido.hidden = true;
    catalogo = null;
    tarjetas.replaceChildren();
    estado.textContent = 'Cargando el catálogo del gimnasio…';
    try {
        catalogo = await cargarCatalogo();
        mostrar(actual);
        estado.textContent = catalogo.planes.length ? '' : 'No hay planes publicados. Podés habilitarlos desde administración.';
    } catch (error) {
        console.error('No se pudo cargar la comparación compacta de planes.', error);
        estado.textContent = 'No se pudo cargar el catálogo. Comprobá que la API esté disponible y reintentá.';
        reintentar.hidden = false;
    } finally {
        document.querySelector('#propuestas').setAttribute('aria-busy', 'false');
    }
}
reintentar.addEventListener('click', cargar);
cargar();
