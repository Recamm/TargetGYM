# Target GYM — Manual de marca

**Versión 1.2 · Identidad aprobada el 2 de noviembre de 2026**

**Dirección:** Cerca. **Logo:** Mancuerna. **Paleta:** blanco y grafito
con acentos Mandarina. **Tipografía:** Outfit + DM Sans.

Esta es la única identidad activa de Target GYM. Sustituye las propuestas
Enfoque, Ritmo, Cerca bosque/lavanda y las exploraciones cálidas anteriores.
El usuario aprobó la [portada Cerca/Mandarina](./preview.html) y su aplicación
a la web completa. La aprobación visual no verifica los datos del gimnasio
ni autoriza un despliegue.

[Manual visual en PDF](./Manual-de-marca.pdf) ·
[Manual visual navegable](./manual.html) ·
[Exploraciones históricas, no vigentes](./Exploraciones-de-marca.md)

## 1. La idea de marca

Target GYM es un gimnasio de barrio en Florida, Vicente López.
La identidad transmite acompañamiento, actividad y cercanía: recibe,
orienta y facilita volver. No exige experiencia previa ni vende cuerpos ideales.

**Promesa:** un lugar cercano para encontrar tu forma de entrenar.

| Somos | Evitamos |
|---|---|
| Cercanos y claros | Jerga técnica o lenguaje infantil |
| Activos y tranquilos | Agresividad y presión sobre el cuerpo |
| Sencillos y reconocibles | Decoración que compite con las acciones |
| Amables también al gestionar | Formularios confusos o errores ocultos |

El nombre comercial es **Target GYM**. Cerca es el nombre de la dirección
de diseño, no un nombre alternativo para el negocio.

## 2. Logo Mancuerna

Una mancuerna compacta acompaña un logotipo de trazos suaves. Un pequeño
plato Mandarina aporta reconocimiento sin convertir el conjunto en naranja.
El lettering está vectorizado: no requiere una fuente instalada.

### Archivos maestros

| Uso | Archivo |
|---|---|
| Logo principal, grafito + Mandarina | [target-mancuerna-logo.svg](./logos/target-mancuerna-logo.svg) |
| Logo monocromo | [target-mancuerna-mono.svg](./logos/target-mancuerna-mono.svg) |
| Símbolo aislado | [target-mancuerna-simbolo.svg](./logos/target-mancuerna-simbolo.svg) |
| Logo de distribución, temporalmente oculto | [logo.svg](../../frontend/public/marca/logo.svg) |
| Favicon temporal con inicial T | [favicon.svg](../../frontend/public/favicon.svg) |

Usar SVG para web y originales vectoriales. Para soportes que exijan raster,
exportar desde el maestro a la resolución final, sin capturas de pantalla.
El archivo de la aplicación es una copia de distribución; los maestros de
esta carpeta son la referencia al actualizar assets.

### Protección, tamaño y fondos

- Dejar espacio libre mínimo de **media anchura del símbolo** alrededor:
  16 px por lado para el logo a 164 px de ancho, escalados proporcionalmente.
- Logo completo: **144 px de ancho mínimo recomendado en pantalla**.
  Referencia de aplicación con símbolo: cabecera 164 px y pie 144 px.
- Símbolo: 24 px como mínimo recomendado para uso general. El favicon
  se puede mostrar a 16 px como excepción del navegador; no se acredita
  con ello legibilidad óptica a ese tamaño en todos los dispositivos.
- Fondo principal blanco; gris claro como alternativa. Evitar fotografías,
  texturas o superficies naranjas detrás del logo.
- En impresión a una tinta usar el maestro monocromo. Un negativo blanco
  requiere exportación específica y prueba de contraste, no un filtro CSS.
- Para bordado, grabado o impresión pequeña, realizar una prueba de
  producción. Los mínimos digitales no son una certificación física.

No deformar, girar, agregar sombras, cambiar los platos, recolorear el texto,
rearmar el nombre con una fuente ni incorporar el símbolo a un escudo.
No afirmar registro o exclusividad jurídica: no se realizó búsqueda marcaria.

### Excepción temporal en la web

Por pedido del usuario, cabecera y pie muestran solo **Target gym**, en
Outfit 500, grafito sobre blanco, sin símbolo: 28,8 px en cabecera y
25,6 px en pie, con espaciado de −0,04 em. El favicon muestra la inicial T.
No se eliminan ni modifican los maestros Mancuerna; esta excepción no
sustituye el logo aprobado ni autoriza nuevas variantes de la identidad.

## 3. Paleta activa

| Nombre | HEX | Función |
|---|---|---|
| Blanco | `#FFFFFF` | Fondo principal, superficies y campos |
| Grafito | `#2C3035` | Texto, logo, foco y navegación |
| Gris secundario | `#5C636B` | Descripciones, ayudas y metadatos |
| Gris claro | `#F5F6F7` | Filtros, formularios y agrupaciones abiertas |
| Línea | `#D8DDE2` | Separadores decorativos |
| Mandarina | `#F48335` | Acción principal y detalle de Mancuerna |
| Borde de control | `#737B85` | Campos, botones secundarios y límites necesarios |

Blanco y grafito dominan. Mandarina señala una decisión; no rellena cada
tarjeta, sección o estado. No hay un porcentaje obligatorio de naranja.
En pantallas operativas puede haber varios botones principales cuando
pertenecen a operaciones independientes.

### Combinaciones verificables

- Grafito sobre blanco: aproximadamente **13,28:1**.
- Grafito sobre Mandarina: aproximadamente **5,15:1**.
- Grafito sobre gris claro: aproximadamente **12,27:1**.
- No usar blanco sobre Mandarina para texto: no cumple el mínimo de 4,5:1.
- No usar Mandarina como texto pequeño sobre blanco.
- Línea es decorativa; no delimita por sí sola un campo de formulario.

Cada estado debe comprobarse en su contexto. El texto normal requiere
4,5:1; texto grande y elementos gráficos necesarios, 3:1.

### Colores semánticos, no colores de marca

| Estado | Acento/texto | Fondo | Uso |
|---|---|---|---|
| Error | `#991B1B` | `#FEF2F2` | Campo inválido, fallo o alerta |
| Confirmación | `#166534` | `#F0FDF4` | Notificación de operación realizada |
| Neutral | Grafito | Gris claro | Carga, vacío, etiqueta o ayuda |

Las notificaciones escriben «Atención» o «Listo». Los errores incluyen
mensaje y, cuando corresponde, reintento. Los estados de clases,
inscripciones y membresías se nombran con texto; el color nunca sustituye
«Sin cupo», «Vencida», «Cancelada» o una condición de reserva.

## 4. Tipografía

**Outfit, peso 500:** titulares, nombres de actividad y valores destacados.
Su geometría suave conecta la bienvenida con el símbolo Mancuerna.

**DM Sans, pesos 400 y 500:** párrafos, navegación, campos, botones y ayudas.
La lectura y los controles no se convierten en piezas de afiche.

Ambas familias variables se sirven localmente, sin Google Fonts ni servicios
externos en ejecución. Solo se usan estilos normales; no simular cursivas.

| Rol digital | Tamaño | Interlineado / criterio |
|---|---|---|
| Bienvenida de portada | 53,6–92 px en escritorio; desde 48 px en móvil | 1,02; peso 500 |
| Título de página | 40–60 px | 1,14; peso 500 |
| Título de sección de portada | 36–48 px | 1,10 |
| Título de contenido | 23–30 px | 1,14 |
| Lectura | 16 px | 1,6–1,7 |
| Botón o control | 15–16 px | 1,4–1,6 |
| Ayuda / metadato | 13,6–14,4 px | 1,6 |

Usar mayúsculas y minúsculas naturales, no etiquetas espaciadas en mayúsculas.
Reservar el espaciado negativo para titulares; no comprimir párrafos.
Mantener líneas de lectura por debajo de unas 72 letras cuando sea posible.

**Licencias SIL Open Font License:** [Outfit](./fonts/OFL-Outfit.txt) y
[DM Sans](./fonts/OFL-DM-Sans.txt). Se distribuyen también con la aplicación.
No renombrar las fuentes ni quitar sus licencias al entregar archivos.

## 5. Composición y formas

La portada tiene un único gesto protagonista: una fotografía en arco
a la izquierda y la bienvenida a la derecha. En móvil se lee primero
la bienvenida y luego la imagen. Se conserva espacio entre bloques;
no se rellena con ilustraciones o estadísticas ficticias.

- Contenedor de 1280 px máximo; márgenes de 56 px por lado en escritorio,
  32 px en tamaños intermedios y 20 px en móvil.
- Escala de espacio principal: 8, 12, 16, 20, 24, 28, 32, 48, 64, 88 y 96 px.
- Botón: radio 16 px. Campo: 12 px. Panel: 20–24 px.
- Arco: esquinas superiores del 48%; esquinas inferiores de 24 px.
  No repetirlo en cada tarjeta o formulario.
- Sin gradientes de adorno, sombras genéricas, flechas repetidas, numeración
  arbitraria, carruseles automáticos ni movimientos obligatorios.
- Los radios ayudan a agrupar; no sustituyen jerarquía, título ni etiqueta.

En piezas impresas, adaptar la composición al soporte. Los colores HEX
son referencias RGB para pantalla; no se certificaron CMYK ni Pantone.

## 6. Componentes y superficies

| Superficie | Tratamiento implementado |
|---|---|
| Cabecera | Nombre sin símbolo; Inicio, Clases, Planes; Ya soy socio discreto y Asociate Mandarina |
| Portada | Bienvenida Cerca, foto en arco, actividades, planes con precios reales y agenda |
| Agenda pública / socio | Filtros sobre gris claro; fecha, instructor, duración y cupo visibles |
| Acceso / registro / perfil | Campos blancos con borde perceptible, etiqueta y error cercano |
| Área del socio | Mi espacio como entrada; cuenta creada y membresía activa se distinguen |
| Instructor | Clases y asistencia sin decoración de campaña |
| Administración | Portal del equipo; navegación lateral, resumen de pendientes y mismos componentes |
| Confirmación | Diálogo blanco, foco inicial en volver y retorno al control anterior |
| Notificaciones | Flotantes, temporales, texto explícito, cierre accesible y acento semántico |
| Vacío / carga / error | Panel gris o error diferenciado; nunca éxito simulado |

Las acciones principales usan Mandarina con texto Grafito. Las secundarias
son blancas con borde; las discretas, texto subrayado. Mantener al menos
44 × 44 px en controles principales y foco Grafito visible de 3 px.
No ocultar datos o acciones importantes solo para reducir densidad.

La cabecera fija reserva su altura y las anclas dejan margen de lectura.
El menú móvil conserva las mismas rutas y operaciones que escritorio.
La navegación interna del socio y administración indica la página activa.

«Asociate» inicia la contratación, no un login. «Ya soy socio» permite ingresar.
Asociación: plan con precio, datos y método de pago obligatorios. «Mi espacio»
explica los estados Pendiente de pago, Pago a revisar y Membresía activa,
sin presentar la creación de una cuenta o el aviso de transferencia como un pago.

El enlace «Acceso del equipo» vive discretamente en el pie. Administración e
instructores usan una envolvente operativa sin pie comercial; administración
prioriza altas/pagos pendientes y vencimientos, no gráficos decorativos.
La marca de su cabecera usa Outfit 500 a 25,6 px (21,6 px en mobile).
Mismo blanco/grafito y Mandarina, navegación lateral en escritorio y menú
animado en mobile. Separación visual no implica otro sistema de autenticación.

El menú móvil entra con opacidad y desplazamiento vertical de 12 px durante
220 ms. Escape lo cierra y devuelve el foco al botón; los enlaces también
lo cierran. Cerrado, sus enlaces no son enfocables. Sin animación si se
prefiere movimiento reducido.

Los avisos transitorios se cierran a los **6 s** para confirmaciones y
**10 s** para errores, cada uno con su propio temporizador. Pasar el puntero
o enfocar el aviso pausa el cierre; al salir se reinicia su plazo completo.
Siempre se permite cierre manual. Los errores junto a campos o paneles
permanecen visibles hasta su corrección o reintento.

Los planes de portada consultan los precios configurados y se actualizan
cada 30 s; solo se publican planes habilitados. Mostrar el total en ARS
por el período completo. En descuentos generales, usar precio anterior y
porcentaje. En promociones condicionadas, mantener el precio base principal,
mostrar la oferta aparte y explicar método/condiciones y confirmación
presencial. Nunca tachar el precio base como si la rebaja fuera universal.
Un precio sin configurar dice «Consultá el precio», nunca cero inventado.
La acción lleva al registro, membresía, configuración o consulta según
el rol; no cobra online. Carga, vacío y error con reintento son explícitos.

Administración permite crear/editar planes y confirmar su deshabilitación
o eliminación con consecuencias claras. Los nombres históricos no son
identificadores técnicos. La ficha del socio permite cambiar de plan sin
cobro ni alteración de fechas, con confirmación e historial.
Teléfono, Instagram y horarios del pie provienen del
[registro de fuentes del gimnasio](../target-gym/FUENTES.md).
No publicar un botón de WhatsApp a partir de un teléfono no confirmado para ese uso.

La identidad no modifica validaciones, permisos, API ni reglas de negocio.
Reservas, pagos manuales, cancelaciones, gracia, membresías y asistencia
siguen siendo operaciones reales del sistema existente.

## 7. Voz

Voseo argentino, directo y amable. Mantener «clase», «reserva»,
«membresía», «pago» y «socio» de forma consistente.

| Evitar | Usar |
|---|---|
| «No hay excusas» | «Con acompañamiento, desde tu primer día» |
| «Desbloqueá tu potencial» | «Encontrá tu actividad» |
| «Operación completada exitosamente» | «Guardamos los cambios» |
| «Error inesperado» como único dato | «No pudimos cargar la información» + detalle/reintento |
| «Comprá tu membresía» si no hay cobro online | «Enviar solicitud» y explicación del pago manual |

No inventar precios, testimonios, estadísticas, cupos o instructores.
La agenda obtiene sus datos del sistema; la descripción institucional y
la oferta de actividades requieren confirmación del gimnasio antes de publicar.

## 8. Fotografía y movimiento

Priorizar fotos autorizadas del gimnasio real: espacio, equipamiento y
entrenamiento cotidiano. Respetar permisos de imagen de personas. No usar
fotografía generada para aparentar instalaciones o resultados reales.

La aplicación local conserva una **fotografía de referencia**
de [Danielle Cerullo / Unsplash](https://unsplash.com/photos/woman-standing-surrounded-by-exercise-equipment-CQfNt66ttZM),
bajo [Unsplash License](https://unsplash.com/license), de uso gratuito.
Se muestra en gris y se sirve como WebP local de 1920 × 1040 px.
El [registro de origen](./imagenes/ORIGEN.txt) conserva su procedencia.

**No representa Target GYM.** Reemplazarla por fotografía autorizada real
antes de presentarla como sus instalaciones. Esta limitación permanece
documentada aquí y en los registros de origen; por pedido del usuario no
hay leyenda bajo la fotografía en la web funcional. La licencia no exige
un crédito visible. No implica exclusividad
ni certificación de todas las autorizaciones de imagen para campañas.

No hay animaciones decorativas automáticas; la entrada del menú responde
a una acción del usuario. Los cambios de estado se
explican con texto. Se respeta `prefers-reduced-motion`; no secuestrar
el scroll, reproducir audio automático ni depender de hover.

## 9. Referencias y originalidad

- [Hozon](https://aestudio.studio/hozon): una composición protagonista y aire.
- [Linear](https://linear.app/): jerarquía y atención a la interfaz operativa.
- [Still / Form](https://stillform.homes/): calma y presencia de imagen.
- [YAAS](https://yaas-energy.com/): carácter de marca, no una copia de efectos.

Las cuatro portadas se observaron en Chromium. No se reutilizó su código,
logos, ilustraciones ni tipografía comercial. Mancuerna y Cerca se
desarrollaron para este proyecto; no se afirma registro jurídico.

## 10. Implementación, mantenimiento y entrega

- Tokens globales y fuentes: [index.css](../../frontend/src/index.css).
- Componentes y responsive: [App.css](../../frontend/src/App.css).
- Distribución de logo, foto y fuentes: [marca](../../frontend/public/marca/).
- Maestros de logo: [logos](./logos/). No mezclar rutas históricas.
- Muestra aprobada: [preview.html](./preview.html), conservada como referencia.

Antes de publicar: confirmar dirección/horarios/actividades, obtener fotos
reales autorizadas, comprobar rutas y roles con datos reales y verificar el
entorno de despliegue. Una prueba Chromium no acredita Safari o dispositivos
físicos; tampoco certifica impresión o señalética.

La evidencia de pruebas y sus límites se registra en el
[plan de ejecución](../Plan%20de%20diseno%20y%20ejecucion.md).
Este manual define la identidad aprobada, no promete certificación de
accesibilidad, marca registrada ni despliegue realizado.
