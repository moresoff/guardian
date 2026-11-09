# Auditoría de la aplicación: qué simplificar y qué falta del trabajo

Fecha: 2026-11-09. Se recorrió la app por dentro con una cuenta nueva de cada
lado (teléfono, 390 px) y se comparó cada etapa con lo que dice el trabajo final
(`Guardian_9.md`). Las referencias «L» son líneas de ese archivo.

## 0. Hecho después de esta auditoría (2026-11-09)

- **Validación que funciona** (`src/lib/validacion.ts`, `src/app/admin/acciones.ts`):
  verificar la autenticidad de cada papel (el DT-e con su CUVE), rechazarlo con
  motivo, resolver cada diferencia diciendo cómo, publicar y rechazar el proyecto
  con motivo. Publicar se vuelve a controlar en el servidor y exige el contrato
  del fideicomiso firmado. El productor ve el motivo si se rechaza.
- **Acreditar aportes**: «Transferencias por confirmar» en la cola de validación.
  Registra el movimiento bancario (la orden es la referencia, así no se duplica),
  pasa el aporte a acreditado y suma a lo recaudado.
- **Mínimo para arrancar**: un proyecto nuevo nace con el 80 % del objetivo.
- **Números del ciclo**: `src/lib/ciclos.ts` sale del modelo del simulador, que
  es el del trabajo (feedlot de 90 días, 31,78 / 68,22). Migración `0006`.
- **Comisión del productor** partida en 2 % al ejecutar y 1,5 % de éxito, con el
  piso de 0,5 % si desiste, en el simulador y en el contrato (v2).
- **Pago único**: la ficha ya no muestra tramos de desembolso.
- **Mis datos** del colaborador con lo que declaró en la identidad (DNI, CUIL,
  domicilio, CBU) y los contratos que firmó, con su huella.
- **Tres avisos fijos** en lugar de interruptores que no guardaban nada.
- **Panel del productor** completo aunque esté en cero.
- **Identidad** y **alta de un proyecto** en una sola pantalla cada una.

Probado de punta a punta en el teléfono, en memoria y contra Postgres: alta del
productor, identidad, presentar con papeles, firmar, validar, publicar, alta del
colaborador, participar, firmar y acreditar.

## 1. El circuito de punta a punta

| Etapa | Lo que dice el trabajo | La app hoy | Estado |
|---|---|---|---|
| Alta | Productor por consignatario o registro directo; colaborador **solo por invitación, con código** de quien lo presentó, y ve solo los proyectos a los que lo invitaron (L1374–1378) | Registro abierto de los dos lados; catálogo abierto a cualquier cuenta | Distinto |
| Identidad | DNI con OCR, autenticidad, prueba de vida, cotejo facial, RENAPER, PLA/FT; aprobación automática, revisión manual o rechazo (L1762–1768) | Los cuatro pasos simulados; PEP queda en revisión; sin persona jurídica | Simulado |
| Presentar el proyecto | Flujo guiado con hacienda, vendedor, establecimiento receptor y presupuesto (L1573) | Asistente de 4 pasos; vendedor y receptor se piden pero no se guardan | Hecho a medias |
| Validación | Estados borrador → en revisión → pendiente de documentación → aprobado → publicado; revisión humana registrada; **sin contrato firmado no se publica** (L1701, L2231) | La cola muestra el proyecto, pero **«Publicar», «Rechazar», «Verificar autenticidad» y «Rechazar documento» no hacen nada** | **Cortado** |
| Publicación | Ficha estandarizada; publicación revocable (suspender adhesiones) (L1705) | Ficha completa; no hay suspensión | Hecho, sin suspensión |
| Participar | Contrato de adhesión, transferencia a la cuenta del fideicomiso, 1 % aparte (L1599) | Hecho: 4 pasos, firma con código, orden de suscripción | Hecho |
| Acreditar el aporte | El banco informa, se concilia y se actualiza lo recaudado; estados pendiente, acreditado, aplicado, devuelto (L1754–1756, L2632) | El aporte queda **pendiente para siempre**: nadie puede acreditarlo | **Cortado** |
| Cierre de la suscripción | Éxito con **≥ 80 %**; cupo de **25 colaboradores**; si no se llega, se devuelve (L1149, L1114, L866) | Hay «mínimo de inicio» en la ficha; no se controla el 80 % ni el cupo, y no hay cierre | Falta |
| Pago de la compra | **Un único pago** del fiduciario al vendedor, después de verificar vendedor, precio y receptor; tres instancias: requisitos, aprobación, pago; **no hay desembolsos periódicos** (L1601–1603, L690, L1703) | La ficha muestra un **cronograma de varios tramos** del seed; no hay acción | **Contradice** |
| Constancia al colaborador | Constancia cuando se documenta la compra y se paga al vendedor (L1461) | No existe | Falta |
| Seguimiento | Carga simple de pesajes, sanidad, mortandad e incidencias; **informe mensual** al colaborador con desvíos contra lo proyectado (L1577, L1462) | «Registrar pesada» existe pero **no se guarda**; los ciclos en curso son del seed | Solo pantalla |
| Cierre y liquidación | Conciliación de cabezas e importes; liquidación explicada, **también si es adversa**; distribución por la cascada (L1681–1685, L1150) | Solo los ciclos cerrados del seed | Falta |
| Después del cierre | Reinversión con prioridad de cupo; NPS; comparación proyectado vs. real; antecedentes del productor en la ficha (L1457, L1472, L2273, L1557) | No existe | Falta |
| Avisos | **Tres avisos fijos**: constancia de compra, informe mensual y liquidación (L1689) | Interruptores de avisos que no guardan nada | Distinto |
| Reclamos | Canal y responsables para registrar y resolver incidencias (L2141) | No existe | Falta |

**Lo más grave:** el circuito se corta dos veces. Un proyecto presentado nunca
llega a publicarse (la validación no hace nada) y un aporte firmado nunca llega a
acreditarse. Todo lo que viene después (compra, seguimiento, cierre) solo se ve
con los proyectos del seed.

## 2. Lo que contradice al trabajo

1. **Los números del ciclo.** El trabajo dice feedlot de **90 días** con reparto
   31,78 / 68,22 (L2708), igual que el simulador. `src/lib/ciclos.ts` dice 131 días
   y 32,01 / 67,99, y eso es lo que muestran la ficha, el alta y el contrato.
   Esto responde la pregunta abierta de la auditoría anterior: el dato bueno es
   el del trabajo.
2. **El cronograma de desembolsos.** El trabajo dice un solo pago de la compra al
   vendedor; la ficha muestra tramos con condiciones de liberación.
3. **La comisión del productor.** El trabajo la parte en 2 % al ejecutar y 1,5 %
   de éxito, con un piso de 0,5 % si desiste (L1176). La app muestra 3,5 % de una vez.
4. **El aporte.** El trabajo arma 25 aportes de $4.320.000 (L742); la app acepta
   cualquier monto desde $100.000 y sin tope de colaboradores.
5. **Mis datos del colaborador.** Muestra un CBU de demostración y no el que se
   cargó al validar la identidad, y «Contratos que aceptaste» sale de los aportes
   del seed, no de las firmas guardadas.

## 3. Lo que se puede simplificar adentro

Medido con una cuenta nueva, en pantallas de teléfono.

| Pantalla | Hoy | Propuesta |
|---|---|---|
| Ficha del proyecto (colaborador) | 2,3 a 4,4 pantallas, unos 10 bloques | Sacar el cronograma de tramos (contradice el trabajo, punto 2.2) y el panel «Condiciones del proyecto», que repite el contrato. Lo de «Comisiones» y «Contingencias» pasa a ser una cláusula del contrato. |
| Mis datos (colaborador) | 2,9 pantallas, 2 avisos «Prototipo» | Una sola pantalla con lo que se cargó en la identidad (datos, CBU real) y las firmas guardadas. Los «Avisos» se reemplazan por los tres fijos del trabajo. |
| Mi establecimiento | 3,0 pantallas | Juntar «Identidad verificable» con «El campo»; sacar los interruptores de avisos. |
| Cargar un proyecto | Asistente para uno nuevo y «ficha técnica» para un borrador | Solo el asistente. |
| Avisos «Prototipo» | 9 en pantallas internas | Sacarlos: el pie ya lo dice. Dejar una línea solo donde algo no se guarda. |
| Recorrido guiado | Se abre solo y tapa la pantalla | Ofrecerlo con un botón. |
| Rutas viejas | `/productor/proyectos/[id]`, `/productor/perfil`, `/productor/documentacion`, `/colaborador/perfil`, `/admin/proyectos/[id]` y 5 públicas | Borrarlas. |

## 4. Orden propuesto

Primero cerrar el circuito, porque es lo que hace que la demo se pueda recorrer
de punta a punta con un proyecto propio:

1. **Validación que funciona.** Verificar y rechazar documentos, resolver
   discrepancias, aprobar y publicar (solo con el contrato firmado) o rechazar con
   motivo. Todo con auditoría.
2. **Acreditar aportes.** Un botón de «el banco informó la transferencia» en la
   validación, que pasa el aporte a acreditado y suma a lo recaudado.
3. **Cerrar la suscripción con el 80 % y el cupo de 25.** Si no se llega, los
   aportes quedan «devueltos».
4. **Pago único de la compra** con sus tres instancias, la constancia al
   colaborador y el cronograma de tramos fuera.
5. **Seguimiento que se guarda** (pesadas, sanidad, mortandad) y el informe
   mensual en la cartera.
6. **Cierre y liquidación** explicada, también adversa, con reinversión.

En paralelo, lo que es corto: unificar los números del ciclo con el trabajo,
partir la comisión del productor, «Mis datos» con los datos reales, los tres
avisos fijos y sacar lo repetido de la ficha.

Lo que queda para más adelante, porque el trabajo lo pone en etapas posteriores:
alta por invitación con código, panel de consignatarias, asistente por WhatsApp,
IoT, puntaje de riesgo, mercado secundario.
