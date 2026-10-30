"use client";

import { useState } from "react";
import {
  SlotDocumento,
  leerArchivo,
  type EstadoCarga,
} from "@/components/subir-documento";
import { Aviso, Boton, TituloBloque } from "@/components/ui/primitivos";
import { Seleccion } from "@/components/ui/campos";
import { DOCUMENTO_LABEL } from "@/lib/format";
import type { TipoDocumento } from "@/lib/types";

const OPCIONALES: TipoDocumento[] = [
  "poliza_seguro",
  "boleto_compraventa",
  "dte",
  "romaneo",
  "listado_rfid",
  "otro",
];

/**
 * Subir documentación en un proyecto ya publicado, que son dos cosas distintas y
 * por eso están separadas:
 *
 * - **Lo que falta**: un documento obligatorio que no está. Hasta que entre, el
 *   proyecto está publicado con un agujero, así que se avisa en rojo y se lista
 *   uno por uno.
 * - **Respaldo adicional**: una póliza, un DT-e de un movimiento nuevo, el
 *   romaneo cuando cierra el ciclo. Nada de esto es obligatorio, pero el ciclo
 *   dura meses y aparecen papeles después de publicar. Sin esto, el productor
 *   tendría que esperar a que alguien se lo pida.
 */
export function SubirRespaldo({
  faltantes,
  cabezas,
}: {
  faltantes: TipoDocumento[];
  cabezas: number;
}) {
  const [cargas, setCargas] = useState<Record<string, EstadoCarga>>({});
  const [extra, setExtra] = useState<TipoDocumento[]>([]);
  const [eligiendo, setEligiendo] = useState<TipoDocumento>("poliza_seguro");

  const subir = (tipo: TipoDocumento) => (nombre: string) =>
    leerArchivo(tipo, nombre, cabezas, (e) =>
      setCargas((prev) => ({ ...prev, [tipo]: e })),
    );

  const disponibles = OPCIONALES.filter(
    (t) => !faltantes.includes(t) && !extra.includes(t),
  );

  return (
    <div className="space-y-6">
      {faltantes.length > 0 ? (
        <div>
          <Aviso
            tono="alerta"
            titulo={`${faltantes.length === 1 ? "Falta un documento obligatorio" : `Faltan ${faltantes.length} documentos obligatorios`}`}
          >
            El proyecto está publicado y los colaboradores lo están viendo sin este respaldo.
            Subilo cuanto antes: Guardian no libera fondos de un lote que no está documentado.
          </Aviso>
          <div className="mt-4 space-y-4">
            {faltantes.map((tipo) => (
              <SlotDocumento
                key={tipo}
                tipo={tipo}
                estado={cargas[tipo] ?? { fase: "vacio" }}
                cabezas={cabezas}
                obligatorio
                onArchivo={subir(tipo)}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <TituloBloque descripcion="Una póliza, el DT-e de un movimiento nuevo, el romaneo cuando cierre el ciclo. Cuanto más respaldo, menos preguntas del colaborador.">
          Sumar respaldo
        </TituloBloque>

        {extra.length > 0 ? (
          <div className="mb-4 space-y-4">
            {extra.map((tipo) => (
              <SlotDocumento
                key={tipo}
                tipo={tipo}
                estado={cargas[tipo] ?? { fase: "vacio" }}
                cabezas={cabezas}
                onArchivo={subir(tipo)}
              />
            ))}
          </div>
        ) : null}

        {disponibles.length > 0 ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[14rem] flex-1">
              <Seleccion
                etiqueta="Tipo de documento"
                opciones={disponibles.map((t) => DOCUMENTO_LABEL[t])}
                value={DOCUMENTO_LABEL[eligiendo] ?? ""}
                onChange={(e) => {
                  const clave = disponibles.find(
                    (t) => DOCUMENTO_LABEL[t] === e.target.value,
                  );
                  if (clave) setEligiendo(clave);
                }}
              />
            </div>
            <Boton
              variante="secundario"
              onClick={() => {
                const elegido = disponibles.includes(eligiendo)
                  ? eligiendo
                  : disponibles[0];
                if (elegido) setExtra((prev) => [...prev, elegido]);
              }}
            >
              Agregar
            </Boton>
          </div>
        ) : null}
      </div>

      <Aviso tono="alerta" titulo="Prototipo">
        Los archivos se leen en el navegador para mostrar el flujo. Todavía no se guardan
        en ningún lado: eso entra con el backend.
      </Aviso>
    </div>
  );
}
