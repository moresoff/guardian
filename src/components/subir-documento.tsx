"use client";

import { useRef } from "react";
import { Badge, Boton } from "@/components/ui/primitivos";
import { DOCUMENTO_LABEL } from "@/lib/format";
import { ACCEPT, revisarArchivo } from "@/lib/archivos";
import { simularLectura, type Lectura } from "@/lib/lectura";
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
export type { Lectura } from "@/lib/lectura";
export { simularLectura } from "@/lib/lectura";

export type EstadoCarga =
  | { fase: "vacio" }
  | { fase: "procesando"; archivo: string; file?: File }
  | { fase: "listo"; archivo: string; lectura: Lectura; file?: File }
  | { fase: "rechazado"; archivo: string; motivo: string };

/**
 * Revisa el archivo, arranca la lectura simulada y avisa cuando termina. Un
 * archivo que no sirve (vacío, muy pesado o de otro tipo) no se lee: se dice por
 * qué, y se puede elegir otro. El servidor vuelve a revisarlo al presentar.
 */
export function leerArchivo(
  tipo: TipoDocumento,
  file: File,
  cabezas: number,
  onEstado: (e: EstadoCarga) => void,
) {
  const motivo = revisarArchivo(file);
  if (motivo) {
    onEstado({ fase: "rechazado", archivo: file.name, motivo });
    return;
  }
  onEstado({ fase: "procesando", archivo: file.name, file });
  setTimeout(() => {
    onEstado({
      fase: "listo",
      archivo: file.name,
      file,
      lectura: simularLectura(tipo, cabezas),
    });
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
  onArchivo: (archivo: File) => void;
  obligatorio?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const discrepa =
    estado.fase === "listo" &&
    estado.lectura.cabezasDetectadas !== undefined &&
    estado.lectura.cabezasDetectadas !== cabezas;

  return (
    <div
      className={`rounded-xl border p-4 ${
        discrepa || estado.fase === "rechazado"
          ? "border-alerta/30 bg-alerta-suave"
          : "border-borde"
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
          {estado.fase === "rechazado" ? <Badge tono="alerta">No sirve</Badge> : null}
          {estado.fase === "listo" ? (
            <Badge tono={discrepa ? "alerta" : "ok"}>
              {discrepa ? "Revisar" : "Leído"}
            </Badge>
          ) : null}
          <input
            ref={input}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onArchivo(f);
              // Sin esto, volver a elegir el mismo archivo no dispara nada.
              e.target.value = "";
            }}
          />
          <Boton variante="secundario" onClick={() => input.current?.click()}>
            {estado.fase === "vacio" ? "Subir" : estado.fase === "rechazado" ? "Elegir otro" : "Reemplazar"}
          </Boton>
        </div>
      </div>

      {estado.fase === "rechazado" ? (
        <p className="mt-3 text-sm text-alerta" role="alert">
          {estado.motivo}
        </p>
      ) : null}

      {estado.fase === "listo" ? (
        <div className="mt-4 border-t border-borde pt-3">
          <p className="rotulo mb-2 text-tinta-tenue">Leído del documento</p>
          <dl className="grid gap-y-2.5">
            {estado.lectura.campos.map((c) => (
              <div key={c.etiqueta} className="min-w-0 text-sm">
                <dt className="text-tinta-suave">{c.etiqueta}</dt>
                <dd className="tabular break-words font-medium">{c.valor}</dd>
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
