"use client";

import { useState } from "react";
import { SlotDocumento, type EstadoCarga } from "@/components/subir-documento";
import { revisarArchivo } from "@/lib/archivos";
import { subirDocumento } from "./acciones";
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
 * Subir documentación en un proyecto ya presentado, que son dos cosas distintas y
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
  proyectoId,
  faltantes,
  cabezas,
  publicado,
}: {
  proyectoId: string;
  /** Si los colaboradores ya lo ven: cambia por qué urge lo que falta. */
  publicado: boolean;
  faltantes: TipoDocumento[];
  cabezas: number;
}) {
  const [cargas, setCargas] = useState<Record<string, EstadoCarga>>({});
  const [extra, setExtra] = useState<TipoDocumento[]>([]);
  const [eligiendo, setEligiendo] = useState<TipoDocumento>("poliza_seguro");

  const poner = (tipo: TipoDocumento, e: EstadoCarga) =>
    setCargas((prev) => ({ ...prev, [tipo]: e }));

  // Acá el papel se guarda apenas se elige: el proyecto ya existe, no hay un
  // «enviar» al final que lo junte con otros.
  const subir = (tipo: TipoDocumento) => async (archivo: File) => {
    const motivo = revisarArchivo(archivo);
    if (motivo) return poner(tipo, { fase: "rechazado", archivo: archivo.name, motivo });
    poner(tipo, { fase: "procesando", archivo: archivo.name });
    const f = new FormData();
    f.set("proyectoId", proyectoId);
    f.set("tipo", tipo);
    f.set("archivo", archivo);
    const r = await subirDocumento(f).catch(() => null);
    if (!r || !r.ok)
      return poner(tipo, {
        fase: "rechazado",
        archivo: archivo.name,
        motivo: r?.error ?? "No pudimos guardar el archivo. Probá de nuevo.",
      });
    poner(tipo, { fase: "listo", archivo: archivo.name, lectura: r.lectura });
  };

  const disponibles = OPCIONALES.filter(
    (t) => !faltantes.includes(t) && !extra.includes(t),
  );

  return (
    <div className="space-y-6">
      {faltantes.length > 0 ? (
        <div>
          <Aviso
            tono="alerta"
            titulo={`${faltantes.length === 1 ? "Falta un papel obligatorio" : `Faltan ${faltantes.length} papeles obligatorios`}`}
          >
            {publicado
              ? "Los colaboradores ven el proyecto sin este respaldo, y Guardian no libera fondos de un lote que no está documentado."
              : "Sin ellos Guardian no puede terminar de revisar el proyecto."}
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

    </div>
  );
}
