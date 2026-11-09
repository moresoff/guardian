"use client";

import { useState } from "react";
import { Campo } from "@/components/ui/campos";
import { formatArs, formatNum, formatPct } from "@/lib/format";
import {
  COMISIONES,
  COMPRA_POR_CABEZA,
  MODELOS,
  SISTEMAS_SIMULADOR,
  SUPUESTOS,
  simularColaborador,
  simularProductor,
} from "@/lib/simulador";
import type { SistemaProductivo } from "@/lib/types";

type Lado = "productor" | "colaborador";

const soloDigitos = (v: string) => v.replace(/\D/g, "");

/** Un grupo de botones grandes donde se elige uno. */
function Elegir<T extends string>({
  etiqueta,
  opciones,
  valor,
  onCambio,
}: {
  etiqueta: string;
  opciones: { valor: T; titulo: string; detalle?: string }[];
  valor: T;
  onCambio: (v: T) => void;
}) {
  return (
    <fieldset>
      <legend className="text-base font-semibold">{etiqueta}</legend>
      <div className={`mt-2 grid gap-2 ${opciones.length === 3 ? "sm:grid-cols-3" : "grid-cols-2"}`}>
        {opciones.map((o) => {
          const activo = o.valor === valor;
          return (
            <button
              key={o.valor}
              type="button"
              aria-pressed={activo}
              onClick={() => onCambio(o.valor)}
              className={`min-h-12 rounded-xl border px-4 py-3 text-left transition-colors ${
                activo
                  ? "border-marca bg-marca text-marca-contraste"
                  : "border-borde-fuerte bg-superficie hover:border-marca hover:bg-marca-suave"
              }`}
            >
              <span className="block text-base font-semibold">{o.titulo}</span>
              {o.detalle ? (
                <span className={`block text-sm ${activo ? "text-marca-contraste/85" : "text-tinta-suave"}`}>
                  {o.detalle}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * El simulador de un ciclo, para las dos partes. Tres decisiones —de qué lado,
 * qué ciclo y cuánto— y el resultado arriba de todo: lo primero que se ve es
 * cuánto queda. Abajo, de dónde sale ese número, renglón por renglón, con lo
 * que cobra Guardian a la vista.
 */
export function SimuladorCiclo({ ladoInicial }: { ladoInicial: Lado }) {
  const [lado, setLado] = useState<Lado>(ladoInicial);
  const [sistema, setSistema] = useState<SistemaProductivo>("corral");
  const [cabezas, setCabezas] = useState("100");
  const [aporte, setAporte] = useState("5000000");

  const nCabezas = Number(soloDigitos(cabezas)) || 0;
  const nAporte = Number(soloDigitos(aporte)) || 0;
  const r =
    lado === "productor"
      ? simularProductor(sistema, nCabezas)
      : simularColaborador(sistema, nAporte);
  const m = MODELOS[sistema];
  const vacio = lado === "productor" ? nCabezas === 0 : nAporte === 0;
  const pierde = r.ganancia < 0;

  // El valor de la hacienda del lote, que es sobre lo que se calculan las comisiones.
  const hacienda = lado === "productor" ? nCabezas * COMPRA_POR_CABEZA : nAporte;

  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <section className="space-y-6 rounded-2xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] sm:p-7 lg:col-span-5 lg:self-start">
        <Elegir<Lado>
          etiqueta="¿De qué lado?"
          valor={lado}
          onCambio={setLado}
          opciones={[
            { valor: "productor", titulo: "Productor", detalle: "Pongo el campo y el cuidado" },
            { valor: "colaborador", titulo: "Colaborador", detalle: "Pongo la compra de la hacienda" },
          ]}
        />
        <Elegir<SistemaProductivo>
          etiqueta="¿Qué ciclo?"
          valor={sistema}
          onCambio={setSistema}
          opciones={SISTEMAS_SIMULADOR.map((s) => ({
            valor: s,
            titulo: MODELOS[s].nombre,
            detalle: `${MODELOS[s].dias} días`,
          }))}
        />
        {lado === "productor" ? (
          <Campo
            etiqueta="¿Cuántas cabezas?"
            ayuda={`Terneros de ${SUPUESTOS.pesoEntradaKg} kg que salen a ${m.pesoSalidaKg} kg.`}
            inputMode="numeric"
            className="tabular"
            value={cabezas}
            onChange={(e) => setCabezas(soloDigitos(e.target.value).slice(0, 5))}
          />
        ) : (
          <Campo
            etiqueta="¿Cuánto querés aportar? ($)"
            ayuda={`Alcanza para ${formatNum(Math.floor(nAporte / COMPRA_POR_CABEZA))} terneros a ${formatArs(COMPRA_POR_CABEZA)} cada uno.`}
            inputMode="numeric"
            className="tabular"
            value={nAporte ? formatNum(nAporte) : ""}
            onChange={(e) => setAporte(soloDigitos(e.target.value).slice(0, 12))}
          />
        )}
      </section>

      <div className="space-y-6 lg:col-span-7" aria-live="polite">
        <section
          className={`rounded-2xl p-5 sm:p-7 ${pierde ? "bg-alerta-suave" : "bg-marca text-marca-contraste"}`}
        >
          <p className="text-base font-medium">
            {pierde ? "Con estos números el ciclo pierde" : "Ganancia estimada del ciclo"}
          </p>
          <p className="tabular mt-1 text-4xl font-semibold tracking-tight">
            {vacio ? "—" : formatArs(r.ganancia)}
          </p>
          {vacio ? (
            <p className="mt-2 text-base">
              {lado === "productor" ? "Escribí cuántas cabezas." : "Escribí cuánto querés aportar."}
            </p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-4 border-t border-current/20 pt-4 text-base">
              <div>
                <dt className="opacity-85">En {r.dias} días</dt>
                <dd className="tabular text-xl font-semibold">{formatPct(r.porCiclo * 100)}</dd>
              </div>
              <div>
                <dt className="opacity-85">Llevado a un año</dt>
                <dd className="tabular text-xl font-semibold">{formatPct(r.anual * 100)}</dd>
              </div>
              <div>
                <dt className="opacity-85">Ponés</dt>
                <dd className="tabular text-xl font-semibold">{formatArs(r.aporte)}</dd>
              </div>
              <div>
                <dt className="opacity-85">Recibís al final</dt>
                <dd className="tabular text-xl font-semibold">{formatArs(r.recibe)}</dd>
              </div>
            </dl>
          )}
        </section>

        <section className="rounded-2xl border border-borde bg-superficie p-5 sm:p-7">
          <h2 className="text-lg font-semibold">Lo que cobra Guardian</h2>
          <p className="mt-1 text-base text-tinta-suave">
            Una comisión sobre el valor de la hacienda comprada, una sola vez por ciclo.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <div
              className={`rounded-xl border p-4 ${lado === "productor" ? "border-marca bg-marca-suave" : "border-borde"}`}
            >
              <dt className="text-sm text-tinta-suave">Al productor</dt>
              <dd className="tabular text-2xl font-semibold">{formatPct(COMISIONES.productor * 100)}</dd>
            </div>
            <div
              className={`rounded-xl border p-4 ${lado === "colaborador" ? "border-marca bg-marca-suave" : "border-borde"}`}
            >
              <dt className="text-sm text-tinta-suave">Al colaborador</dt>
              <dd className="tabular text-2xl font-semibold">{formatPct(COMISIONES.colaborador * 100)}</dd>
            </div>
          </dl>
          {!vacio ? (
            <p className="mt-3 text-base">
              En este ciclo pagás{" "}
              <strong className="tabular font-semibold">{formatArs(r.comisionGuardian)}</strong>, sobre{" "}
              <span className="tabular">{formatArs(hacienda)}</span> de hacienda.
            </p>
          ) : null}
        </section>

        {!vacio ? (
          <section className="rounded-2xl border border-borde bg-superficie p-5 sm:p-7">
            <h2 className="text-lg font-semibold">De dónde sale el número</h2>
            <dl className="mt-3 divide-y divide-borde">
              {r.lineas.map((l) => (
                <div key={l.concepto} className="flex items-start justify-between gap-4 py-3">
                  <dt className="min-w-0">
                    <span className="block text-base">{l.concepto}</span>
                    {l.detalle ? <span className="block text-sm text-tinta-suave">{l.detalle}</span> : null}
                  </dt>
                  <dd className={`tabular shrink-0 text-base font-medium ${l.monto < 0 ? "text-tinta" : "text-marca"}`}>
                    {l.monto < 0 ? "−" : "+"}
                    {formatArs(Math.abs(l.monto))}
                  </dd>
                </div>
              ))}
              <div className="flex items-start justify-between gap-4 pt-3">
                <dt className="text-base font-semibold">Te queda</dt>
                <dd className="tabular text-base font-semibold">{formatArs(r.ganancia)}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        <p className="text-sm text-tinta-suave">
          Es una estimación del análisis económico del proyecto, no una promesa. Supone compra a{" "}
          {formatArs(SUPUESTOS.precioCompraKg)} el kilo, venta a {formatArs(SUPUESTOS.precioVentaKg)} el
          kilo y 1 % de mortandad. El resultado real depende del precio al vender y puede ser menor, o
          negativo.
        </p>
      </div>
    </div>
  );
}
