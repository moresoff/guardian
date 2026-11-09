# Auditoría: qué se puede simplificar

Fecha: 2026-11-09. Se recorrieron las pantallas principales en un teléfono de
390 px de ancho, con una cuenta nueva de cada lado, y se midió cuánto hay que
desplazarse en cada una («pantallas» = alto de la página ÷ alto del teléfono).

## Lo que ya quedó hecho

| Pantalla | Antes | Después | Qué se hizo |
|---|---|---|---|
| Catálogo | 7,3 pantallas | 2,6 | Arriba solo los proyectos abiertos. Los ciclos en marcha y cerrados van plegados. El título decía «9 proyectos abiertos» y había 3. Foto más baja en el teléfono. |
| Panel del productor nuevo | 2,6 | 1,0 | Sin proyectos no se muestran cifras en cero (4 tarjetas, 3 barras de aportes y 4 contadores). Queda el aviso de identidad y el botón para publicar. |
| Panel del productor con proyectos | — | — | Se sacó el recuadro «Tus proyectos»: repetía los mismos números que las solapas de la lista. |
| Mi establecimiento | 3,3 | 2,9 | Se sacó la cabecera con cifras, que ya está en el panel. El correo largo ya no se sale de la pantalla y no queda «, Buenos Aires» cuando falta la localidad. |
| Menú en el teléfono | 3 renglones, ~150 px | 2 renglones | Logo, perfil y «Salir» en un renglón; las secciones en otro, sin cortarse. |
| Proyecto en revisión (productor) | — | — | La lista de papeles aparecía dos veces y había dos avisos falsos: «el proyecto está publicado» y «los archivos no se guardan». Ahora hay un cuadro «Qué falta para publicarlo» con tres renglones (papeles, identidad, contrato) y un botón en cada uno. |
| Participar (colaborador) | Un cuadro flotante con una casilla «Leí y acepto» | Una pantalla en 4 pasos | Cuánto, quién administra (el fiduciario), el contrato y la firma. En el primer paso se ve la ganancia estimada. |
| Alta | Identidad aparte, con un aviso | Último paso del alta | Se puede dejar para después, pero sin identidad no se firma ningún contrato. |
| Portada (teléfono) | 8,9 pantallas | 5,9 | «Qué hacemos» y «Cómo corre un ciclo» con el ícono o el número al costado y no arriba; los tres ciclos con la foto chica al lado del texto; los proyectos en una fila que se desliza; menos aire entre franjas. Se sacó el aviso final, que repetía el del pie y decía que todavía no se podía participar, cosa que ya no es cierta. En computadora no cambió (4,5). |
| Quiénes somos (teléfono) | 5,1 | 4,3 | Portada interna más baja, la foto del medio de 440 a 220 px, menos aire entre secciones. |
| Cómo participar (teléfono) | 5,2 | 4,5 | Lo mismo, y las preguntas frecuentes más juntas. La respuesta «¿Qué puedo hacer en esta demostración?» decía que no se cargaban documentos ni se formalizaban participaciones: ahora sí se puede, de forma simulada. |
| Barra de la portada | «Cambiar perfil» abría un menú con dos opciones | Botón «Simulador» | En el teléfono va en el mismo renglón que el logo y el menú, en vez de ocupar uno entero. |
| «Probá un ciclo» | Página aparte con papeles de ejemplo | Se sacó | Quien tenga el enlace viejo cae en el simulador. El simulador está abierto sin cuenta. |

| Páginas abiertas y app | Dos sitios: `GuardianWebsite` + `website.css` (1.700 líneas, colores a mano) y la app con Tailwind | Un solo marco | La misma barra, el mismo pie y los mismos tokens en todas las pantallas. Se borraron `website.css`, `GuardianWebsite` y el `Logo` viejo. |
| Portada | 5,9 pantallas (teléfono) | 4,4 | Se sacaron «Qué hacemos» y «Antes de participar», que repetían «Cómo participar». Desde «Cómo corre un ciclo» hay un enlace a esa página. Computadora: 4,5 → 3,4. |
| Quiénes somos | 4,3 | 2,7 | «Quién es Guardian» y «Nuestro propósito» quedaron en una sola sección. |
| Cómo participar | 4,5 | 3,3 | Los pasos son los de la app: cuenta, identidad, proyecto, contrato, seguimiento. Recibe «Antes de participar». Las preguntas frecuentes se abren de a una. |
| Avisos de prototipo en lo público | 4 | 2 | Quedan el de la foto de arriba y el del pie, que ahora es el mismo en toda la app. |

## Lo que propongo simplificar (no está hecho)

Ordenado por cuánto le ahorra al ganadero.

1. **Unificar los números del ciclo.** La app usa dos juegos de cifras:
   `src/lib/ciclos.ts` (feedlot de 131 días, 6,59 % anual para el productor,
   reparto 67,99/32,01) y el simulador, que sigue el Excel (feedlot de 90
   días, 7,87 %, reparto 68,22/31,78). En la ficha de un proyecto feedlot dice
   «131 días» y en el simulador «90 días». Propuesta: que `ciclos.ts` tome los
   valores de `simulador.ts`. Hay que decidir cuál es el dato bueno.
2. **Una sola manera de cargar un proyecto.** Un proyecto nuevo se carga con el
   asistente de 4 pasos y un borrador se completa con la «ficha técnica», que
   es otra pantalla con otros controles. Propuesta: que el borrador se abra en
   el mismo asistente.
3. **Un solo aviso de prototipo.** Hay seis carteles «Prototipo» repartidos en
   configuración, garantías, repositorio, datos del colaborador y el cuadro de
   enviado. El pie de página ya dice que es un prototipo. Propuesta: sacar los
   carteles y dejar el pie, más una línea donde algo no se guarda.
4. **«Mi establecimiento» en un solo bloque.** Son cuatro bloques: tus datos,
   el campo, identidad verificable y avisos. Los interruptores de «Avisos» no
   guardan nada. Propuesta: juntar «Identidad verificable» con «El campo» y
   sacar «Avisos» hasta que haya correos de verdad.
5. **Las condiciones del proyecto y el contrato dicen lo mismo.** La ficha del
   colaborador tiene un panel «Condiciones del proyecto» y el contrato de
   adhesión repite lo mismo con otras palabras. Propuesta: que la ficha muestre
   las cláusulas del contrato (`src/lib/contrato.ts`), así se lee una sola
   versión.
6. **El recorrido guiado aparece encima de todo.** Al entrar por primera vez a
   cada sección se abre un cuadro que tapa la pantalla, también arriba de la
   validación de identidad y del asistente. Propuesta: ofrecerlo con un botón
   «¿Te mostramos cómo funciona?» en vez de abrirlo solo.
7. **Datos del colaborador (2,8 pantallas).** Repite nombre, CUIL e identidad,
   que ya están en la validación de identidad. Propuesta: una sola pantalla
   «Mis datos» con la identidad y el CBU.
8. **Rutas viejas que solo redirigen.** `/como-invertir`, `/investor`,
    `/fiduciary`, `/comparison` y ahora `/simulacion`. Propuesta: borrarlas
    cuando no queden enlaces viejos dando vueltas.

## Cómo se midió

Con Playwright, a 390 × 844 px, en `localhost` contra Postgres. Las capturas
quedan fuera del repositorio. Para repetirlo: abrir cada pantalla con una cuenta
nueva y dividir `document.documentElement.scrollHeight` por 844.
