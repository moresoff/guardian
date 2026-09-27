---
name: diseno-guardian
description: Sistema de diseño de Guardian, la plataforma que conecta inversores con productores ganaderos. Usala siempre que escribas, revises o cambies interfaz de Guardian — pantallas, componentes, tokens, tipografía, color, formularios, estados vacíos, de carga y de error, textos de UI. Define la paleta, la escala tipográfica en Poppins, las reglas de accesibilidad para usuarios mayores y el vocabulario visual del dominio (RENSPA, DT-e, caravanas, romaneo).
user-invocable: true
---

# Sistema de diseño de Guardian

Guardian financia ciclos de engorde: un productor publica el capital de trabajo que necesita y un grupo de inversores lo pone. Las dos puntas miran las mismas cifras y las dos tienen dinero de por medio.

## Las tres reglas que mandan sobre todo lo demás

**1. Lo van a usar personas mayores, en el teléfono, con sol.** Un productor de sesenta y pico carga un DT-e parado en el corral. Texto de 18px para arriba, contraste alto siempre, botones que se puedan tocar con el dedo grueso. Si una decisión estética pelea con la legibilidad, gana la legibilidad y no hay discusión.

**2. Simple y a la vista.** Nada plegado detrás de un ícono, nada que dependa de un hover, nada de menús de tres niveles. Si algo importa, está escrito. Si no importa, no está.

**3. Lo que salió de un papel se ve distinto de lo que se escribió en un formulario.** Es la regla propia de Guardian: un RENSPA leído de una constancia, el CUVE de un DT-e, las caravanas de un listado — todo eso se muestra en monoespaciada. Un número que el productor tipeó, no. La diferencia entre "esto lo declaró alguien" y "esto salió de un documento" es todo el producto.

---

## Color

Paleta cerrada. Cualquier color que no esté acá no se usa.

### De marca

| Token | Hex | Para qué | Contraste sobre blanco |
|---|---|---|---|
| `--marca` | `#085041` | Botones primarios, enlaces, texto de acción, cifras destacadas | 9,4:1 ✓ |
| `--marca-viva` | `#1D9E75` | Superficies, barras de progreso, íconos grandes, bordes. **Nunca texto chico** | 3,4:1 |
| `--marca-suave` | `#E1F5EE` | Fondo de bloques verificados, badges, destacados | — |
| `--acento` | `#7F77DD` | Acento secundario: gráficos, un detalle, una ilustración. Sin significado de estado | 3,8:1 |
| `--acento-texto` | `#514AA6` | El violeta cuando tiene que ser texto | 7,4:1 ✓ |
| `--acento-suave` | `#EEEDFE` | Fondo violeta muy claro | — |

El violeta es decorativo. **No significa nada**: no marca un estado, no marca un rol, no marca un tipo de proyecto. Si aparece dos veces en la misma pantalla queriendo decir cosas distintas, está mal usado.

### Neutros

| Token | Hex | Para qué |
|---|---|---|
| `--papel` | `#F5F5F3` | Fondo de la aplicación |
| `--superficie` | `#FFFFFF` | Tarjetas y paneles, levantados sobre el papel |
| `--superficie-2` | `#ECECE8` | Bloques hundidos, celdas de tabla, pistas de progreso |
| `--borde` | `#DCDCD6` | Filetes y contornos |
| `--borde-fuerte` | `#C4C4BD` | Contorno de botón secundario, bordes punteados |
| `--tinta` | `#17211D` | Texto principal |
| `--tinta-suave` | `#5C5B56` | Texto secundario — 6,2:1 sobre el papel ✓ |
| `--tinta-tenue` | `#6E6D67` | Rótulos y notas al pie — 4,8:1 sobre el papel ✓ |

> El `#888780` de la paleta original da 3,6:1 y **no alcanza para texto**. Vive como `--borde-fuerte` y en separadores, no como color de letra. Los grises de texto son las versiones oscurecidas de arriba.

### Estados

La paleta de marca no tiene color de advertencia ni de error, y hacen falta. Estos dos son el mínimo necesario, elegidos para convivir con el verde sin pelearse:

| Token | Hex | Significa |
|---|---|---|
| `--alerta` / `--alerta-suave` | `#8A5410` / `#FBF0DE` | Pide atención: una discrepancia, un documento sin verificar |
| `--error` / `--error-suave` | `#96271F` / `#F9E9E7` | Está mal: un documento rechazado, un proyecto rechazado |

El verde de marca es **también** el color de "verificado". No son dos verdes: que Guardian apruebe algo y la identidad de Guardian son la misma afirmación.

### Tema oscuro

Tres estados, no dos: la elección explícita estampa `data-theme` en la raíz, y el default del sistema no estampa nada. Se declara la paleta clara completa en `:root` pelado, se redefinen **solo los tokens** en `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }` y otra vez en `:root[data-theme="dark"]`, con `color-scheme: dark` en los dos. Ningún color tiene su única definición adentro de un bloque de tema.

---

## Tipografía

**Poppins** para todo. **JetBrains Mono** solo para datos que salieron de un documento.

La mono se eligió por el caso de uso: una caravana RFID son quince dígitos que alguien compara contra un papel. JetBrains Mono tiene el cero rayado, la `1` con base, la `l` con cola y la `I` con remates — cuatro glifos que en una geométrica como Poppins son casi el mismo palito. Su altura de x es alta, así que sentada al lado de Poppins en la misma línea no se hunde.

Poppins es geométrica y limpia, pero tiene la `a` de un solo piso y la `I` mayúscula sin remates. Dos consecuencias prácticas:

- **Nada de textos largos en mayúsculas.** Solo rótulos de dos o tres palabras.
- **Peso 400 para texto corrido, 500 para etiquetas y datos, 600 para títulos.** El 300 no se usa: a 18px sobre blanco se desarma.
- **La monoespaciada no tiene excepciones.** Solo `.codigo`, que es un valor leído de un documento. El logotipo, los rótulos, las iniciales y los adornos van en Poppins: la marca se reconoce por el isotipo y el verde, no por la tipografía del nombre.
- **El 700 tampoco se usa, y 600 es el tope.** Poppins se carga en 400, 500 y 600. Cuando algo pide 700 —un `<strong>` sin clase, un `font-bold`— el navegador no tiene ese corte y lo falsea engrosando el trazo: se ve sucio al lado del 600 real. Un `<strong>` siempre lleva `className="font-medium text-tinta"`.

### Escala

La raíz está en 112,5 % (`html { font-size: 112.5% }`), así que **1rem = 18px** y toda la escala de Tailwind se corre con ella.

| Uso | Tamaño | Interlineado | Peso |
|---|---|---|---|
| Título de portada | 2.25rem (40px) | 1.1 | 600 |
| Título de página | 1.75rem (31px) | 1.15 | 600 |
| Título de sección | 1.375rem (25px) | 1.25 | 600 |
| Subtítulo | 1.125rem (20px) | 1.35 | 600 |
| Cuerpo | 1rem (18px) | 1.6 | 400 |
| Apoyo | 0.9375rem (17px) | 1.55 | 400 |
| Rótulo | 0.875rem (16px) | 1.3 | 600, Poppins, versalita, `letter-spacing: 0.09em` |

**Piso duro: `text-sm`, o sea 0.875rem = 15,75px.** Nada por debajo, en ninguna pantalla, para ningún dato. `text-xs` queda prohibido: con la raíz en 112,5 % da 13,5px.

Renglón de texto corrido: 65 caracteres, nunca más de 75. Los títulos llevan `text-wrap: balance`.

### La monoespaciada

Se usa **solo** para valores que salieron de un documento oficial y para códigos que alguien va a comparar carácter por carácter:

RENSPA · CUIT · CUVE · número de DT-e · caravanas RFID · marca registrada · kilos y cabezas que salieron de un romaneo.

Siempre con `font-variant-numeric: tabular-nums`. Un número que el usuario tipeó en el formulario **no** va en mono, aunque sea un número.

**Lo que nunca va en mono**, aunque la tentación aparezca sola: rótulos de sección, etiquetas de campo, títulos, números de paso (01, 02, 03), nombres de tipos de documento —"DT-e", "Romaneo de playa" son términos, no valores leídos—, fechas, y la palabra que etiqueta un código. En `CUVE 032636337`, "CUVE" es Poppins y el número es mono. La prueba es una sola pregunta: ¿este carácter estaba impreso en el papel que subió el productor? Si no, es Poppins.

---

## Espacio, forma y toque

- **Escala de 4px.** Los saltos que se usan: 4, 8, 12, 16, 24, 32, 48, 64. Nada intermedio.
- **Radio:** 8px en controles, 12px en tarjetas, completo en badges. Un solo radio por familia.
- **Área de toque: 44px de alto mínimo** en cualquier cosa clicable; 48px en campos de formulario. Dos objetivos táctiles nunca a menos de 8px uno del otro.
- **Foco visible siempre:** contorno de 2px en `--marca` con 2px de separación. No se saca nunca, ni "porque queda mejor".
- **Sombras:** dos, y nada más. Una baja para tarjetas apoyadas, una alta para lo único que la pantalla quiere levantar.

### No todo es una tarjeta

Borde, relleno, radio y sombra dicen "objeto aparte". Se gastan por jerarquía, no por costumbre. Tres niveles:

- **plano** — agrupa sin separar. El recurso por defecto.
- **contorno** — un objeto discreto: un proyecto, un documento.
- **elevado** — lo único que la pantalla quiere destacar.

Una sección separada por un filete superior es casi siempre mejor que una caja más.

---

## Movimiento

Poco y corto. 150ms para un cambio de color, 200ms para algo que aparece. Nada que rebote, nada que se deslice de lejos, nada que entre al hacer scroll: el contenido ya está ahí cuando la página carga. `prefers-reduced-motion` apaga todo.

---

## Escritura de la interfaz

- **En argentino, voseando.** "Publicá", "cargá", "tenés". Nunca "publique" ni "haga clic".
- **Decir la cosa, no el concepto.** "Corral sin llenar", no "capacidad ociosa". "Se acabó el capital y tuviste que vender liviano", no "restricción de liquidez".
- **Los errores dicen qué pasó y qué se conserva.** El productor está publicando un ciclo con dinero de por medio: si algo falla, lo primero es si perdió lo que cargó.
- **Nunca prometer lo que no se verificó.** La lectura automática confirma que los datos de un documento cierran entre sí. Eso no prueba que el papel sea auténtico. Son dos estados distintos y la interfaz jamás los junta en un solo tilde verde.
- **Sin emojis.** Sin signos de admiración. Sin "¡Listo!".

## Vocabulario del dominio

Se escriben así y no de otra manera: **RENSPA**, **DT-e**, **CUVE**, **caravana RFID**, **romaneo de playa**, **boleto de compra-venta**, **SENASA**, **cabezas** (no "unidades"), **kg** (no "kilogramos"), **novillito / vaquillona** (la categoría real, no "ganado").

Formatos: fecha `21/09/2026` · miles con punto `9.240 kg` · decimales con coma `58,84 %` · dinero en dólares `US$ 57.900`, abreviado a `US$ 1,2 M` solo cuando pasa el millón. La plataforma no muestra pesos: la hacienda se habla en dólares.

---

## Lo que no se hace

Prohibiciones concretas, ordenadas por frecuencia con la que aparecen solas:

- Franja de color gruesa al costado de una tarjeta para marcar severidad.
- Degradés — ninguno, y menos violeta a rosa.
- Emojis como íconos de sección.
- `text-xs`, o cualquier cosa por debajo de 0.875rem.
- Gris `#888780` como color de texto.
- Texto blanco sobre `#1D9E75` o sobre `#7F77DD`.
- Un color como única señal de un estado: siempre acompañado de texto.
- Tres tipografías. Dos: Poppins y JetBrains Mono.
- La mono en algo que no salió de un documento.
- Bloques que entran con animación al hacer scroll.
- Botones con el texto en mayúsculas.

## Antes de dar algo por terminado

1. ¿Se lee a 375px de ancho sin scroll horizontal?
2. ¿Todo texto llega a 4,5:1 de contraste? ¿Los objetos de interfaz a 3:1?
3. ¿Los dos temas, claro y oscuro, están definidos y probados?
4. ¿Se puede recorrer con teclado y el foco se ve en cada paso?
5. ¿Los datos de documentos están en mono y los tipeados no?
6. ¿Hay estado vacío, de carga y de error para cada pantalla que trae datos?
7. `impeccable detect src` pasa limpio.
