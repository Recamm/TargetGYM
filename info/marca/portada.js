const opciones = {
    suave: ['A. Rectángulo suave · Aprobada', 'Aplicada a la portada: fotografía horizontal 4:3, esquinas suaves de 24 px y espacio para leer.'],
    vertical: ['B. Retrato vertical', 'Una ventana más alta al entrenamiento. La foto ocupa más presencia, sin terminar en un arco.'],
    panoramica: ['C. Panorámica', 'Primero la bienvenida; después, el espacio. La imagen cruza todo el ancho y la composición respira.'],
    editorial: ['D. Editorial recta', 'Una composición más directa: texto a la izquierda y foto a la derecha, sin curvas ni marco decorativo.'],
};

function mostrar(opcion) {
    document.querySelector('.photo-demo').dataset.design = opcion;
    document.querySelector('#design-title').textContent = opciones[opcion][0];
    document.querySelector('#design-description').textContent = opciones[opcion][1];
    document.querySelector(`input[value="${opcion}"]`).checked = true;
}

for (const input of document.querySelectorAll('input[name="portada"]')) {
    input.addEventListener('change', () => {
        mostrar(input.value);
        history.replaceState(null, '', `#${input.value}`);
    });
}

function desdeEnlace() {
    const opcion = location.hash.slice(1);
    mostrar(Object.hasOwn(opciones, opcion) ? opcion : 'suave');
}
addEventListener('hashchange', desdeEnlace);
desdeEnlace();
