# Guardian · MVP visual de tesis

Prototipo académico independiente de la aplicación principal. Reproduce el diseño revisado con la autora: Inicio, Quiénes somos, Cómo invertir, Consultas y cambio al espacio productor.

## Ejecutar

Desde esta carpeta:

```sh
npm ci
npm run dev -- --port 3100
```

Abrir http://localhost:3100. El espacio productor está en `/producer`.

## Incluye

- Logo y fotografías de Guardian.
- Dos proyectos ficticios con foto: Los Aromos (en evaluación) y La Esperanza (en ejecución).
- Formulario de nueva propuesta con estado en evaluación.
- Diseño adaptable a celular.

Los ejemplos y montos son ilustrativos. Las propuestas nuevas se guardan únicamente en memoria y se reinician al recargar o salir. No existe recepción de aportes, autenticación, firma de contratos ni envío de propuestas a terceros.

## Alcance de esta rama

La aplicación principal y su integración con la base de datos se conservan. Este MVP tiene su propio package.json y lockfile y se prueba por separado; no reemplaza el despliegue actual. Para una vista previa independiente, usar `prototipos/mvp` como directorio raíz.

Validación local previa: compilación de producción y comprobación en navegador del recorrido, formulario y proyectos precargados.

## Despliegue

MVP publicado directamente en el equipo Leonard de Vercel: https://guardian-mvp-leonard22.vercel.app/ . El proyecto Vercel se llama `guardian-mvp`. La integración automática con GitHub no está habilitada; subir cambios a esta rama no actualiza por sí solo el despliegue. Las fotos se optimizaron para reducir el peso de carga.
