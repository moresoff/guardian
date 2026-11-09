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
8. **La portada ocupa casi 9 pantallas.** Es la cara pública y tiene que
   explicar, pero es la pantalla más larga de la app por lejos. Propuesta:
   revisarla aparte, con la restricción de vocabulario público a mano.
9. **Dos simuladores con nombres parecidos.** «Probá un ciclo» (`/simulacion`,
   público: los papeles de un ciclo de ejemplo) y «Simulador» (`/simulador`,
   con cuenta: los números). Están bien separados, pero conviene que la
   portada diga cuál es cuál.

## Cómo se midió

Con Playwright, a 390 × 844 px, en `localhost` contra Postgres. Las capturas
quedan fuera del repositorio. Para repetirlo: abrir cada pantalla con una cuenta
nueva y dividir `document.documentElement.scrollHeight` por 844.
