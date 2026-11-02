# targetgym

## Arrancar

La configuración se agrega al proyecto existente. No se crea ni modifica el código de la aplicación.

La instalación de dependencias es explícita. CreateApp no ejecuta npm, pip, Git, despliegues ni servicios externos durante la generación. Las herramientas que necesiten las skills se comprueban con `createapp . --doctor`.

## Empezar con tu asistente

Abrí esta carpeta con GitHub Copilot y enviá:

> Leé AGENTS.md, .createapp/POLICY.md y .createapp/config.json. Revisá el código existente y trabajá con el coordinador y la autonomía configurados. Usá solo los perfiles ca-* que correspondan a la tarea. Primero resumí el objetivo y el siguiente paso; después avanzá hasta verificarlo.

## Objetivo inicial

Target GYM: preparar el frontend React requerido por la Entrega 3 y planificar la integración del sistema completo, conservando el backend Express y la identidad visual de `info/`. El único coordinador es Superpowers mediante el perfil local `ca-workflow`. No se instaló el plugin global ni se habilitaron subagentes o worktrees automáticos.

Leer el [informe de diseño y ejecución](../info/Plan%20de%20diseno%20y%20ejecucion.md), la [especificación funcional](../info/Especificacion%20funcional.md) y los [principios del proyecto](../info/Principios%20del%20proyecto.md). La preparación no implementa la aplicación.

## Qué se instaló

- Perfiles locales adaptados para roles concretos; no plugins oficiales completos.
- Fuentes originales en `.createapp/vendor/` y `.createapp/additions/`, fijadas a commits y verificadas con hashes de blob Git.
- Un contrato de coordinación en `.createapp/POLICY.md` y la selección en `config.json`.
- `9` perfiles en `.agents/skills/`, con activación limitada al rol, incluido `ca-workflow`.

Los paquetes opcionales y herramientas se describen en la configuración. Si elegiste Graphify, ejecutá manualmente `python .createapp/setup_graphify.py`; luego consultá el ejecutable local con --help. No hace falta registrar otra skill con graphify install.
Los perfiles no garantizan obediencia del modelo ni eliminan conflictos con plugins globales. Si otra instalación ignora el contrato, desactivala en esa sesión.
No se instaló una PWA, autenticación, base de datos ni CI por seleccionar referencias de esas tecnologías. Son decisiones de implementación posteriores.

## Cambios y actualizaciones

Este inicializador no reemplaza una instalación CreateApp existente. Podés editar POLICY.md para cambiar acuerdos; config.json registra la selección y editarlo por sí solo no reinstala ni elimina perfiles. Para agregar un perfil compatible, usar `createapp . --add-skills NOMBRE --dry-run` y después el mismo comando sin `--dry-run`. Para una nueva selección completa, generá en otra carpeta y compará los archivos.
Para actualizar fuentes: revisar commits nuevos y volver a generar con un catálogo actualizado. Nunca cambiar fuentes silenciosamente en un proyecto.
