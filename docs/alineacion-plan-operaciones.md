# Alineación del MVP con el plan de operaciones

Fecha: 2026-09-27. Este documento acompaña los cambios de código de la etapa A
(coherencia de dominio) y de la parte de la etapa B que llega hasta la cuenta del
colaborador. Dice qué quedó implementado, qué se simula y qué falta.

## 0. Cambio de alcance (2026-10-29)

Este cambio **reemplaza** lo que dicen las secciones siguientes sobre las dos
modalidades, la tasa contractual y Guardian como fiduciario. Las secciones se
conservan como historia de cómo se llegó hasta acá.

- **Guardian financia solamente el proceso productivo de engorde.** Ya no hace
  capital de trabajo. Hay una sola modalidad, `compra_engorde`: si el lote todavía
  hay que comprarlo, el capital incluye la compra; si ya es del productor, financia
  el resto del proceso (ración, sanidad, corral, flete). Esa diferencia la dice
  `tipoPosesion`, no la modalidad. El colaborador participa del resultado efectivo
  de la venta; no hay tasa contractual.
- **Desaparece el "sin determinar".** Existía para decidir entre dos modalidades.
  `Proyecto.modalidad` ya no es nula y `motivoRevisionModalidad` se eliminó. `pry-14`
  sigue siendo un borrador que no se puede publicar, pero porque le faltan el
  reparto, el mínimo de inicio y la garantía.
- **Guardian ya no es el fiduciario.** El fiduciario de cada serie es un tercero
  independiente. En los datos de prueba se llama "Fiduciaria Independiente S.A.",
  un nombre genérico que hay que reemplazar por el real. Guardian conecta y verifica
  la documentación; el fiduciario administra el patrimonio separado, rinde cuentas
  y responde por su gestión. Nadie garantiza el resultado.
- **Los 11 proyectos de capital de trabajo del seed** pasaron a compra y engorde.
  Los que tenían tasa pactada ahora llevan participación 65/35 (60/40 en `pry-13`),
  que es lo que ya decía el reparto del fideicomiso de cada serie. Los que tenían la
  tasa sin pactar quedan con el reparto "Sin pactar". El presupuesto y el cronograma
  derivados distinguen si el lote ya existe (`existencia_comprobada`) o hay que
  comprarlo.
- **Esquema.** `supabase/migrations/0002_solo_engorde.sql` deja el enum `modalidad`
  con un solo valor y obligatorio, saca `capital_trabajo` de `destino_fondos`,
  elimina las columnas `tasa_*` y `motivo_revision_modalidad`, y cambia el
  fiduciario de las series que nombraban a Guardian. El runner de migraciones corre
  todas las migraciones desde cero (no lleva registro de las aplicadas): sobre una
  base que ya tiene la 0001 hay que correr la 0002 a mano.
- **Tres tipos de ciclo (2026-10-30).** El sistema productivo define el plazo y el
  reparto del resultado; la tabla vive en `src/lib/ciclos.ts`:

  | Tipo (`sistemaProductivo`) | Plazo | Productor | Colaboradores | Rentabilidad anual estimada del productor |
  |---|---|---|---|---|
  | Feedlot puro (`corral`) | 131 días | 32,01 % | 67,99 % | 6,59 % |
  | Mixto (`mixto`) | 180 días | 30,55 % | 69,45 % | 7,46 % |
  | Pastura pura (`pastura`) | 240 días | 26,33 % | 73,67 % | 41,35 % |

  El seed y el alta de proyecto usan esa tabla. La rentabilidad es una estimación
  del modelo y solo se muestra del lado del productor. Las cifras del feedlot
  suman 100 con 32,01 / 67,99; el pedido original decía 32,1 / 67,99 (100,09).
- **Registro y recorrido.** El registro es solo crear la cuenta. Al terminar se
  entra a la aplicación (`/productor` o `/proyectos`) y ahí aparece el recorrido
  guiado (`src/components/recorrido-guiado.tsx`): una guía flotante que sigue a
  la persona por las pantallas reales y le dice qué cargar en cada una. Se puede
  salir en cualquier momento y volver a abrir desde el pie de página.
- **Con cuenta y sin cuenta (2026-10-30).** Sin cuenta se ve la portada, un catálogo
  resumido (de qué va cada proyecto, sin montos, plazos ni reparto) y una ficha
  pública con el lote y el respaldo documental. Con cuenta se ve todo lo demás: las
  áreas de productor, colaborador y validación exigen sesión, y la ficha completa
  muestra las condiciones. La sesión es una cookie del prototipo
  (`src/lib/sesion.ts`): separa lo que se ve con y sin cuenta, pero no es seguridad,
  porque todavía no hay usuarios ni contraseñas.
- **Condiciones del proyecto.** El panel que mostraba el fideicomiso pasó a
  `src/components/condiciones-panel.tsx`: un resumen de cómo se participa (quiénes,
  qué se aporta, para qué, reparto, mortandad, duración, rendición de cuentas), sin
  serie, inscripción ni seguro. El detalle completo queda en el contrato.
- **Rentabilidad estimada del modelo.** El campo "Rendimiento esperado" que cargaba
  el productor se sacó del alta: la rentabilidad anual estimada sale del tipo de
  ciclo (`src/lib/ciclos.ts`) y se muestra solo al productor y a validación.
  "Rendimiento" a secas queda para el rendimiento de faena del romaneo.
- **Contacto.** El correo de consulta sale de `NEXT_PUBLIC_CORREO_CONTACTO`
  (`.env.example`); sin valor no se muestra ningún enlace.
- **Vocabulario.** La interfaz habla de colaborar y participar, no de financiar, y
  no nombra el fideicomiso ordinario fuera de la ficha de cada proyecto. La regla
  está en `.claude/skills/diseno-guardian/SKILL.md` y en `CLAUDE.md`.
- **Interfaz.** El filtro por modalidad del catálogo se sacó (había una sola
  opción), el alta ya no pregunta la modalidad y pide vendedor y establecimiento
  receptor solo si el lote hay que comprarlo, o proveedores si ya existe.

## 1. Lo que cambió en el dominio

### Modalidad en lugar de destino de fondos

> Histórico: ver la sección 0. Hoy hay una sola modalidad.

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
| Una modalidad (antes dos), sin "mixto" | `Modalidad` en `types.ts`, `MODALIDAD_*` en `format.ts` | Catálogo, ficha, alta y panel de validación muestran la modalidad | — |
| Condiciones incompletas no se publican | `puedePublicarse()` | `/productor/proyectos/pry-14` | — |
| Resultado proyectado no garantizado | `retornoDelProyecto()`, aviso en la ficha | `/proyectos/pry-1` y `/proyectos/pry-2` (participación) | — |
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
| Compra y engorde, lote que ya existe | `/proyectos/pry-1` | Participación 65/35, presupuesto sin compra de hacienda, adhesión habilitada |
| Compra y engorde, lote a comprar | `/proyectos/pry-2` | Participación, proyección con supuestos y fecha, acreditado vs adherido |
| Fondeo parcial con diferencia | `/colaborador/cartera` | Un aporte acreditado, uno parcial con su observación y uno pendiente |
| Ciclo en curso | `/proyectos/pry-9` | Seguimiento con pesadas, ganancia diaria y gasto acumulado |
| Ciclo cerrado | `/proyectos/pry-6` | Resultado del romaneo y liquidación pagada en la cartera |
| Condiciones sin pactar | `/admin/proyectos/pry-5` | Checklist que impide publicar |
| Borrador con el reparto sin pactar | `/productor/proyectos/pry-14` | Condiciones pendientes y bloqueo de publicación |

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
7. **Alta ramificada completa.** El alta pide vendedor y establecimiento receptor
   si el lote hay que comprarlo, y proveedores si ya existe, pero esos datos
   todavía no se guardan: viven en el borrador hasta que haya backend.

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

> Lo que sigue sobre Guardian como fiduciario quedó superado por la sección 0:
> el fiduciario es ahora un tercero independiente.

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
| Rendimiento proyectado | Está, como participación en el resultado |
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

## Cuentas (nombre real en la sesión)

- El alta guarda la cuenta en `perfiles` (migración `0003_usuarios.sql`: `clave_hash` y `cuit`). La contraseña se guarda con scrypt y sal; nunca en claro.
- Con `DATABASE_URL` las cuentas van a Supabase; sin ella viven en memoria y se pierden al reiniciar.
- La cookie `guardian_sesion` es httpOnly y está firmada (HMAC con `SESION_SECRETO`).
- Lo único real de la sesión es la cuenta: el nombre se muestra en el menú y en el saludo del productor. El resto de las pantallas sigue con datos de demostración.
- Pendiente: pasar a Supabase Auth (verificación de correo, recuperación de contraseña) cuando estén las credenciales del proyecto.
