"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Campo } from "@/components/ui/campos";
import { Boton, BotonLink } from "@/components/ui/primitivos";
import {
  FIDUCIARIO,
  contratoDeAdhesion,
  contratoDeFideicomiso,
  type Contrato,
} from "@/lib/contrato";
import { formatArs, formatNum } from "@/lib/format";
import { MODELOS, simularColaborador, type Precios } from "@/lib/simulador";
import type { Garantia, Productor, Proyecto } from "@/lib/types";
import { firmarFideicomisoDelProyecto, participar } from "@/app/proyectos/[id]/acciones";

type Props =
  | {
      rol: "colaborador";
      proyecto: Proyecto;
      productor: Productor;
      /** Lo que todavía falta cubrir del objetivo. */
      lugar: number;
      /** El precio del kilo de hoy, para la estimación. */
      precios?: Precios;
    }
  | {
      rol: "productor";
      proyecto: Proyecto;
      productor: Productor;
      garantia?: Garantia;
      /** Si ya está firmado: se muestra la firma en vez del recorrido. */
      firmado?: { fecha: string; version: string; hash: string } | null;
    };

const soloDigitos = (v: string) => v.replace(/\D/g, "");
const MINIMO = 100_000;

/**
 * Firmar el contrato, de a un paso por pantalla. El colaborador elige cuánto
 * aporta; las dos partes conocen al fiduciario, leen el contrato y lo firman con
 * un código. La firma está simulada: el código se muestra en pantalla en vez de
 * llegar por SMS.
 */
export function FirmaContrato(props: Props) {
  const { rol, proyecto, productor } = props;
  const pasos =
    rol === "colaborador"
      ? (["Cuánto", "Quién administra", "El contrato", "Firma"] as const)
      : (["Quién administra", "El contrato", "Firma"] as const);

  const [paso, setPaso] = useState(0);
  const [monto, setMonto] = useState("");
  const [leido, setLeido] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState<{ orden?: string; monto?: number } | null>(null);
  // El código «enviado». En la demo se muestra; con proveedor llega por SMS.
  const [enviado] = useState(() => String(Math.floor(100000 + Math.random() * 900000)));
  const titulo = useRef<HTMLHeadingElement>(null);
  const pasoAnterior = useRef(paso);

  useEffect(() => {
    if (pasoAnterior.current === paso && !listo) return;
    pasoAnterior.current = paso;
    titulo.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paso, listo]);

  const nMonto = Number(soloDigitos(monto)) || 0;
  const contrato: Contrato = useMemo(
    () =>
      props.rol === "colaborador"
        ? contratoDeAdhesion(proyecto, productor, nMonto)
        : contratoDeFideicomiso(proyecto, productor, props.garantia),
    [props, proyecto, productor, nMonto],
  );
  const nombrePaso = pasos[paso];

  const siguiente = () => {
    setError(null);
    if (nombrePaso === "Cuánto" && props.rol === "colaborador") {
      if (nMonto < MINIMO) return setError(`El aporte mínimo es ${formatArs(MINIMO)}.`);
      if (nMonto > props.lugar) return setError(`Quedan ${formatArs(props.lugar)} por cubrir.`);
    }
    if (nombrePaso === "El contrato" && !leido)
      return setError("Marcá que leíste el contrato para seguir.");
    setPaso((p) => p + 1);
  };

  const firmar = async () => {
    if (enviando) return;
    setError(null);
    if (codigo !== enviado) return setError("El código no coincide. Fijate en el mensaje de arriba.");
    const f = new FormData();
    f.set("proyectoId", proyecto.id);
    f.set("leido", "si");
    f.set("codigo", codigo);
    if (rol === "colaborador") f.set("monto", String(nMonto));
    setEnviando(true);
    const r = await (rol === "colaborador" ? participar(f) : firmarFideicomisoDelProyecto(f)).catch(
      () => null,
    );
    setEnviando(false);
    if (!r || !r.ok) return setError(r?.error ?? "No pudimos guardar la firma. Probá de nuevo.");
    const datos = r as { orden?: string; monto?: number };
    setListo({ orden: datos.orden, monto: datos.monto });
  };

  // Ya firmado antes de entrar. Si se acaba de firmar, manda la pantalla de
  // abajo aunque el servidor ya lo sepa.
  if (props.rol === "productor" && props.firmado && !listo) {
    return (
      <section className="rounded-2xl border border-borde bg-superficie p-5">
        <p className="text-base">
          Lo firmaste el {props.firmado.fecha}. {props.firmado.version}.
        </p>
        <p className="codigo mt-2 break-all text-sm text-tinta-suave">Huella {props.firmado.hash}</p>
        <BotonLink variante="secundario" href={`/proyectos/${proyecto.id}`} className="mt-4 min-h-12">
          Volver al proyecto
        </BotonLink>
      </section>
    );
  }

  if (listo) {
    return (
      <section className="rounded-2xl border border-borde bg-superficie p-5 sm:p-6">
        <h2 ref={titulo} tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">
          {rol === "colaborador" ? "Firmaste. Falta la transferencia" : "Firmaste el contrato"}
        </h2>
        {listo.orden ? (
          <>
            <p className="mt-2 text-base text-tinta-suave">
              Transferí {formatArs(listo.monto ?? 0)} con el número de orden como referencia. Tu
              aporte figura pendiente hasta que el banco lo acredite.
            </p>
            <dl className="mt-4 space-y-2 rounded-xl bg-superficie-2 p-4 text-base">
              <Fila etiqueta="Número de orden" valor={listo.orden} codigo />
              <Fila etiqueta="Titular" valor={`${contrato.fiduciario}, cuenta del proyecto`} />
              <Fila etiqueta="CBU" valor="0000000000000000000000" codigo />
              <Fila etiqueta="Importe" valor={formatArs(listo.monto ?? 0)} />
            </dl>
            <p className="mt-3 text-sm text-tinta-suave">
              La cuenta es de demostración. Cada proyecto tiene la suya, a nombre del fiduciario.
            </p>
            <BotonLink href="/colaborador/cartera" className="mt-5 min-h-12 w-full sm:w-auto">
              Ver mi cartera
            </BotonLink>
          </>
        ) : (
          <>
            <p className="mt-2 text-base text-tinta-suave">
              Quedó registrado con la versión y la fecha. Cuando Guardian termine de revisar los
              papeles, el proyecto se publica con este contrato.
            </p>
            <BotonLink href={`/proyectos/${proyecto.id}`} className="mt-5 min-h-12 w-full sm:w-auto">
              Volver al proyecto
            </BotonLink>
          </>
        )}
      </section>
    );
  }

  const estimado = props.rol === "colaborador" && nMonto >= MINIMO
    ? simularColaborador(proyecto.sistemaProductivo, nMonto, props.precios)
    : null;

  return (
    <div>
      <div className="mb-4">
        <div className="h-1.5 overflow-hidden rounded-full bg-borde" aria-hidden="true">
          <div
            className="h-full rounded-full bg-marca transition-[width]"
            style={{ width: `${((paso + 1) / pasos.length) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-base text-tinta-suave">
          Paso {paso + 1} de {pasos.length} · {nombrePaso}
        </p>
      </div>

      <section className="rounded-2xl border border-borde bg-superficie p-5 sm:p-6">
        <h2 ref={titulo} tabIndex={-1} className="text-xl font-semibold tracking-tight outline-none">
          {
            {
              Cuánto: "¿Cuánto querés aportar?",
              "Quién administra": "Quién administra el proyecto",
              "El contrato": "Leé el contrato",
              Firma: "Firmá con el código",
            }[nombrePaso]
          }
        </h2>

        {nombrePaso === "Cuánto" && props.rol === "colaborador" ? (
          <div className="mt-4 space-y-4">
            <Campo
              etiqueta="Aporte en pesos"
              ayuda={`Desde ${formatArs(MINIMO)}. Quedan ${formatArs(props.lugar)} por cubrir.`}
              inputMode="numeric"
              className="tabular"
              value={nMonto ? formatNum(nMonto) : ""}
              onChange={(e) => setMonto(soloDigitos(e.target.value).slice(0, 12))}
            />
            {estimado ? (
              <div className="rounded-xl bg-marca-suave p-4">
                <p className="text-sm text-tinta-suave">
                  Estimado para un ciclo {MODELOS[proyecto.sistemaProductivo].nombre.toLowerCase()} de{" "}
                  {estimado.dias} días
                </p>
                <p className="tabular text-2xl font-semibold">{formatArs(estimado.ganancia)}</p>
                <p className="text-sm text-tinta-suave">
                  Después de comisiones e impuestos{props.precios ? ", con el precio del kilo de hoy" : ""}. Es una
                  estimación, no una promesa.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}

        {nombrePaso === "Quién administra" ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-borde p-4">
              <p className="text-lg font-semibold">{contrato.fiduciario}</p>
              <p className="text-sm text-tinta-suave">Fiduciario del proyecto · dato de demostración</p>
              <p className="mt-3 text-base">{FIDUCIARIO.descripcion}</p>
            </div>
            <div>
              <h3 className="font-semibold">Qué hace</h3>
              <ul className="mt-2 space-y-2">
                {FIDUCIARIO.hace.map((h) => (
                  <li key={h} className="flex gap-2 text-base">
                    <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-marca" />
                    {h}
                  </li>
                ))}
              </ul>
            </div>
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-superficie-2 p-4">
                <dt className="text-sm text-tinta-suave">Qué no hace</dt>
                <dd className="text-base">{FIDUCIARIO.noHace}</dd>
              </div>
              <div className="rounded-xl bg-superficie-2 p-4">
                <dt className="text-sm text-tinta-suave">Cuánto cobra</dt>
                <dd className="text-base">{FIDUCIARIO.cobra}</dd>
              </div>
            </dl>
            <p className="text-sm text-tinta-suave">
              Guardian conecta a las partes y verifica los papeles. No toca el dinero.
            </p>
          </div>
        ) : null}

        {nombrePaso === "El contrato" ? (
          <div className="mt-4">
            <p className="text-sm text-tinta-suave">
              {contrato.titulo} · {contrato.version}
            </p>
            <ol className="mt-3 divide-y divide-borde rounded-xl border border-borde">
              {contrato.clausulas.map((c, i) => (
                <li key={c.titulo} className="px-4 py-3">
                  <p className="font-semibold">
                    {i + 1}. {c.titulo}
                  </p>
                  <p className="mt-0.5 text-base">{c.texto}</p>
                </li>
              ))}
            </ol>
            <label className="mt-4 flex min-h-12 items-start gap-3">
              <input
                type="checkbox"
                checked={leido}
                onChange={(e) => setLeido(e.target.checked)}
                className="mt-1 size-5 shrink-0 accent-[var(--marca)]"
              />
              <span className="text-base">Leí el contrato y estoy de acuerdo.</span>
            </label>
          </div>
        ) : null}

        {nombrePaso === "Firma" ? (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-borde bg-superficie-2 p-4" aria-live="polite">
              <p className="text-sm text-tinta-suave">Mensaje de Guardian (simulado)</p>
              <p className="mt-1 text-base">
                Tu código para firmar es <span className="codigo text-lg font-semibold">{enviado}</span>.
                No se lo pases a nadie.
              </p>
            </div>
            <Campo
              etiqueta="Escribí el código"
              inputMode="numeric"
              autoComplete="one-time-code"
              className="tabular tracking-[0.3em]"
              value={codigo}
              onChange={(e) => setCodigo(soloDigitos(e.target.value).slice(0, 6))}
            />
            <p className="text-sm text-tinta-suave">
              Al firmar queda registrado qué versión firmaste, la fecha y una huella del texto.
            </p>
          </div>
        ) : null}

        <p className="mt-4 min-h-5 text-sm font-medium text-error" role="alert">
          {error ?? ""}
        </p>

        <div className="mt-2 flex items-center justify-between gap-3 border-t border-borde pt-4">
          {paso > 0 ? (
            <Boton variante="secundario" className="min-h-12" onClick={() => setPaso((p) => p - 1)}>
              Atrás
            </Boton>
          ) : (
            <BotonLink variante="secundario" className="min-h-12" href={`/proyectos/${proyecto.id}`}>
              Cancelar
            </BotonLink>
          )}
          {nombrePaso === "Firma" ? (
            <Boton className="min-h-12" onClick={firmar} aria-disabled={enviando}>
              {enviando ? "Firmando…" : "Firmar"}
            </Boton>
          ) : (
            <Boton className="min-h-12" onClick={siguiente}>
              Siguiente
            </Boton>
          )}
        </div>
      </section>
    </div>
  );
}

function Fila({ etiqueta, valor, codigo = false }: { etiqueta: string; valor: string; codigo?: boolean }) {
  return (
    <div className="flex flex-wrap justify-between gap-x-4">
      <dt className="text-tinta-suave">{etiqueta}</dt>
      <dd className={codigo ? "codigo" : "tabular"}>{valor}</dd>
    </div>
  );
}
