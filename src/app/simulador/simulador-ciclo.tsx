"use client";

import Image from "next/image";
import { useState } from "react";
import { ArrowRight, RotateCcw, Sprout, Tractor } from "lucide-react";
import { formatArs, formatNum, formatPct } from "@/lib/format";
import {
  COMISIONES,
  MODELOS,
  PRECIOS_DEL_ANALISIS,
  SISTEMAS_SIMULADOR,
  SUPUESTOS,
  compraPorCabeza,
  simularColaborador,
  simularProductor,
  type Precios,
} from "@/lib/simulador";
import type { SistemaProductivo } from "@/lib/types";

type Lado = "productor" | "colaborador";
type Origen = "mercado" | "analisis" | "propio";

export interface PrecioMostrado {
  valor: number;
  fuente: string;
  cuando: string;
  enVivo: boolean;
}

const FOTO: Record<SistemaProductivo, string> = {
  corral: "/imagenes/fotos/proyecto4.webp",
  mixto: "/imagenes/fotos/proyecto-1.webp",
  pastura: "/imagenes/fotos/proyecto6.webp",
};

const APORTES_RAPIDOS = [2_000_000, 5_000_000, 10_000_000, 25_000_000];
const CABEZAS_RAPIDAS = [50, 100, 250, 500];

const soloDigitos = (v: string) => v.replace(/\D/g, "");
const compacto = (n: number) =>
  n >= 1_000_000 ? `$ ${formatNum(n / 1_000_000)} M` : formatArs(n);

/** Un control de dos opciones en forma de píldora. */
function Pildora<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
}: {
  etiqueta: string;
  opciones: { valor: T; titulo: string; icono?: React.ReactNode }[];
  valor: T;
  onCambio: (v: T) => void;
}) {
  return (
    <div role="group" aria-label={etiqueta} className="flex rounded-full bg-superficie-2 p-1">
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={activo}
            onClick={() => onCambio(o.valor)}
            className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors ${
              activo ? "bg-superficie text-marca shadow-[var(--sombra-baja)]" : "text-tinta-suave hover:text-tinta"
            }`}
          >
            {o.icono}
            {o.titulo}
          </button>
        );
      })}
    </div>
  );
}

/** Un precio del kilo: el dato, de dónde sale y una barra para moverlo. */
function TarjetaPrecio({
  id,
  titulo,
  valor,
  mercado,
  origen,
  onCambio,
}: {
  id: string;
  titulo: string;
  valor: number;
  mercado: PrecioMostrado;
  origen: Origen;
  onCambio: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-borde bg-superficie p-4 shadow-[var(--sombra-baja)]">
      <div className="flex items-start justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-tinta-suave">
          {titulo}
        </label>
        {origen === "mercado" ? (
          mercado.enVivo ? (
            <span className="flex items-center gap-1.5 rounded-full bg-marca-suave px-2.5 py-0.5 text-sm font-medium text-marca">
              <span className="size-2 animate-pulse rounded-full bg-marca-viva motion-reduce:animate-none" aria-hidden />
              Hoy
            </span>
          ) : (
            <span className="rounded-full bg-alerta-suave px-2.5 py-0.5 text-sm font-medium">Sin conexión</span>
          )
        ) : (
          <span className="rounded-full bg-superficie-2 px-2.5 py-0.5 text-sm font-medium text-tinta-suave">
            {origen === "analisis" ? "Análisis" : "A mano"}
          </span>
        )}
      </div>
      <p className="tabular mt-1 text-3xl font-semibold tracking-tight">
        {formatArs(valor)}
        <span className="text-base font-medium text-tinta-suave"> /kg</span>
      </p>
      <input
        id={id}
        type="range"
        min={2_000}
        max={10_000}
        step={50}
        value={valor}
        onChange={(e) => onCambio(Number(e.target.value))}
        aria-valuetext={`${formatArs(valor)} el kilo`}
        className="mt-2 h-11 w-full cursor-pointer accent-[var(--marca)]"
      />
      <p className="text-sm text-tinta-suave">
        {origen === "mercado"
          ? `${mercado.fuente}, ${mercado.cuando}.`
          : origen === "analisis"
            ? "El valor que usa el análisis económico del proyecto."
            : "Lo moviste vos."}
      </p>
    </div>
  );
}

/**
 * El simulador de un ciclo. Arriba, el precio del kilo de hoy; a la izquierda,
 * de qué lado, qué ciclo y cuánto; a la derecha, cuánto queda y de dónde sale.
 * Todo se recalcula al tocar cualquier cosa.
 */
export function SimuladorCiclo({
  ladoInicial,
  mercado,
}: {
  ladoInicial: Lado;
  mercado: { compra: PrecioMostrado; venta: PrecioMostrado };
}) {
  const [lado, setLado] = useState<Lado>(ladoInicial);
  const [sistema, setSistema] = useState<SistemaProductivo>("pastura");
  const [cabezas, setCabezas] = useState(100);
  const [aporte, setAporte] = useState(5_000_000);
  const [origen, setOrigen] = useState<Origen>("mercado");
  const [precios, setPrecios] = useState<Precios>({
    compraKg: mercado.compra.valor,
    ventaKg: mercado.venta.valor,
  });

  const usar = (o: Exclude<Origen, "propio">) => {
    setOrigen(o);
    setPrecios(
      o === "mercado"
        ? { compraKg: mercado.compra.valor, ventaKg: mercado.venta.valor }
        : PRECIOS_DEL_ANALISIS,
    );
  };
  const mover = (cual: keyof Precios, v: number) => {
    setOrigen("propio");
    setPrecios((p) => ({ ...p, [cual]: v }));
  };

  const r = lado === "productor" ? simularProductor(sistema, cabezas, precios) : simularColaborador(sistema, aporte, precios);
  const m = MODELOS[sistema];
  const porCabeza = compraPorCabeza(precios);
  const vacio = lado === "productor" ? cabezas === 0 : aporte < porCabeza;
  const pierde = r.ganancia < 0;
  const hacienda = lado === "productor" ? cabezas * porCabeza : aporte;
  const brecha = precios.compraKg / precios.ventaKg - 1;

  // Las barras del desglose se miden contra el renglón más grande.
  const mayor = Math.max(1, ...r.lineas.map((l) => Math.abs(l.monto)));

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* El precio del kilo */}
      <section aria-labelledby="titulo-precios" className="rounded-3xl bg-marca-suave p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="titulo-precios" className="text-lg font-semibold tracking-tight text-marca-fuerte">
              El precio del kilo
            </h2>
            <p className="text-sm text-tinta-suave">
              {brecha > 0
                ? `El ternero vale ${formatPct(brecha * 100)} más por kilo que el novillito.`
                : `El novillito vale ${formatPct(-brecha * 100)} más por kilo que el ternero.`}{" "}
              Esa diferencia es la que más mueve el resultado.
            </p>
          </div>
          <div className="w-full sm:w-80">
            <Pildora<"mercado" | "analisis">
              etiqueta="Qué precios usar"
              valor={origen === "analisis" ? "analisis" : "mercado"}
              onCambio={usar}
              opciones={[
                { valor: "mercado", titulo: "Precios de hoy" },
                { valor: "analisis", titulo: "Del análisis" },
              ]}
            />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <TarjetaPrecio
            id="precio-compra"
            titulo="Comprás el ternero a"
            valor={precios.compraKg}
            mercado={mercado.compra}
            origen={origen}
            onCambio={(v) => mover("compraKg", v)}
          />
          <TarjetaPrecio
            id="precio-venta"
            titulo="Vendés el novillito a"
            valor={precios.ventaKg}
            mercado={mercado.venta}
            origen={origen}
            onCambio={(v) => mover("ventaKg", v)}
          />
        </div>
        {origen === "propio" ? (
          <button
            type="button"
            onClick={() => usar("mercado")}
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-sm font-medium text-marca underline underline-offset-4"
          >
            <RotateCcw className="size-4" strokeWidth={1.75} aria-hidden />
            Volver a los precios de hoy
          </button>
        ) : null}
      </section>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Las decisiones */}
        <section className="space-y-6 lg:col-span-5 lg:self-start">
          <Pildora<Lado>
            etiqueta="De qué lado"
            valor={lado}
            onCambio={setLado}
            opciones={[
              { valor: "colaborador", titulo: "Colaboro", icono: <Sprout className="size-4" strokeWidth={1.75} aria-hidden /> },
              { valor: "productor", titulo: "Produzco", icono: <Tractor className="size-4" strokeWidth={1.75} aria-hidden /> },
            ]}
          />

          <fieldset>
            <legend className="font-semibold">El ciclo</legend>
            <div className="mt-2 grid gap-2">
              {SISTEMAS_SIMULADOR.map((s) => {
                const activo = s === sistema;
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={activo}
                    onClick={() => setSistema(s)}
                    className={`flex items-center gap-3 overflow-hidden rounded-2xl border bg-superficie p-2 pr-4 text-left transition-colors ${
                      activo ? "border-marca ring-2 ring-marca" : "border-borde hover:border-marca"
                    }`}
                  >
                    <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-marca-suave">
                      <Image src={FOTO[s]} alt="" fill sizes="5rem" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{MODELOS[s].nombre}</span>
                      <span className="block text-sm text-tinta-suave">{MODELOS[s].descripcion}</span>
                    </span>
                    <span className="tabular shrink-0 text-sm font-medium text-tinta-suave">
                      {MODELOS[s].dias} días
                    </span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {lado === "colaborador" ? (
            <div>
              <label htmlFor="aporte" className="font-semibold">
                Cuánto aportás
              </label>
              <div className="mt-2 flex items-center rounded-2xl border border-borde-fuerte bg-superficie px-4 focus-within:border-marca focus-within:ring-2 focus-within:ring-marca">
                <span className="text-xl text-tinta-suave" aria-hidden>$</span>
                <input
                  id="aporte"
                  inputMode="numeric"
                  autoComplete="off"
                  value={aporte ? formatNum(aporte) : ""}
                  onChange={(e) => setAporte(Number(soloDigitos(e.target.value).slice(0, 11)) || 0)}
                  className="tabular min-h-14 w-full bg-transparent px-2 text-2xl font-semibold outline-none"
                />
              </div>
              <input
                type="range"
                min={500_000}
                max={50_000_000}
                step={250_000}
                value={Math.min(Math.max(aporte, 500_000), 50_000_000)}
                onChange={(e) => setAporte(Number(e.target.value))}
                aria-label="Cuánto aportás"
                aria-valuetext={formatArs(aporte)}
                className="mt-1 h-11 w-full cursor-pointer accent-[var(--marca)]"
              />
              <div className="flex flex-wrap gap-2">
                {APORTES_RAPIDOS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setAporte(v)}
                    aria-pressed={aporte === v}
                    className="min-h-11 rounded-full border border-borde-fuerte px-3 text-sm font-medium transition-colors hover:border-marca aria-pressed:border-marca aria-pressed:bg-marca-suave aria-pressed:text-marca"
                  >
                    {compacto(v)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-tinta-suave">
                {vacio
                  ? `Un ternero cuesta ${formatArs(porCabeza)}: el aporte tiene que alcanzar para uno.`
                  : `Alcanza para ${formatNum(Math.floor(aporte / porCabeza))} terneros de ${SUPUESTOS.pesoEntradaKg} kg, a ${formatArs(porCabeza)} cada uno.`}
              </p>
            </div>
          ) : (
            <div>
              <label htmlFor="cabezas" className="font-semibold">
                Cuántas cabezas
              </label>
              <div className="mt-2 flex items-center rounded-2xl border border-borde-fuerte bg-superficie px-4 focus-within:border-marca focus-within:ring-2 focus-within:ring-marca">
                <input
                  id="cabezas"
                  inputMode="numeric"
                  autoComplete="off"
                  value={cabezas ? formatNum(cabezas) : ""}
                  onChange={(e) => setCabezas(Number(soloDigitos(e.target.value).slice(0, 5)) || 0)}
                  className="tabular min-h-14 w-full bg-transparent text-2xl font-semibold outline-none"
                />
                <span className="text-tinta-suave">cabezas</span>
              </div>
              <input
                type="range"
                min={10}
                max={1_000}
                step={10}
                value={Math.min(Math.max(cabezas, 10), 1_000)}
                onChange={(e) => setCabezas(Number(e.target.value))}
                aria-label="Cuántas cabezas"
                aria-valuetext={`${formatNum(cabezas)} cabezas`}
                className="mt-1 h-11 w-full cursor-pointer accent-[var(--marca)]"
              />
              <div className="flex flex-wrap gap-2">
                {CABEZAS_RAPIDAS.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setCabezas(v)}
                    aria-pressed={cabezas === v}
                    className="min-h-11 rounded-full border border-borde-fuerte px-3 text-sm font-medium transition-colors hover:border-marca aria-pressed:border-marca aria-pressed:bg-marca-suave aria-pressed:text-marca"
                  >
                    {formatNum(v)}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-tinta-suave">
                Terneros de {SUPUESTOS.pesoEntradaKg} kg que salen con {m.pesoSalidaKg} kg. La compra la ponen los colaboradores.
              </p>
            </div>
          )}
        </section>

        {/* El resultado */}
        <div className="space-y-4 lg:col-span-7" aria-live="polite">
          <section
            id="resultado"
            className={`relative scroll-mt-28 overflow-hidden rounded-3xl p-5 sm:p-7 ${
              pierde ? "bg-alerta-suave text-tinta" : "bg-marca-fuerte text-white"
            }`}
          >
            {!pierde ? (
              <span
                className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-marca-viva/25 blur-2xl"
                aria-hidden
              />
            ) : null}
            <p className="relative font-medium opacity-90">
              {vacio ? "Tu resultado" : pierde ? "Con estos precios, el ciclo pierde" : "Te queda, después de todo"}
            </p>
            <p className="tabular relative mt-1 text-4xl font-semibold tracking-tight sm:text-5xl">
              {vacio ? "—" : formatArs(r.ganancia)}
            </p>
            {!vacio ? (
              <>
                <div className="relative mt-3 flex flex-wrap gap-2 text-sm font-medium">
                  <span className={`rounded-full px-3 py-1 ${pierde ? "bg-superficie" : "bg-white/15"}`}>
                    {formatPct(r.porCiclo * 100)} en {r.dias} días
                  </span>
                  <span className={`rounded-full px-3 py-1 ${pierde ? "bg-superficie" : "bg-white/15"}`}>
                    {formatPct(r.anual * 100)} llevado a un año
                  </span>
                </div>

                {/* Ponés → recibís */}
                <div className="relative mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t border-current/20 pt-4">
                  <div>
                    <p className="text-sm opacity-85">Ponés</p>
                    <p className="tabular text-xl font-semibold">{formatArs(r.aporte)}</p>
                  </div>
                  <ArrowRight className="size-5 opacity-70" strokeWidth={1.75} aria-hidden />
                  <div className="text-right">
                    <p className="text-sm opacity-85">Recibís al cierre</p>
                    <p className="tabular text-xl font-semibold">{formatArs(r.recibe)}</p>
                  </div>
                </div>
                <div className="relative mt-3 flex h-3 overflow-hidden rounded-full bg-current/15" aria-hidden>
                  <span
                    className={pierde ? "bg-tinta-tenue" : "bg-white/70"}
                    style={{ width: `${Math.min(100, (Math.min(r.recibe, r.aporte) / Math.max(r.recibe, r.aporte)) * 100)}%` }}
                  />
                  {!pierde ? <span className="flex-1 bg-marca-viva" /> : null}
                </div>
              </>
            ) : (
              <p className="relative mt-2">
                {lado === "productor" ? "Elegí cuántas cabezas." : "Elegí cuánto aportás."}
              </p>
            )}
          </section>

          {!vacio ? (
            <>
              <section className="rounded-3xl border border-borde bg-superficie p-5 sm:p-7">
                <h2 className="text-lg font-semibold tracking-tight">De dónde sale el número</h2>
                <ul className="mt-4 space-y-3">
                  {r.lineas.map((l) => {
                    const guardian = l.concepto.startsWith("Comisión");
                    return (
                      <li key={l.concepto}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0">
                            <span className={`block ${guardian ? "font-semibold text-marca" : ""}`}>{l.concepto}</span>
                            {l.detalle ? <span className="block text-sm text-tinta-suave">{l.detalle}</span> : null}
                          </span>
                          <span className={`tabular shrink-0 font-medium ${l.monto >= 0 ? "text-marca" : ""}`}>
                            {l.monto < 0 ? "−" : "+"}
                            {formatArs(Math.abs(l.monto))}
                          </span>
                        </div>
                        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-superficie-2" aria-hidden>
                          <span
                            className={`block h-full rounded-full ${
                              l.monto >= 0 ? "bg-marca-viva" : guardian ? "bg-marca" : "bg-borde-fuerte"
                            }`}
                            style={{ width: `${Math.max(1.5, (Math.abs(l.monto) / mayor) * 100)}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-4 flex items-baseline justify-between gap-4 border-t border-borde pt-3">
                  <span className="font-semibold">Te queda</span>
                  <span className={`tabular text-lg font-semibold ${pierde ? "" : "text-marca"}`}>
                    {formatArs(r.ganancia)}
                  </span>
                </div>
              </section>

              <section className="grid grid-cols-2 gap-3">
                {(["productor", "colaborador"] as const).map((l) => (
                  <div
                    key={l}
                    className={`rounded-2xl border p-4 ${l === lado ? "border-marca bg-marca-suave" : "border-borde bg-superficie"}`}
                  >
                    <p className="text-sm text-tinta-suave">Guardian cobra {l === "productor" ? "al productor" : "al colaborador"}</p>
                    <p className="tabular text-2xl font-semibold">{formatPct(COMISIONES[l] * 100)}</p>
                    <p className="text-sm text-tinta-suave">del valor de la hacienda, una vez</p>
                  </div>
                ))}
                <p className="col-span-2 text-sm text-tinta-suave">
                  En esta cuenta pagás <strong className="tabular font-semibold text-tinta">{formatArs(r.comisionGuardian)}</strong> sobre{" "}
                  <span className="tabular">{formatArs(hacienda)}</span> de hacienda.
                </p>
              </section>
            </>
          ) : null}

          {/* En el teléfono, el resultado queda a la vista mientras se mueven los controles. */}
          {!vacio ? (
            <a
              href="#resultado"
              className={`fixed inset-x-3 bottom-3 z-20 flex min-h-14 items-center justify-between gap-3 rounded-2xl px-4 shadow-[var(--sombra-alta)] lg:hidden ${
                pierde ? "bg-alerta-suave text-tinta" : "bg-marca-fuerte text-white"
              }`}
              style={{ marginBottom: "env(safe-area-inset-bottom)" }}
            >
              <span className="text-sm">{pierde ? "Pierde" : "Te queda"}</span>
              <span className="tabular text-lg font-semibold">{formatArs(r.ganancia)}</span>
              <span className="tabular text-sm opacity-90">{formatPct(r.porCiclo * 100)}</span>
            </a>
          ) : null}

          <p className="text-sm text-tinta-suave">
            Es una estimación, no una promesa. Usa el precio del kilo de arriba, 1 % de mortandad y los
            costos del análisis económico del proyecto. El resultado real depende del precio al vender y
            puede ser menor, o negativo.
          </p>
        </div>
      </div>
    </div>
  );
}
