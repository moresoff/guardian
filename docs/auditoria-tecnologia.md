# Auditoría: tecnologías que pide el trabajo final vs. lo que existe

Fecha: 2026-11-09. Se revisó la rama `main` (commit `c022c6b`) contra la sección
«Digitales — Tecnologías principales» del trabajo final. Se probó el código y se
corrió la base en un Postgres 16 local; no se tocó ningún servicio externo.

## Resumen

| # | Tecnología que pide el trabajo | Estado | Lo que hay | Lo que falta |
|---|---|---|---|---|
| 1 | Base de datos relacional | **Hecha y conectada** | Proyecto de Supabase con las 4 migraciones y el seed (comparado tabla por tabla contra el local), 23 tablas con RLS, cuentas vinculadas con su ficha de productor o colaborador, escrituras en transacción con asiento en `auditoria` | Que cada persona del equipo ponga la contraseña de la base en su `.env.local` |
| 2 | IA para procesar documentos | **Simulada (a propósito)** | La lectura simulada ahora se guarda: cada papel presentado deja sus campos en `extracciones` y, si no cierra, una fila en `discrepancias` | Una llamada real a un modelo de visión |
| 3 | Motor de reglas y flujos de aprobación | **Presentar, sí; aprobar, todavía no** | «Enviar a validación» guarda el proyecto en *Pendiente de validación* y aparece en `/admin`; el servidor revalida todo antes de escribir | Publicar y rechazar desde `/admin` (sin rol de administrador, a propósito para la demo) |
| 4 | Gestión documental y firma | **Almacenamiento hecho; firma no** | Los papeles se guardan en el bucket privado `documentos` (o en `.almacen/` sin Supabase), con ruta, tipo y peso en `documentos`; el servidor revisa el contenido real del archivo | Versiones de documento y firma electrónica |
| 5 | Validación de identidad | **Simulada, con datos reales** | `/identidad`: datos del DNI, fotos del DNI y selfie guardadas, declaración PEP y sujeto obligado, origen de fondos y CBU; queda en `verificaciones_identidad` | Un proveedor real de lectura de DNI, prueba de vida y comparación facial |

## 1. Base de datos relacional

Existe y funciona. Se comprobó:

- `npm run datos:migrar -- seed` aplica las 3 migraciones y el seed en Postgres
  real: 22 tablas, todas con RLS.
- La app corre contra esa base con `DATABASE_URL`: `/`, `/proyectos`, la ficha y
  `/registro` responden 200 con los datos de la base.
- `npx tsx scripts/comparar-repositorios.ts`: las 24 consultas devuelven lo
  mismo en memoria y en Postgres.

En la primera revisión faltaba conectarla y escribir en ella. Las dos cosas
quedaron hechas (ver «Qué cambió» más abajo).

### Conectarla a Supabase

El proyecto `guardian` ya tiene el esquema y los datos. Para usarlo desde una
computadora:

1. En Supabase, proyecto `guardian`: botón **Connect** → copiar la cadena del
   *Transaction pooler* (puerto 6543) y la del *Session pooler* (5432). Si no
   sabés la contraseña de la base, se cambia en Project Settings → Database.
2. Copiar `.env.example` a `.env.local` y completar `DATABASE_URL` (6543),
   `DIRECT_URL` (5432), `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_SECRET_KEY`
   (Project Settings → API Keys).
3. `npm run dev`. Correr `npm run datos:migrar -- seed` no hace falta, pero no
   rompe nada: saltea lo que ya está.

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

## Qué cambió después de la primera auditoría

- **Base conectada.** Se creó el proyecto `guardian` en Supabase (São Paulo) y
  se le aplicaron las migraciones y los datos de demostración. Las 18 tablas
  con datos se compararon contra el Postgres local con una huella por tabla y
  coinciden. El script de migraciones ahora lleva registro (`_migraciones`), así
  se puede correr de nuevo sin romper nada.
- **Presentar.** El asistente para publicar guarda el proyecto en *Pendiente de
  validación*, con sus papeles, lo leído de cada uno y un asiento de auditoría.
  Cada cuenta nueva tiene su propia ficha de productor o colaborador, y lo que
  presenta queda a su nombre.
- **Archivos.** Se aceptan PDF, JPG, PNG y WEBP de hasta 10 MB. El navegador
  avisa antes de subir y el servidor vuelve a mirar los primeros bytes: un
  archivo renombrado a `.pdf` se rechaza.
- **Identidad (KYC).** Cuatro pasos: datos del DNI, foto del DNI, selfie y
  declaraciones (PEP, sujeto obligado ante la UIF, origen de fondos, CBU). Las
  pruebas están simuladas y el método guardado lo dice. Una persona expuesta
  políticamente queda en revisión, no se aprueba sola.

## Lo que se agregó en la rama de la simulación

- `/simulacion` (retirada: ahora redirige a `/simulador`): era un recorrido de ejemplo para el productor, sin cuenta, con papeles
  ya cargados. Cuatro pasos: elegir el ciclo, ver los papeles leídos, ver los
  controles y ver cómo sigue el proyecto. Usa la misma lectura simulada y una
  función pura de controles (`src/lib/simulacion.ts`), así que muestra los
  componentes 2 y 3 funcionando de punta a punta, sin guardar nada.
- Entrada «Probá un ciclo» en el menú y chequeo de vocabulario público para la
  ruta nueva (`npm run check:copy`).

## Orden sugerido para lo que falta

1. Rol de administrador, y recién con él publicar y rechazar desde `/admin`.
2. Versiones de documento (el original sin pisar).
3. Lectura real con modelo de visión.
4. Identidad y firma con proveedores externos.
