import Link from "next/link";
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
import { COLABORADOR_DEMO, getAportesDeProyecto, getCarteraDeColaborador } from "@/lib/data";
import { formatFecha, formatPct, formatArs, modalidadLabel } from "@/lib/format";
import { calcularFondeo, retornoDelProyecto } from "@/lib/proyecto";
import type { Aporte, EstadoAporte } from "@/lib/types";

export const metadata = { title: "Mi cartera — Guardian" };

const ESTADO_APORTE: Record<EstadoAporte, { label: string; tono: "ok" | "alerta" | "neutro" }> =
  {
    pendiente_acreditacion: { label: "Pendiente de acreditación", tono: "alerta" },
    acreditado_parcial: { label: "Acreditado en parte", tono: "alerta" },
    acreditado: { label: "Acreditado", tono: "ok" },
    devuelto: { label: "Devuelto", tono: "neutro" },
  };

/**
 * La cuenta del colaborador.
 *
 * Lo que se ve acá son operaciones del fideicomiso, no un saldo: no hay dinero
 * disponible para mover ni botón para retirar. Por eso los montos van separados
 * —comprometido, acreditado, liquidado— en vez de sumados en un número grande
 * que parecería una billetera.
 */
export default async function CarteraPage() {
  const cartera = await getCarteraDeColaborador(COLABORADOR_DEMO);

  const posiciones = await Promise.all(
    cartera.posiciones.map(async (p) => ({
      ...p,
      fondeo: calcularFondeo(p.proyecto, await getAportesDeProyecto(p.proyecto.id)),
    })),
  );

  const enCurso = posiciones.filter((p) => p.proyecto.estado !== "cerrado");
  const cerradas = posiciones.filter((p) => p.proyecto.estado === "cerrado");

  // Lo que está puesto en ciclos que todavía no cerraron. No es un saldo: vuelve
  // cuando cada uno se liquide, y por el monto que dé la liquidación.
  const enCiclosAbiertos = enCurso.reduce((a, p) => a + p.aporte.montoAcreditadoArs, 0);

  // Cómo se reparte el capital acreditado. Sobre el acreditado y no sobre el
  // comprometido: lo que todavía no entró al fideicomiso no está puesto en nada.
  const totalAcreditado = posiciones.reduce(
    (a, p) => a + p.aporte.montoAcreditadoArs,
    0,
  );
  const distribucion = posiciones
    .filter((p) => p.aporte.montoAcreditadoArs > 0)
    .map((p) => ({
      id: p.aporte.id,
      titulo: p.proyecto.titulo,
      monto: p.aporte.montoAcreditadoArs,
      pct: (p.aporte.montoAcreditadoArs / totalAcreditado) * 100,
    }))
    .sort((a, b) => b.monto - a.monto);

  return (
    <div className="space-y-10">
      <div>
        <p className="rotulo text-tinta-tenue">Mi cartera</p>
        <h1 className="mt-2.5 text-2xl font-semibold tracking-tight">
          Dónde está tu capital
        </h1>
        <p className="mt-1.5 text-sm text-tinta-suave">
          Operaciones de cada serie, no un saldo: no hay dinero para retirar ni para pasar
          de un proyecto a otro.
        </p>
      </div>

      <Panel className="p-5">
        <dl className="tabular grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <Dato etiqueta="Acreditado" ayuda="Lo que el banco acreditó.">
            {formatArs(cartera.acreditadoArs)}
          </Dato>
          <Dato etiqueta="Comprometido sin acreditar" ayuda="Adherido y sin transferir.">
            {formatArs(cartera.pendienteDeAcreditarArs)}
          </Dato>
          <Dato etiqueta="En ciclos abiertos" ayuda="Vuelve cuando cada ciclo se liquide.">
            {formatArs(enCiclosAbiertos)}
          </Dato>
          <Dato etiqueta="Liquidado sin cobrar" ayuda="Calculado o aprobado, sin pagar.">
            {formatArs(cartera.liquidadoPendienteArs)}
          </Dato>
          <Dato etiqueta="Cobrado" ayuda="Capital más resultado ya pagado.">
            {formatArs(cartera.liquidadoPagadoArs)}
          </Dato>
        </dl>
      </Panel>

      {distribucion.length > 0 ? (
        <Seccion titulo="Cómo se distribuye" descripcion="Tu capital acreditado, por proyecto.">
          <Panel className="p-5">
            <ul className="space-y-4">
              {distribucion.map((d) => (
                <li key={d.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <p className="text-sm font-medium">{d.titulo}</p>
                    <p className="tabular text-sm text-tinta-suave">
                      {formatArs(d.monto)} · {formatPct(d.pct)}
                    </p>
                  </div>
                  <div className="mt-2">
                    <Progreso valor={d.pct} label={`${d.titulo}: ${formatPct(d.pct)} de tu capital`} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </Seccion>
      ) : null}

      <Seccion
        titulo="Tus posiciones"
        descripcion="Un proyecto por aporte."
      >
        {enCurso.length === 0 ? (
          <Vacio titulo="No tenés posiciones abiertas">
            En el catálogo están los proyectos con adhesión habilitada.
          </Vacio>
        ) : (
          <ul className="space-y-4">
            {enCurso.map(({ proyecto, aporte, fondeo }) => (
              <li key={aporte.id}>
                <Panel className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-tinta-tenue">
                        {modalidadLabel(proyecto.modalidad)} · {proyecto.provincia}
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

                  <dl className="tabular mt-5 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-borde pt-4 sm:grid-cols-4">
                    <Dato etiqueta="Comprometido">
                      {formatArs(aporte.montoComprometidoArs)}
                    </Dato>
                    <Dato etiqueta="Acreditado">
                      {formatArs(aporte.montoAcreditadoArs)}
                    </Dato>
                    <Dato etiqueta={retornoDelProyecto(proyecto).etiqueta}>
                      {retornoDelProyecto(proyecto).valor}
                    </Dato>
                    <Dato etiqueta="Orden de suscripción" codigo>
                      {aporte.ordenSuscripcion}
                    </Dato>
                  </dl>

                  <div className="mt-4">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                      <p className="text-sm text-tinta-suave">Fondeo del proyecto</p>
                      <p className="tabular text-sm">{formatPct(fondeo.porcentaje)}</p>
                    </div>
                    <div className="mt-2">
                      <Progreso
                        valor={fondeo.porcentaje}
                        label={`Fondeo de ${proyecto.titulo}`}
                      />
                    </div>
                  </div>

                  <EstadoDelAporte aporte={aporte} />
                </Panel>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      {cerradas.length > 0 ? (
        <Seccion
          titulo="Ciclos cerrados"
          descripcion="Lo que ya terminó."
        >
          <ul className="space-y-3">
            {cerradas.map(({ proyecto, aporte }) => (
              <li key={aporte.id}>
                <Panel className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <h3 className="font-semibold">
                      <Link href={`/proyectos/${proyecto.id}`} className="hover:text-marca">
                        {proyecto.titulo}
                      </Link>
                    </h3>
                    <Badge tono="ok">Cerrado</Badge>
                  </div>
                  <dl className="tabular mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                    <Dato etiqueta="Aportado">{formatArs(aporte.montoAcreditadoArs)}</Dato>
                    {cartera.liquidaciones
                      .filter((l) => l.proyectoId === proyecto.id)
                      .map((l) => (
                        <Dato
                          key={l.id}
                          etiqueta="Resultado liquidado"
                          ayuda={
                            l.estado === "pagada"
                              ? `Pagada el ${formatFecha(l.pagadaAt ?? l.fecha)}`
                              : "Todavía no cobrada"
                          }
                        >
                          {formatArs(l.resultadoArs)}
                        </Dato>
                      ))}
                  </dl>
                </Panel>
              </li>
            ))}
          </ul>
        </Seccion>
      ) : null}

      <Seccion
        titulo="Liquidaciones"
        descripcion="Solo la pagada es dinero en tu cuenta."
      >
        {cartera.liquidaciones.length === 0 ? (
          <Vacio titulo="Todavía no hay liquidaciones">
            Aparecen cuando un ciclo cierra y se liquida el resultado.
          </Vacio>
        ) : (
          <ul className="divide-y divide-borde border-y border-borde">
            {cartera.liquidaciones.map((l) => (
              <li
                key={l.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5"
              >
                <div>
                  <p className="font-medium">{l.concepto}</p>
                  <p className="mt-0.5 text-sm text-tinta-tenue">
                    {formatFecha(l.fecha)} · capital {formatArs(l.capitalArs)} · resultado{" "}
                    {formatArs(l.resultadoArs)}
                  </p>
                </div>
                <Badge tono={l.estado === "pagada" ? "ok" : "alerta"}>
                  {l.estado === "pagada"
                    ? `Pagada el ${formatFecha(l.pagadaAt ?? l.fecha)}`
                    : l.estado === "aprobada"
                      ? "Aprobada, sin pagar"
                      : "Calculada, sin aprobar"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Seccion>

      <div className="flex flex-wrap gap-3">
        <BotonLink href="/proyectos">Ver el catálogo</BotonLink>
      </div>
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
          Adherido el {formatFecha(aporte.adhesionAt)} · {aporte.contratoVersion}
        </p>
      </div>

      {aporte.estado === "pendiente_acreditacion" ? (
        <p className="mt-3 text-sm text-tinta-suave">
          Transferí {formatArs(falta)} con la referencia{" "}
          <span className="codigo">{aporte.ordenSuscripcion}</span>. Hasta que el banco lo
          acredite, no cuenta para el fondeo.
        </p>
      ) : null}

      {aporte.movimientos.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {aporte.movimientos.map((m) => (
            <li key={m.id} className="text-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <span className="text-tinta-suave">
                  {formatFecha(m.fecha)} · referencia{" "}
                  <span className="codigo">{m.referenciaExterna}</span>
                </span>
                <span className="tabular font-medium">{formatArs(m.importeArs)}</span>
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
