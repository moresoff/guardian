import Link from "next/link";
import { notFound } from "next/navigation";
import { EstadoProyectoBadge } from "@/components/estados";
import { Aviso, Dato, Panel } from "@/components/ui/primitivos";
import {
  accionAprobarPago,
  accionAvanzarLiquidaciones,
  accionCerrarParticipacion,
  accionLiquidar,
  accionPagarCompra,
  accionRequisitosCompra,
} from "../../acciones";
import { BotonAccion, FormularioAccion } from "../../controles";
import {
  TOPE_COLABORADORES,
  colaboradoresDe,
  getLiquidacionesDeProyecto,
  getPagoCompra,
} from "@/lib/ciclo";
import { getAportesDeProyecto, getColaborador, getProyecto, getSeguimientoDeProyecto } from "@/lib/data";
import { formatArs, formatFecha, formatNum } from "@/lib/format";
import { PRECIOS_DEL_ANALISIS } from "@/lib/simulador";

export const metadata = { title: "Ciclo del proyecto — Guardian" };

const ETAPAS = ["Participación", "Compra", "Seguimiento", "Liquidación"] as const;

/**
 * Lo que hace Guardian con un proyecto publicado, etapa por etapa: cerrar la
 * participación, pagar la compra, mirar el seguimiento y liquidar.
 */
export default async function CicloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await getProyecto(id);
  if (!p) notFound();

  const aportes = await getAportesDeProyecto(id);
  const pago = await getPagoCompra(id);
  const registros = await getSeguimientoDeProyecto(id);
  const liquidaciones = await getLiquidacionesDeProyecto(id);
  const acreditado = aportes.reduce((a, x) => a + x.montoAcreditadoArs, 0);
  const sinTransferir = aportes.filter((a) => a.estado === "pendiente_acreditacion").length;
  const personas = colaboradoresDe(aportes).size;
  const minimo = p.montoMinimoInicioArs ?? p.montoObjetivoArs;
  const ultima = registros[registros.length - 1];

  // Precios de partida para los formularios: los del análisis, salvo que la
  // cuenta no alcance; ahí, lo que alcanza. La venta guarda la relación
  // compra/venta del análisis.
  const kilosCompra = p.cabezas * p.pesoEntradaKg;
  const precioCompra = Math.min(
    PRECIOS_DEL_ANALISIS.compraKg,
    Math.floor(p.montoRecaudadoArs / kilosCompra),
  );
  const precioVenta = Math.round(
    (pago?.precioKgArs ?? precioCompra) * (PRECIOS_DEL_ANALISIS.ventaKg / PRECIOS_DEL_ANALISIS.compraKg),
  );
  const cabezasVenta = ultima?.cabezas ?? p.cabezas;

  const etapa =
    p.estado === "abierto" ? 0 : p.estado === "fondeado" ? 1 : p.estado === "en_curso" ? 2 : 3;

  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="text-sm text-tinta-suave hover:text-marca">
        ← Volver a la cola
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{p.titulo}</h1>
        <EstadoProyectoBadge estado={p.estado} />
      </div>

      <ol className="mt-5 grid grid-cols-2 gap-x-3 gap-y-3 sm:grid-cols-4" aria-label="Etapas del ciclo">
        {ETAPAS.map((e, i) => (
          <li key={e} aria-current={i === etapa ? "step" : undefined}>
            <span
              className={`block h-1.5 rounded-full ${i <= etapa ? "bg-marca" : "bg-borde"}`}
              aria-hidden
            />
            <span className={`mt-1.5 block text-sm ${i === etapa ? "font-semibold" : "text-tinta-suave"}`}>
              {e}
            </span>
          </li>
        ))}
      </ol>

      {/* 1. Participación */}
      <Panel className="mt-6 p-5">
        <h2 className="text-lg font-semibold tracking-tight">1. Participación</h2>
        <dl className="tabular mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
          <Dato etiqueta="Acreditado">{formatArs(acreditado)}</Dato>
          <Dato etiqueta="Mínimo para arrancar">{formatArs(minimo)}</Dato>
          <Dato etiqueta="Colaboradores">
            {personas} de {TOPE_COLABORADORES}
          </Dato>
          <Dato etiqueta="Sin transferir">{sinTransferir}</Dato>
        </dl>
        {p.estado === "abierto" ? (
          <div className="mt-5">
            <p className="mb-3 text-sm text-tinta-suave">
              {acreditado >= minimo
                ? "Llegó al mínimo: al cerrar, el ciclo arranca. Las adhesiones que nunca se transfirieron se anulan."
                : "No llegó al mínimo: al cerrar, el proyecto queda desierto y se devuelve cada aporte a la cuenta que cargó el colaborador."}
            </p>
            <BotonAccion
              accion={accionCerrarParticipacion}
              datos={{ proyectoId: id }}
              variante={acreditado >= minimo ? "primario" : "peligro"}
            >
              Cerrar la participación
            </BotonAccion>
          </div>
        ) : p.estado === "desierto" ? (
          <p className="mt-4 text-sm text-tinta-suave">
            Cerró sin llegar al mínimo. Los aportes quedaron devueltos.
          </p>
        ) : (
          <p className="mt-4 text-sm text-tinta-suave">Cerrada.</p>
        )}
      </Panel>

      {/* 2. Compra */}
      {etapa >= 1 && p.estado !== "desierto" ? (
        <Panel className="mt-4 p-5">
          <h2 className="text-lg font-semibold tracking-tight">2. Pago de la compra</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            Un único pago del fideicomiso al vendedor. No hay desembolsos al productor.
          </p>
          {!pago ? (
            <div className="mt-4">
              <p className="mb-3 text-sm font-medium">
                Primera instancia: el vendedor, el precio y el campo que recibe.
              </p>
              <FormularioAccion
                accion={accionRequisitosCompra}
                datos={{ proyectoId: id }}
                boton="Requisitos verificados"
                campos={[
                  { nombre: "vendedor", etiqueta: "Vendedor", ayuda: "Razón social de quien vende la hacienda." },
                  { nombre: "vendedorCuit", etiqueta: "CUIT del vendedor", numerico: true },
                  { nombre: "renspaReceptor", etiqueta: "RENSPA del campo que recibe" },
                  { nombre: "cabezas", etiqueta: "Cabezas", numerico: true, defecto: String(p.cabezas) },
                  {
                    nombre: "kilos",
                    etiqueta: "Kilos vivos comprados",
                    numerico: true,
                    defecto: String(kilosCompra),
                  },
                  {
                    nombre: "precioKgArs",
                    etiqueta: "Precio por kilo, en pesos",
                    ayuda: `En la cuenta hay ${formatArs(p.montoRecaudadoArs)}.`,
                    numerico: true,
                    defecto: String(precioCompra),
                  },
                ]}
              />
            </div>
          ) : (
            <>
              <dl className="tabular mt-4 grid grid-cols-2 gap-x-6 gap-y-4">
                <Dato etiqueta="Vendedor">{pago.vendedor}</Dato>
                <Dato etiqueta="CUIT" codigo>{pago.vendedorCuit}</Dato>
                <Dato etiqueta="Campo que recibe" codigo>{pago.renspaReceptor}</Dato>
                <Dato etiqueta="Hacienda">
                  {formatNum(pago.cabezas)} cab. · {formatNum(pago.kilos)} kg
                </Dato>
                <Dato etiqueta="Precio por kilo">{formatArs(pago.precioKgArs)}</Dato>
                <Dato etiqueta="Monto del pago">{formatArs(pago.montoArs)}</Dato>
              </dl>
              <ol className="mt-5 space-y-2 text-sm">
                <Instancia hecha fecha={pago.requisitosAt}>Requisitos verificados</Instancia>
                <Instancia hecha={!!pago.aprobadoAt} fecha={pago.aprobadoAt}>Pago aprobado</Instancia>
                <Instancia hecha={!!pago.pagadoAt} fecha={pago.pagadoAt}>Pagado al vendedor</Instancia>
              </ol>
              {!pago.aprobadoAt ? (
                <BotonAccion accion={accionAprobarPago} datos={{ proyectoId: id }} className="mt-5">
                  Aprobar el pago
                </BotonAccion>
              ) : !pago.pagadoAt ? (
                <BotonAccion accion={accionPagarCompra} datos={{ proyectoId: id }} className="mt-5">
                  Pagar {formatArs(pago.montoArs)} al vendedor
                </BotonAccion>
              ) : (
                <p className="mt-4 text-sm text-tinta-suave">
                  Cada colaborador ya tiene su constancia de compra en la cartera.
                </p>
              )}
            </>
          )}
        </Panel>
      ) : null}

      {/* 3. Seguimiento */}
      {etapa >= 2 ? (
        <Panel className="mt-4 p-5">
          <h2 className="text-lg font-semibold tracking-tight">3. Seguimiento</h2>
          <p className="mt-1 text-sm text-tinta-suave">
            {registros.length === 0
              ? "El productor todavía no cargó pesadas."
              : `${registros.length} ${registros.length === 1 ? "pesada" : "pesadas"}. La última, el ${formatFecha(
                  ultima!.fecha,
                )}: ${formatNum(ultima!.cabezas)} cabezas de ${formatNum(ultima!.pesoPromedioKg)} kg promedio.`}
          </p>
        </Panel>
      ) : null}

      {/* 4. Liquidación */}
      {p.estado === "en_curso" ? (
        <Panel className="mt-4 p-5">
          <h2 className="text-lg font-semibold tracking-tight">4. Venta y liquidación</h2>
          <p className="mb-4 mt-1 text-sm text-tinta-suave">
            Con el romaneo de la venta. Se reparte lo pactado, se descuenta el fiduciario y el
            impuesto, y vuelve también lo que no se usó en la compra. Si el resultado es malo,
            la liquidación lo dice igual.
          </p>
          <FormularioAccion
            accion={accionLiquidar}
            datos={{ proyectoId: id }}
            boton="Cerrar el ciclo y liquidar"
            campos={[
              { nombre: "dteSalida", etiqueta: "DT-e de salida" },
              {
                nombre: "cabezas",
                etiqueta: "Cabezas vendidas",
                numerico: true,
                defecto: String(cabezasVenta),
              },
              {
                nombre: "kilosVivos",
                etiqueta: "Kilos vivos vendidos",
                numerico: true,
                defecto: String(cabezasVenta * p.pesoSalidaObjetivoKg),
              },
              {
                nombre: "kgCarne",
                etiqueta: "Kilos de carne (romaneo)",
                numerico: true,
                defecto: String(Math.round(cabezasVenta * p.pesoSalidaObjetivoKg * 0.58)),
              },
              {
                nombre: "precioKgArs",
                etiqueta: "Precio por kilo vivo, en pesos",
                numerico: true,
                defecto: String(precioVenta),
              },
            ]}
          />
        </Panel>
      ) : null}

      {p.estado === "cerrado" ? (
        <Panel className="mt-4 p-5">
          <h2 className="text-lg font-semibold tracking-tight">4. Liquidación</h2>
          {liquidaciones.length === 0 ? (
            <p className="mt-2 text-sm text-tinta-suave">Este ciclo no tiene liquidaciones cargadas.</p>
          ) : (
            <>
              <ul className="mt-4 divide-y divide-borde">
                {await Promise.all(
                  liquidaciones.map(async (l) => (
                    <li key={l.id} className="tabular flex flex-wrap justify-between gap-2 py-2.5 text-sm">
                      <span>{(await getColaborador(l.colaboradorId))?.nombre ?? l.colaboradorId}</span>
                      <span>
                        {formatArs(l.capitalArs)} →{" "}
                        <span className="font-semibold">{formatArs(l.capitalArs + l.resultadoArs)}</span>{" "}
                        <span className={l.resultadoArs < 0 ? "text-error" : "text-tinta-suave"}>
                          ({l.resultadoArs >= 0 ? "+" : ""}
                          {formatArs(l.resultadoArs)}) · {l.estado}
                        </span>
                      </span>
                    </li>
                  )),
                )}
              </ul>
              {liquidaciones.some((l) => l.estado === "calculada") ? (
                <BotonAccion
                  accion={accionAvanzarLiquidaciones}
                  datos={{ proyectoId: id, a: "aprobada" }}
                  className="mt-4"
                >
                  Aprobar la liquidación
                </BotonAccion>
              ) : liquidaciones.some((l) => l.estado === "aprobada") ? (
                <BotonAccion
                  accion={accionAvanzarLiquidaciones}
                  datos={{ proyectoId: id, a: "pagada" }}
                  className="mt-4"
                >
                  Pagar a los colaboradores
                </BotonAccion>
              ) : (
                <p className="mt-4 text-sm text-tinta-suave">Liquidación pagada.</p>
              )}
            </>
          )}
        </Panel>
      ) : null}

      {p.estado === "desierto" ? (
        <div className="mt-4">
          <Aviso titulo="El ciclo no arrancó">
            Sin el mínimo no hay compra ni liquidación. Cada colaborador ve su aporte como
            devuelto.
          </Aviso>
        </div>
      ) : null}
    </div>
  );
}

function Instancia({
  hecha,
  fecha,
  children,
}: {
  hecha: boolean;
  fecha: string | null;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        className={`grid size-6 place-items-center rounded-full text-sm ${
          hecha ? "bg-marca text-marca-contraste" : "border border-borde-fuerte text-tinta-tenue"
        }`}
        aria-hidden
      >
        {hecha ? "✓" : ""}
      </span>
      <span className={hecha ? "" : "text-tinta-suave"}>
        {children}
        {hecha && fecha ? ` · ${formatFecha(fecha)}` : hecha ? "" : " · pendiente"}
      </span>
    </li>
  );
}
