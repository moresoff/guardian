import Link from "next/link";
import { colaboradoresDeSesion } from "@/lib/cuentas";
import type { Cartera } from "@/lib/data";
import { AvisoIdentidad } from "@/components/aviso-identidad";
import { Pestanas } from "@/components/pestanas";
import { DatosColaborador } from "./datos";
import { EstadoProyectoBadge } from "@/components/estados";
import {
  Badge,
  BotonLink,
  Dato,
  Panel,
  Progreso,
  Seccion,
  Vacio,
} from "@/components/ui/primitivos";
import {
  getAportesDeProyecto,
  getCarteraDeColaborador,
  getSeguimientoDeProyecto,
} from "@/lib/data";
import { getPagoCompra, pesoEsperado, type PagoCompra } from "@/lib/ciclo";
import type { Proyecto, RegistroSeguimiento } from "@/lib/types";
import {
  formatFecha,
  formatNum,
  formatPct,
  formatArs,
  modalidadLabel,
} from "@/lib/format";
import { calcularFondeo, retornoDelProyecto } from "@/lib/proyecto";
import type { Aporte, EstadoAporte } from "@/lib/types";

export const metadata = { title: "Mi cartera — Guardian" };

const haceDias = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

const ESTADO_APORTE: Record<
  EstadoAporte,
  { label: string; tono: "ok" | "alerta" | "neutro" }
> = {
  pendiente_acreditacion: {
    label: "Pendiente de acreditación",
    tono: "alerta",
  },
  acreditado_parcial: { label: "Acreditado en parte", tono: "alerta" },
  acreditado: { label: "Acreditado", tono: "ok" },
  devuelto: { label: "Devuelto", tono: "neutro" },
};

/**
 * La cuenta del colaborador.
 *
 * Lo que se ve acá son operaciones del fideicomiso, no un saldo: no hay dinero
 * disponible para mover ni botón para retirar. Por eso los montos van separados
 * —lo puesto en ciclos abiertos, lo cobrado y lo que falta cobrar— en vez de
 * sumados en un número grande que parecería una billetera. Arriba, además, lo
 * único que le pide algo al colaborador: una transferencia pendiente.
 */
export default async function CarteraPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activa = tab === "datos" ? "datos" : "aportes";
  // Lo propio y los aportes de ejemplo de la demo, sumados.
  const carteras = await Promise.all(
    (await colaboradoresDeSesion()).map(getCarteraDeColaborador),
  );
  const cartera = carteras.slice(1).reduce<Cartera>((a, c) => ({
    posiciones: [...a.posiciones, ...c.posiciones],
    liquidaciones: [...a.liquidaciones, ...c.liquidaciones],
    comprometidoArs: a.comprometidoArs + c.comprometidoArs,
    acreditadoArs: a.acreditadoArs + c.acreditadoArs,
    pendienteDeAcreditarArs: a.pendienteDeAcreditarArs + c.pendienteDeAcreditarArs,
    liquidadoPagadoArs: a.liquidadoPagadoArs + c.liquidadoPagadoArs,
    liquidadoPendienteArs: a.liquidadoPendienteArs + c.liquidadoPendienteArs,
  }), carteras[0]);

  const posiciones = await Promise.all(
    cartera.posiciones.map(async (p) => {
      const aportes = await getAportesDeProyecto(p.proyecto.id);
      return {
        ...p,
        fondeo: calcularFondeo(p.proyecto, aportes),
        totalAcreditado: aportes.reduce((a, x) => a + x.montoAcreditadoArs, 0),
        pago: await getPagoCompra(p.proyecto.id),
        registros: await getSeguimientoDeProyecto(p.proyecto.id),
      };
    }),
  );

  const devueltos = posiciones.filter((p) => p.aporte.estado === "devuelto");
  const vivas = posiciones.filter((p) => p.aporte.estado !== "devuelto");
  const enCurso = vivas.filter((p) => p.proyecto.estado !== "cerrado");
  const cerradas = vivas.filter((p) => p.proyecto.estado === "cerrado");
  const faltaTransferir = vivas.reduce(
    (a, p) => a + Math.max(0, p.aporte.montoComprometidoArs - p.aporte.montoAcreditadoArs),
    0,
  );

  // Los tres avisos fijos del trabajo: constancia de compra, informe mensual y
  // liquidación. Se muestran cuando ocurre cada cosa, del último mes.
  const haceUnMes = haceDias(31);
  const avisos: { clave: string; texto: string; href: string }[] = [];
  for (const p of vivas) {
    if (p.pago?.pagadoAt && p.pago.pagadoAt >= haceUnMes)
      avisos.push({
        clave: `c-${p.aporte.id}`,
        texto: `Constancia de compra de «${p.proyecto.titulo}»: se pagó la hacienda al vendedor.`,
        href: `#aporte-${p.aporte.id}`,
      });
    const ultima = p.registros[p.registros.length - 1];
    if (p.proyecto.estado === "en_curso" && ultima && ultima.fecha >= haceUnMes)
      avisos.push({
        clave: `i-${p.aporte.id}`,
        texto: `Informe del ciclo de «${p.proyecto.titulo}»: pesada del ${formatFecha(ultima.fecha)}.`,
        href: `#aporte-${p.aporte.id}`,
      });
  }
  for (const l of cartera.liquidaciones.filter((l) => l.fecha >= haceUnMes))
    avisos.push({
      clave: `l-${l.id}`,
      texto: `${l.concepto}: ${
        l.estado === "pagada" ? "ya se pagó" : l.estado === "aprobada" ? "aprobada, por pagar" : "calculada"
      }.`,
      href: "#terminados",
    });

  // Lo que está puesto en ciclos que todavía no cerraron. No es un saldo: vuelve
  // cuando cada uno se liquide, y por el monto que dé la liquidación.
  const enCiclosAbiertos = enCurso.reduce(
    (a, p) => a + p.aporte.montoAcreditadoArs,
    0,
  );

  return (
    <div className="space-y-10">
      <AvisoIdentidad />
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Mi cartera</h1>
        <p className="mt-1.5 text-sm text-tinta-suave">
          Tu participación en cada proyecto, no un saldo: no hay dinero para
          retirar ni para pasar de un proyecto a otro.
        </p>
        <div className="mt-4">
          <Pestanas
            pestanas={[
              { clave: "aportes", titulo: "Mis aportes" },
              { clave: "datos", titulo: "Mis datos" },
            ]}
            activa={activa}
            base="/colaborador/cartera"
          />
        </div>
      </div>

      {activa === "datos" ? (
        <DatosColaborador />
      ) : (
        <>
          <Panel className="p-5">
            <dl className="tabular grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Dato
                etiqueta="Puesto en ciclos abiertos"
                ayuda="Vuelve cuando cada ciclo se liquide, por lo que dé la venta."
              >
                {formatArs(enCiclosAbiertos)}
              </Dato>
              <Dato etiqueta="Ya cobrado" ayuda="Aporte más resultado, ya pagado.">
                {formatArs(cartera.liquidadoPagadoArs)}
              </Dato>
              {cartera.liquidadoPendienteArs > 0 ? (
                <Dato etiqueta="Por cobrar" ayuda="Liquidado y todavía sin pagar.">
                  {formatArs(cartera.liquidadoPendienteArs)}
                </Dato>
              ) : null}
            </dl>
            {faltaTransferir > 0 ? (
              <p className="tabular mt-4 border-t border-borde pt-4 text-alerta">
                Te falta transferir {formatArs(faltaTransferir)}. Abajo, en
                cada proyecto, está la referencia para hacerlo.
              </p>
            ) : null}
          </Panel>

          {avisos.length > 0 ? (
            <section aria-labelledby="titulo-avisos">
              <h2 id="titulo-avisos" className="text-lg font-semibold tracking-tight">
                Avisos
              </h2>
              <ul className="mt-3 space-y-2">
                {avisos.map((a) => (
                  <li key={a.clave}>
                    <a
                      href={a.href}
                      className="flex min-h-11 items-center rounded-xl border border-borde bg-superficie px-4 py-2 text-sm hover:border-marca"
                    >
                      {a.texto}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <Seccion
            titulo="En marcha"
            descripcion="Los proyectos en los que participás."
          >
            {enCurso.length === 0 ? (
              <Vacio titulo="Todavía no participás en ningún proyecto">
                En el catálogo están los proyectos con adhesión habilitada.
              </Vacio>
            ) : (
              <ul className="space-y-4">
                {enCurso.map(({ proyecto, aporte, fondeo, pago, registros, totalAcreditado }) => (
                  <li key={aporte.id} id={`aporte-${aporte.id}`} className="scroll-mt-20">
                    <Panel className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm text-tinta-tenue">
                            {modalidadLabel(proyecto.modalidad)} ·{" "}
                            {proyecto.provincia}
                          </p>
                          <h3 className="mt-1 font-semibold">
                            <Link
                              href={`/proyectos/${proyecto.id}`}
                              className="hover:text-marca"
                            >
                              {proyecto.titulo}
                            </Link>
                          </h3>
                        </div>
                        <EstadoProyectoBadge estado={proyecto.estado} />
                      </div>

                      <dl className="tabular mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-borde pt-4">
                        <Dato etiqueta="Tu aporte">
                          {formatArs(aporte.montoComprometidoArs)}
                        </Dato>
                        <Dato etiqueta={retornoDelProyecto(proyecto).etiqueta}>
                          {retornoDelProyecto(proyecto).valor}
                        </Dato>
                      </dl>

                      <div className="mt-4">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <p className="text-sm text-tinta-suave">
                            Cuánto juntó el proyecto
                          </p>
                          <p className="tabular text-sm">
                            {formatPct(fondeo.porcentaje)}
                          </p>
                        </div>
                        <div className="mt-2">
                          <Progreso
                            valor={fondeo.porcentaje}
                            label={`Fondeo de ${proyecto.titulo}`}
                          />
                        </div>
                      </div>

                      <EstadoDelAporte aporte={aporte} />
                      {pago?.pagadoAt ? (
                        <Constancia
                          pago={pago}
                          parte={totalAcreditado > 0 ? aporte.montoAcreditadoArs / totalAcreditado : 0}
                        />
                      ) : null}
                      {proyecto.estado === "en_curso" ? (
                        <Informe proyecto={proyecto} registros={registros} inicio={pago?.pagadoAt} />
                      ) : null}
                    </Panel>
                  </li>
                ))}
              </ul>
            )}
          </Seccion>

          {cerradas.length > 0 ? (
            <Seccion titulo="Terminados" descripcion="Ciclos cerrados y lo que te tocó, también cuando el resultado fue malo.">
              <span id="terminados" className="block scroll-mt-20" aria-hidden />
              <ul className="space-y-3">
                {cerradas.map(({ proyecto, aporte }) => (
                  <li key={aporte.id}>
                    <Panel className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <h3 className="font-semibold">
                          <Link
                            href={`/proyectos/${proyecto.id}`}
                            className="hover:text-marca"
                          >
                            {proyecto.titulo}
                          </Link>
                        </h3>
                        <Badge tono="ok">Cerrado</Badge>
                      </div>
                      <dl className="tabular mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                        <Dato etiqueta="Aportado">
                          {formatArs(aporte.montoAcreditadoArs)}
                        </Dato>
                        {cartera.liquidaciones
                          .filter((l) => l.proyectoId === proyecto.id)
                          .map((l) => (
                            <Dato
                              key={l.id}
                              etiqueta="Resultado liquidado"
                              ayuda={
                                l.estado === "pagada"
                                  ? `Cobrado el ${formatFecha(l.pagadaAt ?? l.fecha)}`
                                  : l.estado === "aprobada"
                                    ? "Aprobado, todavía sin pagar"
                                    : "Calculado, todavía sin aprobar"
                              }
                            >
                              {formatArs(l.resultadoArs)}
                            </Dato>
                          ))}
                        {cartera.liquidaciones
                          .filter((l) => l.proyectoId === proyecto.id)
                          .map((l) => (
                            <Dato
                              key={`v-${l.id}`}
                              etiqueta="Te vuelve"
                              ayuda={l.resultadoArs < 0 ? "Menos de lo que pusiste: el ciclo dio pérdida." : "Tu aporte más el resultado."}
                            >
                              {formatArs(l.capitalArs + l.resultadoArs)}
                            </Dato>
                          ))}
                      </dl>
                    </Panel>
                  </li>
                ))}
              </ul>
            </Seccion>
          ) : null}

          {devueltos.length > 0 ? (
            <Seccion titulo="Devueltos" descripcion="Proyectos que no llegaron al mínimo: tu aporte vuelve a tu cuenta.">
              <ul className="space-y-3">
                {devueltos.map(({ proyecto, aporte }) => (
                  <li key={aporte.id}>
                    <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
                      <div>
                        <h3 className="font-semibold">{proyecto.titulo}</h3>
                        <p className="tabular text-sm text-tinta-suave">
                          {aporte.montoAcreditadoArs > 0
                            ? `Se te devuelven ${formatArs(aporte.montoAcreditadoArs)}.`
                            : "No llegaste a transferir: la adhesión quedó anulada."}
                        </p>
                      </div>
                      <Badge>Devuelto</Badge>
                    </Panel>
                  </li>
                ))}
              </ul>
            </Seccion>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <BotonLink href="/proyectos">Ver el catálogo</BotonLink>
          </div>
        </>
      )}
    </div>
  );
}

/**
 * El estado de un aporte, con la conciliación a la vista. Una diferencia de
 * importe no se corrige sola ni se esconde: queda escrita con su motivo.
 */
function EstadoDelAporte({ aporte }: { aporte: Aporte }) {
  const estado = ESTADO_APORTE[aporte.estado];
  const falta = aporte.montoComprometidoArs - aporte.montoAcreditadoArs;

  return (
    <div className="mt-4 border-t border-borde pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Badge tono={estado.tono}>{estado.label}</Badge>
        <p className="text-sm text-tinta-tenue">
          Desde el {formatFecha(aporte.adhesionAt)}
        </p>
      </div>

      {aporte.estado === "pendiente_acreditacion" ? (
        <p className="mt-3 text-sm text-tinta-suave">
          Transferí {formatArs(falta)} con la referencia{" "}
          <span className="codigo">{aporte.ordenSuscripcion}</span>. Hasta que
          el banco lo acredite, no cuenta para el fondeo.
        </p>
      ) : null}

      {aporte.estado === "acreditado_parcial" && aporte.movimientos.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {aporte.movimientos.map((m) => (
            <li key={m.id} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="text-tinta-suave">
                  {formatFecha(m.fecha)} · referencia{" "}
                  <span className="codigo">{m.referenciaExterna}</span>
                </span>
                <span className="tabular font-medium">
                  {formatArs(m.importeArs)}
                </span>
              </div>
              {m.observacion ? (
                <p className="mt-1 text-tinta-tenue">{m.observacion}</p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** La constancia de la compra: qué se compró, a quién, y cuánto es tuyo. */
function Constancia({ pago, parte }: { pago: PagoCompra; parte: number }) {
  return (
    <div className="mt-4 rounded-xl bg-marca-suave p-4">
      <p className="rotulo text-marca">Constancia de compra</p>
      <p className="tabular mt-1.5 text-sm">
        El {formatFecha(pago.pagadoAt!)} el fideicomiso le pagó {formatArs(pago.montoArs)} a{" "}
        {pago.vendedor} (CUIT <span className="codigo">{pago.vendedorCuit}</span>) por{" "}
        {formatNum(pago.cabezas)} cabezas y {formatNum(pago.kilos)} kg, a{" "}
        {formatArs(pago.precioKgArs)} el kilo. La hacienda entró al campo con RENSPA{" "}
        <span className="codigo">{pago.renspaReceptor}</span>.
      </p>
      <p className="tabular mt-1.5 text-sm font-medium">
        Tu parte: {formatPct(parte * 100)} del lote, unas {formatNum(Math.round(pago.cabezas * parte))} cabezas.
      </p>
    </div>
  );
}

/** El informe del ciclo: la última pesada contra lo que se esperaba a esa altura. */
function Informe({
  proyecto,
  registros,
  inicio,
}: {
  proyecto: Proyecto;
  registros: RegistroSeguimiento[];
  inicio?: string | null;
}) {
  const ultima = registros[registros.length - 1];
  if (!ultima)
    return (
      <p className="mt-4 border-t border-borde pt-4 text-sm text-tinta-suave">
        Todavía no hay pesadas. El informe aparece con la primera.
      </p>
    );
  const esperado = pesoEsperado(proyecto, inicio ?? proyecto.publicadoAt ?? proyecto.creadoAt, ultima.fecha);
  const desvio = ultima.pesoPromedioKg - esperado;
  return (
    <div className="mt-4 border-t border-borde pt-4">
      <p className="rotulo text-tinta-tenue">Informe del ciclo · {formatFecha(ultima.fecha)}</p>
      <dl className="tabular mt-3 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Dato etiqueta="Peso promedio">{formatNum(ultima.pesoPromedioKg)} kg</Dato>
        <Dato etiqueta="Se esperaba">{formatNum(esperado)} kg</Dato>
        <Dato etiqueta="Desvío">
          <span className={desvio < 0 ? "text-alerta" : ""}>
            {desvio >= 0 ? "+" : ""}
            {formatNum(desvio)} kg
          </span>
        </Dato>
        <Dato etiqueta="Cabezas">
          {formatNum(ultima.cabezas)}
        </Dato>
      </dl>
      {ultima.nota ? <p className="mt-3 text-sm text-tinta-suave">«{ultima.nota}»</p> : null}
    </div>
  );
}
