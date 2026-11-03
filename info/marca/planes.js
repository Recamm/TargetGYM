import { cargarCatalogo, crearTarjeta } from './planes-muestra.js';

const propuestas = {
    clara: ['A. Clara', 'Más aire y fondo blanco. La tarifa en efectivo se identifica siempre, no se presenta como un precio universal.'],
    grafito: ['B. Grafito', 'La presencia de la tarjeta actual, con precios separados por método y menos texto mezclado con los importes.'],
    comparativa: ['C. Comparativa', 'En escritorio, cada plan ocupa una fila. En móvil se apila sin esconder precios ni condiciones.'],
    ficha: ['D. Ficha', 'Una ficha compacta sobre gris claro. Mandarina destaca únicamente la banda de la tarifa principal.'],
};
const tarjetas = document.querySelector('#tarjetas');
const estado = document.querySelector('#estado');
const reintentar = document.querySelector('#reintentar');

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

async function cargar() {
    document.querySelector('#propuestas').setAttribute('aria-busy', 'true');
    estado.textContent = 'Cargando el catálogo del gimnasio…';
    reintentar.hidden = true;
    tarjetas.replaceChildren();
    try {
        const { planes, metodos } = await cargarCatalogo();
        tarjetas.replaceChildren(...planes.map(plan => crearTarjeta(plan, metodos)));
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
