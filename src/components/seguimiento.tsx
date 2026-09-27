import { Aviso, Badge, Dato, Panel, Progreso, Vacio } from "@/components/ui/primitivos";
import { formatFecha, formatKg, formatNum, formatPct, formatArs } from "@/lib/format";
import { resumirSeguimiento } from "@/lib/seguimiento";
import type { Proyecto, RegistroSeguimiento } from "@/lib/types";

/**
 * Cómo viene el ciclo: las pesadas del lote, lo que gana por día y lo que se
 * gastó hasta ahora.
 *
 * Es la misma pantalla para el productor y para el colaborador, y a propósito: el
 * que puso el capital tiene que ver exactamente lo que ve el que carga el dato.
 * Lo único que cambia es que del lado del productor, arriba, hay un botón para
 * registrar una pesada nueva.
 *
 * Nada de acá reemplaza al romaneo. El seguimiento dice cómo viene el ciclo; el
 * resultado del ciclo lo sigue diciendo el papel del frigorífico.
 */
export function Seguimiento({
  proyecto,
  registros,
}: {
  proyecto: Proyecto;
  registros: RegistroSeguimiento[];
}) {
  const resumen = resumirSeguimiento(proyecto, registros);

  if (!resumen) {
    return (
      <Vacio titulo="Todavía no hay pesadas cargadas">
        El seguimiento arranca con la primera pesada del lote. Sin eso, el colaborador solo
        ve lo que se declaró al publicar.
      </Vacio>
    );
  }

  const { ultima } = resumen;
  const cerrado = proyecto.estado === "cerrado";

  return (
    <div className="space-y-6">
      <Panel className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="rotulo text-tinta-tenue">
            Última pesada · {formatFecha(ultima.fecha)}
          </p>
          <p className="text-sm text-tinta-suave">
            Día {resumen.diasEnCiclo} de {proyecto.plazoDias}
          </p>
        </div>

        <dl className="tabular mt-4 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <Dato etiqueta="Peso promedio" codigo>
            {formatNum(ultima.pesoPromedioKg)} kg
          </Dato>
          <Dato
            etiqueta="Ganancia diaria"
            codigo
            ayuda="Kilos por cabeza y por día, desde que arrancó el ciclo."
          >
            {formatKg(resumen.gananciaDiariaPromedioKg)} kg
          </Dato>
          <Dato etiqueta="Cabezas vivas">
            {formatNum(ultima.cabezas)} de {formatNum(proyecto.cabezas)}
          </Dato>
          <Dato etiqueta="Gasto acumulado">{formatArs(resumen.gastoAcumuladoArs)}</Dato>
        </dl>

        <div className="mt-5 border-t border-borde pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p className="text-sm text-tinta-suave">
              Del peso de entrada ({formatNum(proyecto.pesoEntradaKg)} kg) al objetivo (
              {formatNum(proyecto.pesoSalidaObjetivoKg)} kg)
            </p>
            <p className="tabular text-sm font-medium">{formatPct(resumen.avancePct)}</p>
          </div>
          <div className="mt-2">
            <Progreso valor={resumen.avancePct} label="Avance sobre el peso objetivo" />
          </div>
        </div>
      </Panel>

      <Panel className="p-5">
        <div className="mb-4">
          <p className="font-medium">Cómo viene engordando</p>
          <p className="mt-0.5 text-sm text-tinta-suave">
            Peso promedio del lote en cada pesada.
          </p>
        </div>
        <CurvaDePeso proyecto={proyecto} registros={registros} />
      </Panel>

      <div>
        <p className="mb-3 font-medium">Las pesadas, una por una</p>
        {/* La tabla desborda sola en el teléfono en vez de apretar las columnas:
            son cifras que se comparan entre filas y no entran de otra manera. */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <thead>
              <tr className="border-b border-borde text-left">
                <Encabezado>Fecha</Encabezado>
                <Encabezado numero>Cabezas</Encabezado>
                <Encabezado numero>Peso prom.</Encabezado>
                <Encabezado numero>Ganancia diaria</Encabezado>
                <Encabezado numero>Bajas</Encabezado>
                <Encabezado numero>Gasto</Encabezado>
                <Encabezado>Concepto</Encabezado>
              </tr>
            </thead>
            <tbody>
              {[...resumen.tramos].reverse().map(({ registro, gananciaDiariaKg }) => (
                <tr key={registro.id} className="border-b border-borde">
                  <Celda>{formatFecha(registro.fecha)}</Celda>
                  <Celda numero>{formatNum(registro.cabezas)}</Celda>
                  <Celda numero codigo>
                    {formatNum(registro.pesoPromedioKg)} kg
                  </Celda>
                  <Celda numero codigo>
                    {formatKg(gananciaDiariaKg)} kg
                  </Celda>
                  <Celda numero>
                    {registro.mortandad > 0 ? (
                      <Badge tono="alerta">{registro.mortandad}</Badge>
                    ) : (
                      <span className="text-tinta-tenue">—</span>
                    )}
                  </Celda>
                  <Celda numero>{formatArs(registro.gastoArs)}</Celda>
                  <Celda>{registro.conceptoGasto}</Celda>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Aviso titulo={cerrado ? "Esto es cómo vino, no cómo terminó" : "Esto es cómo viene, no cómo terminó"}>
        Las pesadas las carga el productor y sirven para seguir el ciclo de cerca. El
        resultado del ciclo sale del romaneo de playa del frigorífico, que es el único
        papel que mide los kilos que se vendieron.
        {resumen.mortandadTotal > 0 ? (
          <>
            {" "}
            {cerrado ? "En el ciclo hubo" : "Hasta hoy hubo"} {resumen.mortandadTotal}{" "}
            {resumen.mortandadTotal === 1 ? "baja" : "bajas"} (
            {formatPct(resumen.mortandadPct)} del lote).
          </>
        ) : null}
      </Aviso>
    </div>
  );
}

function Encabezado({
  children,
  numero = false,
}: {
  children: React.ReactNode;
  numero?: boolean;
}) {
  return (
    <th
      scope="col"
      className={`rotulo pb-2 font-medium text-tinta-tenue ${numero ? "text-right" : ""}`}
    >
      {children}
    </th>
  );
}

function Celda({
  children,
  numero = false,
  codigo = false,
}: {
  children: React.ReactNode;
  numero?: boolean;
  codigo?: boolean;
}) {
  return (
    <td
      className={`py-3 ${numero ? "text-right" : ""} ${
        codigo ? "codigo" : numero ? "tabular" : "text-tinta-suave"
      }`}
    >
      {children}
    </td>
  );
}

/**
 * La curva de engorde. Es un dibujo y no una tabla más: lo que se quiere ver de
 * un vistazo es si la pendiente se mantiene o se aplanó, y eso en una columna de
 * números no se ve.
 *
 * Los datos exactos están en la tabla de abajo, así que el gráfico puede quedar
 * fuera del árbol de accesibilidad sin que se pierda nada.
 */
function CurvaDePeso({
  proyecto,
  registros,
}: {
  proyecto: Proyecto;
  registros: RegistroSeguimiento[];
}) {
  const ancho = 640;
  const alto = 200;
  const margen = { arriba: 12, abajo: 26, izquierda: 44, derecha: 12 };

  const inicio = proyecto.publicadoAt ?? proyecto.creadoAt;
  const puntos = [
    { fecha: inicio, peso: proyecto.pesoEntradaKg },
    ...registros.map((r) => ({ fecha: r.fecha, peso: r.pesoPromedioKg })),
  ];

  const t0 = new Date(inicio).getTime();
  const t1 = new Date(puntos[puntos.length - 1].fecha).getTime();
  const rango = Math.max(1, t1 - t0);

  const pisoKg = Math.min(proyecto.pesoEntradaKg, ...puntos.map((p) => p.peso));
  const techoKg = Math.max(proyecto.pesoSalidaObjetivoKg, ...puntos.map((p) => p.peso));
  const alturaKg = Math.max(1, techoKg - pisoKg);

  const x = (fecha: string) =>
    margen.izquierda +
    ((new Date(fecha).getTime() - t0) / rango) *
      (ancho - margen.izquierda - margen.derecha);
  const y = (peso: number) =>
    margen.arriba +
    (1 - (peso - pisoKg) / alturaKg) * (alto - margen.arriba - margen.abajo);

  const linea = puntos.map((p) => `${x(p.fecha)},${y(p.peso)}`).join(" ");
  const yObjetivo = y(proyecto.pesoSalidaObjetivoKg);

  return (
    <svg
      viewBox={`0 0 ${ancho} ${alto}`}
      className="h-auto w-full text-marca-viva"
      aria-hidden
    >
      {/* La meta, punteada: la curva se lee contra ella. */}
      <line
        x1={margen.izquierda}
        x2={ancho - margen.derecha}
        y1={yObjetivo}
        y2={yObjetivo}
        stroke="var(--borde-fuerte)"
        strokeDasharray="4 4"
      />
      <text
        x={margen.izquierda - 8}
        y={yObjetivo + 4}
        textAnchor="end"
        fontSize="11"
        fill="var(--tinta-tenue)"
        className="tabular"
      >
        {proyecto.pesoSalidaObjetivoKg}
      </text>
      <text
        x={margen.izquierda - 8}
        y={y(proyecto.pesoEntradaKg) + 4}
        textAnchor="end"
        fontSize="11"
        fill="var(--tinta-tenue)"
        className="tabular"
      >
        {proyecto.pesoEntradaKg}
      </text>

      <polyline
        points={linea}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {puntos.map((p) => (
        <circle
          key={p.fecha}
          cx={x(p.fecha)}
          cy={y(p.peso)}
          r="3.5"
          fill="var(--superficie)"
          stroke="currentColor"
          strokeWidth="2"
        />
      ))}

      <text
        x={margen.izquierda}
        y={alto - 6}
        fontSize="11"
        fill="var(--tinta-tenue)"
        className="tabular"
      >
        {formatFecha(inicio)}
      </text>
      <text
        x={ancho - margen.derecha}
        y={alto - 6}
        textAnchor="end"
        fontSize="11"
        fill="var(--tinta-tenue)"
        className="tabular"
      >
        {formatFecha(puntos[puntos.length - 1].fecha)}
      </text>
    </svg>
  );
}
