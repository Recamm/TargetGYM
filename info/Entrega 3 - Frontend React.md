# Entrega 3 — Frontend con React

## Objetivo

Desarrollar la interfaz visual del sistema utilizando **React**, conectarla con la API realizada en la **Entrega 2** y aplicar criterios de reutilización, accesibilidad, experiencia de usuario y coherencia visual.

El frontend deberá respetar el boceto presentado al comienzo del proyecto. Se podrán realizar mejoras justificadas, pero no reemplazar completamente el diseño original por una interfaz genérica.

Para Target GYM, la referencia de diseño se encuentra en [Entregar - Target GYM (UX-UI).md](./Entregar%20-%20Target%20GYM%20(UX-UI).md).

> Este documento organiza los requisitos de la entrega; no acredita que estén implementados.

## Parte 1 — Creación y organización del frontend

Todo el desarrollo de la aplicación deberá realizarse dentro de **`frontend/src`**.

El repositorio deberá mantener la siguiente estructura general:

```text
apellido-nombre-negocio/
├── backend/
└── frontend/
```

Dentro de `frontend/src`, el proyecto deberá organizarse por responsabilidades.

### Estructura sugerida

```text
frontend/
├── public/
└── src/
    ├── assets/
    ├── components/
    ├── pages/
    ├── services/
    ├── utils/
    ├── styles/
    ├── App.jsx
    └── main.jsx
```

### Responsabilidad de cada carpeta y archivo

| Carpeta o archivo | Responsabilidad |
|---|---|
| `assets/` | Imágenes, íconos y recursos visuales. |
| `components/` | Componentes reutilizables. |
| `pages/` | Pantallas principales de la aplicación. |
| `services/` | Comunicación con la API. |
| `utils/` | Funciones auxiliares. |
| `styles/` | Archivos CSS generales o compartidos. |
| `App.jsx` | Organización general de la aplicación y navegación entre pantallas. |
| `main.jsx` | Punto de entrada del proyecto. |

**No se deberá escribir toda la aplicación dentro de `App.jsx`.**

Cada archivo deberá tener una responsabilidad clara y estar ubicado dentro de la carpeta correspondiente.

El frontend deberá ejecutarse correctamente de manera independiente y comunicarse con el backend desarrollado en la entrega anterior.

## Parte 2 — Diseño, componentes reutilizables y accesibilidad

### Coherencia visual

La interfaz deberá conservar el boceto original y la identidad visual del proyecto. Las mejoras sobre ese diseño deberán estar justificadas.

### Componentes reutilizables

La interfaz deberá construirse utilizando componentes reutilizables.

Se deberá evitar duplicar código visual y reutilizar los mismos componentes en distintas pantallas cuando sea posible.

### Experiencia de usuario

La aplicación deberá brindar una respuesta visual ante cada acción del usuario. Como mínimo, deberá contemplar:

- Estados de carga.
- Operaciones exitosas.
- Mensajes de error.
- Validaciones de formularios.
- Confirmación antes de eliminar un registro.

Los errores y las operaciones exitosas deberán mostrarse mediante **un mismo sistema de notificaciones**, por ejemplo, notificaciones laterales.

Se deberá evitar el uso de `alert()` como mecanismo principal.

### Accesibilidad

La aplicación deberá cumplir aspectos básicos de accesibilidad:

- Utilizar correctamente las etiquetas HTML.
- Asociar cada `label` con su respectivo `input`.
- Emplear botones semánticos.
- Incluir textos alternativos en las imágenes.
- Ofrecer una navegación clara para el usuario.

La interfaz deberá ser comprensible y fácil de utilizar para cualquier persona.

## Parte 3 — Consumo de la API y funcionalidades

El frontend deberá comunicarse con el backend desarrollado en la **Entrega 2**.

La información proveniente de la API no deberá estar escrita manualmente dentro de los componentes.

Las peticiones no deberán escribirse directamente dentro de todas las pantallas o componentes. Deberán centralizarse en **`frontend/src/services`**.

Los componentes y las páginas deberán utilizar las funciones de esos servicios, sin repetir la lógica de `fetch` en distintos lugares.

Cada recurso principal podrá tener su propio archivo de servicio.

### Responsabilidades de los servicios

Los servicios serán responsables de:

1. Realizar las peticiones HTTP.
2. Configurar la URL correspondiente.
3. Procesar la respuesta.
4. Detectar respuestas incorrectas.
5. Devolver la información al componente.
6. Lanzar errores cuando la operación falle.

### Ejemplo de la consigna

El siguiente ejemplo utiliza un recurso ilustrativo de productos. La URL y los recursos deberán adaptarse a la API de Target GYM y a su formato de respuesta.

```javascript
const API_URL = "http://localhost:3000/products";

export async function getProducts() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  return response.json();
}
```

## Lista de verificación

### Organización y ejecución

- [ ] El frontend utiliza React.
- [ ] El repositorio mantiene separadas las carpetas `backend/` y `frontend/`.
- [ ] El código de la aplicación está dentro de `frontend/src`.
- [ ] Los archivos están organizados por responsabilidad.
- [ ] `App.jsx` organiza la aplicación sin concentrar toda su implementación.
- [ ] El frontend se ejecuta de manera independiente y se comunica con el backend de la Entrega 2.

### Diseño, reutilización y experiencia de usuario

- [ ] La interfaz respeta el boceto original.
- [ ] Las mejoras de diseño, si existen, están justificadas.
- [ ] Se reutilizan componentes y se evita duplicar código visual.
- [ ] Las acciones muestran estados de carga, éxito y error, según corresponda.
- [ ] Los formularios muestran sus validaciones.
- [ ] Se solicita confirmación antes de eliminar un registro.
- [ ] Los errores y los éxitos utilizan el mismo sistema de notificaciones.
- [ ] `alert()` no es el mecanismo principal de comunicación.

### Accesibilidad

- [ ] Se utilizan etiquetas HTML adecuadas y botones semánticos.
- [ ] Los `label` están asociados a sus respectivos `input`.
- [ ] Las imágenes tienen textos alternativos.
- [ ] La navegación es clara y la interfaz es comprensible.

### Integración con la API

- [ ] Los datos provenientes del backend no están escritos manualmente en los componentes.
- [ ] Las peticiones HTTP están centralizadas en `src/services`.
- [ ] Las páginas y los componentes consumen funciones de los servicios sin duplicar `fetch`.
- [ ] Los servicios configuran las URL, procesan respuestas y devuelven los datos.
- [ ] Los servicios detectan respuestas incorrectas y lanzan errores ante operaciones fallidas.
