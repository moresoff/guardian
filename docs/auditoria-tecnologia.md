# Auditoría: tecnologías que pide el trabajo final vs. lo que existe

Fecha: 2026-11-09. Se revisó la rama `main` (commit `c022c6b`) contra la sección
«Digitales — Tecnologías principales» del trabajo final. Se probó el código y se
corrió la base en un Postgres 16 local; no se tocó ningún servicio externo.

## Resumen

| # | Tecnología que pide el trabajo | Estado | Lo que hay | Lo que falta |
|---|---|---|---|---|
| 1 | Base de datos relacional | **Hecha, sin conectar** | Esquema de 22 tablas con RLS, 3 migraciones, seed, repositorio Postgres con las mismas 24 consultas que el de memoria (comparadas y coinciden), cuentas guardadas en `perfiles` | Una base real conectada (`DATABASE_URL`) y escritura: hoy solo el alta de cuenta guarda algo |
| 2 | IA para procesar documentos | **Simulada** | Tablas `extracciones` y `discrepancias`, pantallas de lectura y de diferencias | Una llamada real a un modelo de visión: `simularLectura` devuelve valores fijos |
| 3 | Motor de reglas y flujos de aprobación | **Reglas sí, flujo no** | `puedePublicarse`, `puedeAdherirse`, `puedeLiquidarse`, estados del proyecto en la base | Ninguna transición se guarda; «Publicar» y «Rechazar» son botones sin acción; falta separar revisión, aprobación y ejecución |
| 4 | Gestión documental y firma | **Parcial** | Repositorio de documentos por productor y por proyecto, metadatos en `documentos` | Los archivos no se guardan en ningún lado, no hay versiones de documento ni firma |
| 5 | Validación de identidad | **Solo un dato** | Campo de método y fecha de identidad y un sello en la cartera | Ningún flujo: el registro pide CUIT sin verificarlo |

## 1. Base de datos relacional

Existe y funciona. Se comprobó:

- `npm run datos:migrar -- seed` aplica las 3 migraciones y el seed en Postgres
  real: 22 tablas, todas con RLS.
- La app corre contra esa base con `DATABASE_URL`: `/`, `/proyectos`, la ficha y
  `/registro` responden 200 con los datos de la base.
- `npx tsx scripts/comparar-repositorios.ts`: las 24 consultas devuelven lo
  mismo en memoria y en Postgres.

Lo que falta no es el diseño sino conectarla y escribir en ella:

- **No hay base conectada.** `.env.example` trae `DATABASE_URL` vacío, así que la
  app corre con el seed en memoria y todo se pierde al reiniciar.
- **Casi todo es de lectura.** El único `insert` del código es el alta de
  cuenta. «Enviar a validación» solo cambia un estado en la pantalla.
- **Las cuentas no están vinculadas con `productores`.** Las pantallas del
  productor usan `PRODUCTOR_DEMO` (`prod-1`) para todos.

### Conectarla a Supabase

1. En Supabase: Project Settings → Database → Connection string.
2. Copiar `.env.example` a `.env.local` y completar `DATABASE_URL` (pooler,
   puerto 6543) y `DIRECT_URL` (sesión, puerto 5432).
3. Correr:

   ```bash
   npm run datos:migrar -- seed
   npm run dev
   ```

   El script no imprime la cadena de conexión, solo el host.

## 2. IA para procesamiento documental

`simularLectura` (`src/components/subir-documento.tsx`) devuelve campos fijos por
tipo de documento. El resto del circuito está pensado para una lectura real: el
estado `procesando`, las confianzas por campo y las discrepancias. Falta la
integración por API con un modelo de visión y lenguaje, y guardar lo extraído en
`extracciones`.

Quedó corregido que el DT-e simulado ampare siempre 34 cabezas, que marcaba un
error falso en cualquier proyecto con otra cantidad (PR #3).

## 3. Motor de reglas y flujos de aprobación

Las reglas están en un solo lugar (`src/lib/proyecto.ts`), lo cual es bueno. Lo
que falta es que **decidan del lado del servidor**:

- No hay acciones del servidor para cambiar el estado de un proyecto.
- `Publicar proyecto` y `Rechazar proyecto` en `/admin` no hacen nada.
- El trabajo pide tres pasos separados (revisión documental, aprobación,
  ejecución bancaria). Hoy no hay ninguno.

### Hallazgo de seguridad: no existe el rol de administrador

`LadoSesion` es `productor | colaborador`. `/admin` exige solo estar logueado
(`exigirSesion`), así que **cualquier cuenta puede abrir las pantallas de
administración**. Hoy es solo lectura; cuando esas pantallas puedan publicar o
rechazar, el rol hay que resolverlo antes. La tabla `perfiles` ya tiene el rol
`admin` en su enum, pero el ingreso lo filtra.

## 4. Gestión documental y firma

- Los archivos «se leen en el navegador» y no se guardan (lo dice la propia
  pantalla). Hace falta un repositorio privado (por ejemplo, Supabase Storage
  con acceso por URL firmada) y guardar la ruta en `documentos`.
- No hay versiones de documento. El plan de backend (`docs/integraciones-backend-n8n.md`)
  lo prevé como `documento_versiones`, con el original sin pisar.
- No hay firma electrónica ni digital.

## 5. Validación de identidad

El trabajo pide reconocimiento de documento, prueba de vida y comparación facial.
El código tiene `identidad_metodo` e `identidad_fecha` en el colaborador del
seed (por ejemplo, «DNI contra RENAPER») y un sello en la cartera, pero ningún
flujo que lo produzca: el registro toma el CUIT como texto.

## Lo que se agregó en esta rama

- `/simulacion`: un recorrido de ejemplo para el productor, sin cuenta, con papeles
  ya cargados. Cuatro pasos: elegir el ciclo, ver los papeles leídos, ver los
  controles y ver cómo sigue el proyecto. Usa la misma lectura simulada y una
  función pura de controles (`src/lib/simulacion.ts`), así que muestra los
  componentes 2 y 3 funcionando de punta a punta, sin guardar nada.
- Entrada «Probá un ciclo» en el menú y chequeo de vocabulario público para la
  ruta nueva (`npm run check:copy`).

## Orden sugerido para lo que falta

1. Conectar Supabase (sin código, 10 minutos).
2. Definir el rol de administrador; sin eso no se puede escribir el flujo de
   aprobación sin abrir un hueco.
3. Escritura: enviar proyecto, decidir proyecto (con auditoría), vincular cuentas
   con `productores`.
4. Repositorio de archivos privado y versiones.
5. Lectura real con modelo de visión.
6. Identidad y firma, que dependen de proveedores externos.
