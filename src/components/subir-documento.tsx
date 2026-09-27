"use client";

import { useRef } from "react";
import { Badge, Boton } from "@/components/ui/primitivos";
import { DOCUMENTO_LABEL, formatNum } from "@/lib/format";
import type { TipoDocumento } from "@/lib/types";

/**
 * La carga de un comprobante, con la lectura incluida. Es el mismo control en el
 * alta de un proyecto y en la ficha de un proyecto ya creado: el productor no
 * tiene por qué encontrarse con dos maneras distintas de subir el mismo papel.
 *
 * La lectura está simulada mientras no haya modelo de visión detrás; el estado
 * intermedio existe igual porque la lectura real va a demorar y la pantalla
 * tiene que saber decirlo.
 */
export interface Lectura {
  campos: { etiqueta: string; valor: string }[];
  cabezasDetectadas?: number;
  nota?: string;
}

export type EstadoCarga =
  | { fase: "vacio" }
  | { fase: "procesando"; archivo: string }
  | { fase: "listo"; archivo: string; lectura: Lectura };

export function simularLectura(tipo: TipoDocumento, cabezasDeclaradas: number): Lectura {
  switch (tipo) {
    case "renspa":
      return {
        campos: [
          { etiqueta: "RENSPA", valor: "01.036.0.01532/04" },
          { etiqueta: "Titular", valor: "TROPA AGROGANADERA S.A." },
          { etiqueta: "CUIT", valor: "30-71903430-2" },
        ],
      };
    case "dte":
      // El DT-e de ejemplo ampara 34 cabezas: si el proyecto declara otra cosa, se marca.
      return {
        campos: [
          { etiqueta: "Nº de DT-e", valor: "032636337-5" },
          { etiqueta: "CUVE", valor: "023 2636 3375" },
          { etiqueta: "Motivo", valor: "Faena" },
          { etiqueta: "Detalle", valor: "Vaquillona 20 · Novillito 14" },
        ],
        cabezasDetectadas: 34,
        nota: "El CUVE permite contrastar el documento contra SENASA.",
      };
    case "listado_rfid":
      return {
        campos: [
          { etiqueta: "Identificadores leídos", valor: formatNum(cabezasDeclaradas) },
          { etiqueta: "Duplicados internos", valor: "0" },
          { etiqueta: "Ya usados en otro proyecto", valor: "0" },
        ],
        cabezasDetectadas: cabezasDeclaradas,
      };
    case "boleto_compraventa":
      return {
        campos: [
          { etiqueta: "Vendedor", valor: "Consignataria del Centro S.A." },
          { etiqueta: "Cantidad", valor: formatNum(cabezasDeclaradas) },
          { etiqueta: "Fecha", valor: "15/09/2026" },
        ],
        cabezasDetectadas: cabezasDeclaradas,
      };
    default:
      return { campos: [{ etiqueta: "Documento", valor: "Leído" }] };
  }
}

/** Arranca la carga simulada y avisa cuando termina de leer. */
export function leerArchivo(
  tipo: TipoDocumento,
  nombre: string,
  cabezas: number,
  onEstado: (e: EstadoCarga) => void,
) {
  onEstado({ fase: "procesando", archivo: nombre });
  setTimeout(() => {
    onEstado({ fase: "listo", archivo: nombre, lectura: simularLectura(tipo, cabezas) });
  }, 900);
}

export function SlotDocumento({
  tipo,
  estado,
  cabezas,
  onArchivo,
  obligatorio = true,
}: {
  tipo: TipoDocumento;
  estado: EstadoCarga;
  cabezas: number;
  onArchivo: (nombre: string) => void;
  obligatorio?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const discrepa =
    estado.fase === "listo" &&
    estado.lectura.cabezasDetectadas !== undefined &&
    estado.lectura.cabezasDetectadas !== cabezas;

  return (
    <div
      className={`rounded-lg border p-4 ${
        discrepa ? "border-alerta/30 bg-alerta-suave" : "border-borde"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">{DOCUMENTO_LABEL[tipo]}</p>
          {estado.fase !== "vacio" ? (
            <p className="mt-0.5 text-sm text-tinta-suave">{estado.archivo}</p>
          ) : (
            <p className="mt-0.5 text-sm text-tinta-tenue">
              {obligatorio ? "Obligatorio" : "Opcional"}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {estado.fase === "procesando" ? <Badge tono="neutro">Leyendo…</Badge> : null}
          {estado.fase === "listo" ? (
            <Badge tono={discrepa ? "alerta" : "ok"}>
              {discrepa ? "Revisar" : "Leído"}
            </Badge>
          ) : null}
          <input
            ref={input}
            type="file"
            accept="application/pdf,image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onArchivo(f.name);
            }}
          />
          <Boton variante="secundario" onClick={() => input.current?.click()}>
            {estado.fase === "vacio" ? "Subir" : "Reemplazar"}
          </Boton>
        </div>
      </div>

      {estado.fase === "listo" ? (
        <div className="mt-4 border-t border-borde pt-3">
          <p className="rotulo mb-2 text-tinta-tenue">Leído del documento</p>
          <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
            {estado.lectura.campos.map((c) => (
              <div key={c.etiqueta} className="flex justify-between gap-3 text-sm">
                <dt className="text-tinta-suave">{c.etiqueta}</dt>
                <dd className="tabular font-medium">{c.valor}</dd>
              </div>
            ))}
          </dl>
          {estado.lectura.nota ? (
            <p className="mt-2 text-sm text-tinta-tenue">{estado.lectura.nota}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
