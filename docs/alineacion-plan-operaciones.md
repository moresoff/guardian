# Alineación del MVP con el plan de operaciones

Fecha: 2026-09-27. Este documento acompaña los cambios de código de la etapa A
(coherencia de dominio) y de la parte de la etapa B que llega hasta la cuenta del
colaborador. Dice qué quedó implementado, qué se simula y qué falta.

## 1. Lo que cambió en el dominio

### Modalidad en lugar de destino de fondos

`DestinoFondos` (`capital_trabajo | ciclo_engorde | mixto`) dejó de ser el eje del
proyecto. Ahora hay dos modalidades y una tercera posibilidad que no es una
categoría sino un hueco:

| Modalidad | Qué financia | Qué recibe el colaborador |
|---|---|---|
| `compra_engorde` | Adquisición de hacienda y los gastos del ciclo incluidos en el presupuesto | Participación en el resultado efectivo de la venta |
| `capital_trabajo` | Gastos del ciclo sobre un lote que el productor ya tiene | Capital más la tasa pactada, sujeta a que el productor cumpla |
| `null` | Sin determinar | Nada: el proyecto no se puede publicar |

**Migración, proyecto por proyecto.** `ciclo_engorde → compra_engorde` y
`capital_trabajo → capital_trabajo` son directos. El único `mixto` del seed
(`pry-3`) financia la compra de 60 vaquillonas más la suplementación del lote:
hay adquisición de hacienda, así que es compra y engorde con gastos adentro. Esa
determinación se tomó leyendo el proyecto, no por regla automática, y queda
registrada acá y en el comentario del seed.

Cada proyecto conserva `destinoFondosPrevio` para poder rastrear de dónde salió
su modalidad.

**El caso ambiguo** es `pry-14`, agregado al seed a propósito: su texto no
permite saber si el capital compra hacienda o solo paga gastos. Tiene
`modalidad: null`, un `motivoRevisionModalidad` escrito y no se puede enviar a
revisión ni publicar.

### Lo que ya no se afirma

- **Fijo y variable.** La descripción de cada modalidad ya no dice que capital de
  trabajo sea costo fijo ni que compra y engorde sea variable. Eso depende del
  rubro y del contrato.
- **Rendimiento esperado genérico.** Reemplazado por `retornoDelProyecto()`, que
  devuelve "Tasa contractual" o "Participación en el resultado" según la
  modalidad, y "Pendiente de definición" cuando falta el parámetro.
- **Caso real.** El ciclo cerrado de la portada dice "demostrativo".
- **Productor verificado.** El sello de la ficha pasó a ser un bloque que dice
  qué se revisó (legajo, RENSPA, disponibilidad del predio) y qué no acredita
  (propiedad de los animales ni del inmueble).
- **Saldos de billetera.** El panel del productor dejó de hablar de "lo único que
  podés sacar hoy": ahora son desembolsos aprobados, capital en el fideicomiso e
  histórico acreditado, con el texto que aclara que no hay saldo que mover.

### Condiciones económicas

`CondicionesEconomicas` cuelga del proyecto y se llena según la modalidad:
`participacion` (con su base y su fuente), `tasa` (con base temporal, cálculo y
vencimientos) y `proyeccion` (con fecha, supuestos, ingresos, costos y
comisiones). Toda condición del seed lleva `fuente: "demostrativo"` y la ficha lo
dice al lado del número.

`condicionesPendientes()` y `puedePublicarse()` centralizan la regla: sin
modalidad, sin reparto, sin tasa, sin base temporal, sin objetivo o sin mínimo de
inicio, el proyecto no se publica y el panel de validación lo enumera.

### Aportes, fondeo y liquidaciones

Modelo nuevo: `Aporte` (orden de suscripción, comprometido, acreditado,
movimientos bancarios), `MovimientoBancario` (referencia externa y estado de
conciliación) y `Liquidacion` (calculada, aprobada, pagada).

`calcularFondeo()` calcula el recaudado **desde los aportes acreditados**. Lo
comprometido y sin acreditar se muestra aparte y nunca sumado. El seed genera un
aporte agregado por proyecto para que `montoRecaudadoArs` y la suma de aportes
den lo mismo.

### Garantías

`estadoConstitucion` (`propuesta | en_revision | constituida`) se suma a
`estado`. El cupo por cantidad de proyectos sigue como política operativa, con
la aclaración en el tipo de que no mide cobertura económica.

## 2. Matriz de requisitos

| Requisito del encargo | Implementación | Cómo se comprueba | Pendiente |
|---|---|---|---|
| Dos modalidades, sin "mixto" | `Modalidad` en `types.ts`, `MODALIDAD_*` en `format.ts` | Catálogo, ficha, alta y panel de validación muestran la modalidad | — |
| Registro ambiguo no se migra ni se publica | `modalidad: null` + `motivoRevisionModalidad`; `puedePublicarse()` | `/productor/proyectos/pry-14` | Pantalla para resolver la modalidad |
| Tasa contractual vs resultado proyectado | `retornoDelProyecto()`, avisos por modalidad | `/proyectos/pry-1` (tasa) y `/proyectos/pry-2` (participación) | — |
| Condiciones incompletas bloquean | `condicionesPendientes()`, checklist del admin | `/admin/proyectos/pry-5` | Bloqueo del lado del servidor |
| Porcentaje sobre aportes acreditados | `calcularFondeo()` | Barra de la ficha y de la cartera | — |
| Adhesión no acredita | Flujo `Adherir` → orden de suscripción → instrucciones | `/proyectos/pry-1`, botón "Adherir al proyecto" | Conciliación real |
| Conciliación parcial y diferencias | `MovimientoBancario.estadoConciliacion`, aporte `acreditado_parcial` | `/colaborador/cartera`, aporte de `pry-13` | Motor de conciliación |
| Cuenta del colaborador | `/colaborador/cartera` | Acreditado, pendiente, liquidado pagado y sin pagar | Exposición por modalidad, filtros |
| Sin billetera | Textos del panel del productor y de la cartera | Ambas pantallas | Renombrar `pendienteDeRetiro` en el modelo |
| Garantía propuesta ≠ constituida | `estadoConstitucion` | Tipos y seed | Mostrarlo en la ficha y en "Mis garantías" |
| Sello de verificación con alcance | Bloque "Qué revisó Guardian" en la ficha | `/proyectos/pry-1` | Fecha y método por control |
| Caso del seed rotulado | "Caso cerrado · demostrativo" | Portada | — |
| Seguimiento compartido | `Seguimiento` en las dos vistas | `/proyectos/pry-9` y `/productor/proyectos/pry-9` | Incidencias y proyecciones fechadas |

## 3. Escenarios de demostración

Los datos salen de `src/lib/data/seed.ts` y se reinician **en cada recarga del
servidor**: nada de lo que se carga en pantalla persiste.

| Escenario | Dónde | Qué muestra |
|---|---|---|
| Capital de trabajo abierto | `/proyectos/pry-1` | Tasa contractual, aviso de riesgo de incumplimiento, adhesión habilitada |
| Compra y engorde | `/proyectos/pry-2` | Participación, proyección con supuestos y fecha, acreditado vs adherido |
| Fondeo parcial con diferencia | `/colaborador/cartera` | Un aporte acreditado, uno parcial con su observación y uno pendiente |
| Ciclo en curso | `/proyectos/pry-9` | Seguimiento con pesadas, ganancia diaria y gasto acumulado |
| Ciclo cerrado | `/proyectos/pry-6` | Resultado del romaneo y liquidación pagada en la cartera |
| Condiciones sin pactar | `/admin/proyectos/pry-5` | Checklist que impide publicar |
| Modalidad sin determinar | `/productor/proyectos/pry-14` | Aviso, trazabilidad del valor anterior y bloqueo |

## 4. Chequeos ejecutados

- `npx tsc --noEmit`: sin errores.
- `sh .claude/skills/impeccable/scripts/impeccable detect src`: salida 0.
- `npm run build`: compila.
- Revisión en el navegador de las pantallas tocadas: catálogo, ficha pública,
  cartera, panel de validación, ficha del productor y alta.

## 5. Lo que queda pendiente

Por orden de importancia para la etapa siguiente:

1. **Motor de requisitos documentales.** Hoy sigue siendo la lista fija de
   `documentosRequeridos(tipoPosesion)`. Falta que evalúe modalidad, etapa,
   movimiento, origen del lote, jurisdicción y rubro, y que clasifique cada
   requisito como normativo, jurisdiccional o política de Guardian.
2. **Estados ampliados.** Falta separar el estado principal (borrador, en
   revisión, pendiente de documentación, aprobado, publicado, en ejecución,
   cerrado, rechazado, cancelado) del estado de fondeo, y modelar hitos,
   desembolsos y rendiciones con estados propios.
3. **Desembolsos y rendiciones.** Las tres instancias —requisitos cumplidos,
   solicitud autorizada, pago confirmado— no están construidas.
4. **Onboarding de identidad.** Estados de identidad, prealta sin permisos y
   simulación explícita del proveedor.
5. **Múltiples establecimientos** por productor y legajo por establecimiento.
6. **Permisos.** Hoy no hay autenticación: cualquiera ve cualquier pantalla.
7. **Alta ramificada completa.** El alta ya elige modalidad, pero todavía no pide
   vendedor y establecimiento receptor en compra, ni proveedores, calendario y
   fuente de repago en capital de trabajo.

## 6. Decisiones que no se inventaron

Siguen pendientes de definición y están marcadas como demostrativas donde
aparecen: estructura fiduciaria y atribuciones, monedas y conversión, comisiones
e impuestos, reparto de resultados y pérdidas, tasas y convenciones de cálculo,
mínimo de inicio y qué pasa si vence la captación, garantías exigibles y su
liberación, requisitos por jurisdicción, proveedores de identidad y firma, y
política de permisos y conservación documental.

## 7. Texto para actualizar la bóveda

No se tocó `C:\Users\More\Documents\Obsidian\Guardian`. Para actualizarla hacen
falta estos cambios, que conviene aplicar a mano:

**En `CLAUDE.md`**, la regla "Guardian financia dos cosas y la línea es el
animal" pasa a decir:

> - **Guardian financia dos modalidades y la línea es el animal.** `compra_engorde`
>   es el capital que adquiere hacienda y la termina, y puede incluir los gastos
>   de ese ciclo; el colaborador participa del resultado efectivo de la venta.
>   `capital_trabajo` financia gastos sobre un lote que el productor ya tiene; el
>   colaborador recibe capital más la tasa pactada y el riesgo es de incumplimiento.
>   No hay una tercera modalidad: un proyecto que compra y además paga la ración
>   sigue siendo compra y engorde. Que un gasto sea fijo o variable depende del
>   rubro y del contrato, no de la modalidad. La definición vive en
>   `MODALIDAD_DESCRIPCION` (`src/lib/format.ts`).

**Regla nueva, a agregar**:

> - **Lo prometido no es capital.** El porcentaje recaudado sale de los aportes
>   acreditados por el banco y conciliados contra su orden de suscripción. Una
>   adhesión sin transferencia se muestra aparte y nunca sumada. No hay saldo de
>   billetera: el dinero está en la cuenta del fideicomiso de cada proyecto.

**En `MVP/Qué contiene el MVP.md`** hay que reemplazar la sección del modelo de
datos (destino de fondos → modalidad, condiciones económicas, aportes,
liquidaciones, restricciones) y agregar `/colaborador/cartera` a las pantallas.

## 7 bis. El frente del colaborador (2026-09-27)

Guardian pasó a ser **el fiduciario** de cada serie, y no un tercero que coloca y
monitorea. En la interfaz eso cambió tres cosas: el dato "Fiduciario" de cada
proyecto dice Guardian, el aviso de "qué hace Guardian y qué no" ya no promete
que el patrimonio lo administre otro, y quienes cobran el resultado se llaman
**fideicomisarios**. Lo que no cambió es la separación entre administrar y
garantizar: sigue escrito, en la ficha y en la portada, que el resultado sale de
la venta del lote.

El colaborador quedó con tres pantallas y ninguna más:

| Pantalla | Qué tiene |
|---|---|
| `/proyectos` | El catálogo, con la misma tarjeta que la portada: foto, destino del capital, cabezas, plazo, retorno y fondeo |
| `/proyectos/[id]` | La ficha entera del plan (sección 8), con los textos recortados |
| `/colaborador/cartera` | Acreditado, comprometido sin acreditar, en ciclos abiertos, liquidado sin cobrar y cobrado, más la distribución por proyecto |
| `/colaborador/perfil` | Datos, identidad verificada, cuenta de devolución, contratos aceptados y avisos |

Las dos páginas que explicaban la plataforma antes de entrar —`/para-productores`
y `/colaborador`— se sacaron: las puertas de la portada van derecho al registro
con el lado ya elegido.

## 8. Cobertura de la ficha que pide el plan

La lista de la sección "Para el colaborador" del plan, contra lo que hoy muestra
/proyectos/[id].

| Dato que pide el plan | Estado |
|---|---|
| Modalidad | Está |
| Cabezas y categoría | Está |
| Raza | Está: campo declarado en el alta y en la ficha |
| Sistema de engorde | Está |
| Peso de entrada, objetivo y ganancia diaria estimada | Está |
| Monto objetivo, mínimo de inicio y porcentaje recaudado | Está |
| Destino de los fondos | Está, como texto del productor |
| Presupuesto por rubro | Está: tabla en la ficha y editor de filas en el alta |
| Cronograma de desembolsos | Está: hitos con momento, monto y condición de liberación |
| Plazo del ciclo | Está |
| Plazo de cobro | Está, separado del plazo del ciclo |
| Rendimiento proyectado o tasa contractual | Está, separado por modalidad |
| Moneda de aporte y devolución | Está |
| Criterio de conversión | No aplica: una sola moneda |
| Gastos y comisiones | Está: concepto, base, porcentaje, quién la paga y cuándo |
| Condiciones de liquidación | Está: reparto, comisiones y bloqueo cuando falta un parámetro |
| Estado de validación y alcance de los controles | Está: control, fecha, alcance, método y responsable |
| Garantía: tipo, bien, valuación y vigencia | Está |
| Respaldo documental | Está |
| Información del productor | Está |
| Estructura del fideicomiso | Está |
| Tratamiento de pérdidas, mortandad, demoras e incumplimientos | Está: cinco contingencias con qué dice el contrato y quién lo soporta |

Los cinco huecos se cerraron el 2026-09-27, y ese mismo día las comisiones y las
contingencias. La ficha del plan queda cubierta entera.

Los porcentajes de comisión y el texto de cada contingencia son **ficticios** y
están marcados como demostrativos: la estructura es la que hay que poder
verificar —sobre qué se calcula, cuándo se cobra, quién la paga—, y el tarifario
real sigue siendo una decisión pendiente. `pry-13` queda sin comisión definida a
propósito, para ver qué pasa cuando falta el dato: la ficha dice que el ciclo no
se puede liquidar así.

El presupuesto y el cronograma del seed se derivan del propio proyecto para que
nunca contradigan su monto ni su plazo; en el alta el presupuesto se carga rubro
por rubro y la suma se controla contra el capital pedido.
