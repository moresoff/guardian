# Backend e integraciones: plan de la etapa C

Fecha: 2026-09-27. Es el plan para lo que sigue: levantar el backend y usar n8n
para la lectura de datos. No hay nada de esto construido todavía; lo que sigue
son los contratos y el orden de trabajo.

La regla que ordena todo: **los controles de interfaz no son controles**. Todo lo
que hoy decide una pantalla —si un proyecto se publica, si un aporte cuenta, si
un identificador está libre— tiene que volver a decidirse del lado del servidor,
dentro de una transacción.

## 1. Base de datos

PostgreSQL. Las tablas mínimas, agrupadas por lo que sostienen:

**Participantes.** `perfiles` (identidad, rol, estado de verificación),
`productores`, `establecimientos` (varios por productor, con RENSPA, título de
uso y vigencia), `representaciones` (quién firma por una persona jurídica y con
qué facultades), `cuentas_bancarias`.

**Proyectos.** `proyectos` (modalidad, objetivo, mínimo de inicio, plazos,
estado, estado de fondeo), `condiciones_economicas` (versionadas: cambiar una
condición no pisa la anterior), `presupuesto_rubros`, `cronograma_hitos`,
`restricciones`.

**Lote.** `lotes`, `inventarios` (fechados), `identificadores` (RFID con
restricción única sobre los activos), `movimientos_hacienda`.

**Documental.** `documentos`, `documento_versiones` (el original nunca se pisa),
`extracciones`, `discrepancias`, `revisiones` (quién, cuándo, con qué método y
qué evidencia), `requisitos` (etapa, origen, aplicabilidad, estado).

**Dinero.** `aportes`, `movimientos_bancarios`, `conciliaciones`,
`desembolsos` (solicitud, autorización, pago), `rendiciones`, `liquidaciones`.

**Transversal.** `auditoria` (actor, acción, entidad, fecha, motivo, cambios).

Tres restricciones que tienen que estar en la base y no en el código:

- Un identificador RFID no puede estar en dos proyectos activos. Índice único
  parcial sobre `(identificador)` donde el proyecto esté vivo.
- `referencia_externa` de un movimiento bancario es única. Es lo que hace que
  repetir una notificación no duplique el aporte.
- Los importes van en `numeric`, nunca en punto flotante.

## 2. Contratos de servicio

Las funciones de `src/lib/data/index.ts` ya tienen la firma definitiva: son
`async` y devuelven los tipos de `src/lib/types.ts`. El reemplazo es el cuerpo,
no la firma. Lo que hay que agregar del lado del servidor:

| Operación | Qué tiene que garantizar |
|---|---|
| `publicarProyecto(id)` | Reevaluar `puedePublicarse()` en el servidor, no confiar en el botón |
| `crearOrdenSuscripcion(proyectoId, monto)` | Emitir el número, que es único; registrar la versión del contrato aceptada |
| `registrarMovimiento(referenciaExterna, …)` | Idempotente por referencia; si ya existe, no hace nada |
| `conciliar(movimientoId, aporteId)` | Transacción: acredita, recalcula el fondeo y deja el asiento de auditoría |
| `solicitarDesembolso(…)` / `autorizar(…)` / `confirmarPago(…)` | Tres pasos separados, cada uno con su actor y su evidencia |
| `afectarIdentificadores(proyectoId, ids)` | Reserva atómica: o entran todos o no entra ninguno |

## 3. n8n: lectura de datos

n8n es el orquestador de lo que entra desde afuera. Cuatro flujos, en este
orden de construcción:

### Flujo 1 — Extracción documental

```
Webhook (documento subido)
  → descarga del archivo privado
  → modelo de visión (API preentrenada, sin entrenar nada propio)
  → normalización de campos
  → POST /api/documentos/:id/extraccion
```

Lo que tiene que quedar claro en el flujo: **la extracción no verifica
autenticidad**. Deja `estado_extraccion` y `estado_consistencia`, nunca
`estado_autenticidad`. Si el modelo falla o devuelve baja confianza, el documento
queda en `error` y aparece en la cola de revisión, no en silencio.

Reintentos con backoff, y el `documento_id` como clave de idempotencia: correr el
flujo dos veces no puede generar dos extracciones.

### Flujo 2 — Reglas deterministas

Corre después de la extracción y no usa modelo: sumas, fechas, formatos,
duplicados de identificadores contra la base, coincidencia de RENSPA. Escribe
`discrepancias`. Es lo que sostiene que "las cifras cierran" sea una afirmación
comprobable.

### Flujo 3 — Conciliación bancaria

```
Cron (o webhook del banco)
  → lectura de movimientos
  → match por referencia / importe / fecha
  → POST /api/conciliaciones (idempotente por referencia externa)
  → lo que no matchea queda "sin identificar" para revisión manual
```

Nunca cierra una diferencia sola. Un importe menor deja el aporte en
`acreditado_parcial` con la diferencia escrita.

### Flujo 4 — Avisos

```
Eventos de la app (documento vencido, hito, acreditación, liquidación)
  → cola
  → email (reporte semanal) / push (novedades) / WhatsApp (lo urgente)
```

El asistente conversacional de WhatsApp queda para el MVP 2: este flujo solo
manda avisos, no conversa.

### Lo que n8n no hace

No decide publicaciones, no autoriza desembolsos y no ejecuta transferencias.
Llama a la API de Guardian, que es la que aplica las reglas en transacción. Si n8n
se cae, la operación no queda a medias: los flujos son idempotentes y se repiten.

## 3 bis. Lo que ya está construido (2026-09-27)

Los pasos 1 y 3 del orden de trabajo están hechos. n8n queda para más adelante;
nada de la sección 3 se empezó.

| Qué | Dónde |
|---|---|
| Esquema: 22 tablas, 20 enumeraciones, las tres restricciones del plan | `supabase/migrations/0001_esquema.sql` |
| Datos de demostración, generados desde el seed de la app | `supabase/seed.sql`, con `npm run datos:seed` |
| Contrato de la capa de datos | `src/lib/data/repositorio.ts` |
| Implementación contra el seed | `src/lib/data/memoria.ts` |
| Implementación contra Postgres | `src/lib/data/postgres.ts` |
| Conexión y elección de una u otra | `src/lib/db/conexion.ts`, `src/lib/data/index.ts` |
| Prueba que compara las dos | `npm run datos:comparar` |

### Cómo elige

Con `DATABASE_URL` va contra Postgres; sin esa variable, contra el seed en
memoria. El seed no es un resto a sacar: es lo que hace que un clon recién bajado
levante sin pedirle una base a nadie.

### Por qué hay dos implementaciones y una prueba que las compara

`npm run datos:comparar` corre las veinticinco consultas contra las dos y
compara campo por campo. Si dan lo mismo con los mismos datos, enchufar la base
no cambió lo que ven las pantallas. Corre contra un Postgres en proceso (PGlite),
así que no hace falta ninguna base levantada ni credenciales.

Esa prueba ya encontró cosas: un tipo de documento mal escrito, un campo del
modelo que faltaba en el esquema, y media docena de listas cuyo orden dependía
del array del seed y en una base no existe. Todas esas listas tienen ahora un
criterio de orden explícito, igual de los dos lados.

### Lo que el esquema decide y antes decidía una pantalla

Además de las tres restricciones del plan, la base ahora rechaza: acreditar más
de lo comprometido, un aporte "acreditado" con menos dinero del comprometido,
retirar más de lo liberado, liberar más de lo recaudado, publicar sin modalidad,
un reparto que no suma cien, una liquidación pagada sin fecha de pago, una
discrepancia resuelta sin decir cómo, y un DT-e "verificado" sin CUVE.

### Seguridad

RLS habilitada en las 22 tablas y sin ninguna política, que en Supabase significa
que la clave anónima no lee nada. La app renderiza en el servidor y entra con la
cadena de conexión, que nunca sale de ahí. Las políticas por rol entran junto con
el login: escribirlas antes sería escribirlas contra un usuario que no existe.

### Lo que falta del backend

Escribir. Todo lo de arriba es de lectura: el contrato del repositorio no tiene
una sola función que modifique nada. `publicarProyecto`, `crearOrdenSuscripcion`,
`registrarMovimiento`, `conciliar` y los tres pasos del desembolso necesitan
transacción, actor y asiento de auditoría, y eso es otra capa. La tabla
`auditoria` ya está y todavía no la escribe nadie.

## 3 ter. El MCP de Supabase (2026-09-27)

`.mcp.json` deja configurado el servidor MCP de Supabase para quien trabaje en
esta carpeta. No hay ninguna credencial en el archivo: la autorización es por
OAuth en el navegador, contra la cuenta de quien abre la sesión.

```
https://mcp.supabase.com/mcp?project_ref=dzxkghmubhvdxktejmbe&features=database,debugging,development,docs
```

Dos decisiones que están en esa URL:

- **`project_ref`** lo ata a este proyecto y apaga las herramientas de cuenta
  —crear, pausar o borrar proyectos, ver la organización—. Un agente trabajando
  acá no llega a ningún otro proyecto de la cuenta.
- **`features`** deja solo cuatro grupos: base de datos, diagnóstico,
  desarrollo y documentación. Quedan afuera *branching*, que es de plan pago, y
  *storage*, que viene apagado de fábrica.

**No está en modo solo lectura**, y es a propósito: aplicar migraciones escribe.
La base tiene datos de demostración y ningún dato real, así que el riesgo es
bajo. Si en algún momento hay datos de verdad, se agrega `&read_only=true` a la
URL y las consultas pasan a correr como un usuario de Postgres sin permiso de
escritura.

Lo que el MCP **no** reemplaza es la conexión de la app: eso sigue siendo
`DATABASE_URL` desde el servidor. El MCP es una herramienta de quien desarrolla,
no un camino de datos de la aplicación.

## 4. Orden de trabajo sugerido

1. Esquema y migraciones, con las tres restricciones de arriba.
2. Autenticación y permisos por rol, incluidas las atribuciones del fiduciario.
3. Reemplazo del cuerpo de `src/lib/data/index.ts` contra la base real.
4. Archivos privados con versionado y URL firmada de vencimiento corto.
5. Flujo 1 y flujo 2 de n8n (lectura y reglas).
6. Aportes y flujo 3 (conciliación).
7. Desembolsos, rendiciones y liquidación.
8. Flujo 4 (avisos).

## 5. Lo que no entra

Billetera, BaaS, blockchain, smart contracts, mercado secundario y entrenamiento
de modelos propios. Las interfaces de identidad, extracción, firma, banco y
notificaciones se dejan reemplazables: ningún proveedor se elige todavía.
