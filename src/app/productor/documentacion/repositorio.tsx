"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { DocumentoCard } from "@/components/documento-card";
import { AutenticidadBadge } from "@/components/estados";
import { Campo, Seleccion } from "@/components/ui/campos";
import { Modal } from "@/components/ui/modal";
import { Aviso, Badge, Boton, Panel, Vacio } from "@/components/ui/primitivos";
import { DOCUMENTO_LABEL, formatFecha } from "@/lib/format";
import type { Discrepancia, Documento, TipoDocumento } from "@/lib/types";

export interface ArchivoRepo {
  documento: Documento;
  discrepancias: Discrepancia[];
}

export interface CarpetaRepo {
  id: string;
  titulo: string;
  /** La ficha del proyecto que agrupa estos documentos. La carpeta general no tiene. */
  href?: string;
  archivos: ArchivoRepo[];
}

const TIPOS: TipoDocumento[] = [
  "renspa",
  "dte",
  "romaneo",
  "boleto_compraventa",
  "listado_rfid",
  "poliza_seguro",
  "otro",
];

/**
 * El repositorio documental del productor: sus papeles agrupados por proyecto,
 * como carpetas que se abren.
 *
 * Antes la pantalla desplegaba las veintipico de tarjetas enteras, una abajo de
 * la otra: para mirar el romaneo de un ciclo había que pasar por los datos
 * leídos de todos los demás. Acá la lista dice qué documento es y en qué estado
 * quedó, y el detalle —lo que se extrajo, los controles aritméticos, las
 * discrepancias— se abre cuando se pide.
 *
 * El buscador y el filtro por tipo cortan a través de las carpetas: el productor
 * que busca "el DT-e de septiembre" no tiene por qué acordarse de en qué
 * proyecto lo subió.
 */
export function Repositorio({ carpetas }: { carpetas: CarpetaRepo[] }) {
  const [carpetaId, setCarpetaId] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [tipo, setTipo] = useState<TipoDocumento | "todos">("todos");
  const [abierto, setAbierto] = useState<ArchivoRepo | null>(null);
  const [subiendo, setSubiendo] = useState(false);

  const filtrando = busqueda.trim() !== "" || tipo !== "todos";
  const carpeta = carpetas.find((c) => c.id === carpetaId);

  const coincide = (a: ArchivoRepo) => {
    if (tipo !== "todos" && a.documento.tipo !== tipo) return false;
    const texto = busqueda.trim().toLowerCase();
    if (texto === "") return true;
    return (
      a.documento.nombreArchivo.toLowerCase().includes(texto) ||
      DOCUMENTO_LABEL[a.documento.tipo].toLowerCase().includes(texto)
    );
  };

  /** Lo que se está mirando: una carpeta abierta, o el resultado de filtrar. */
  const visibles = (carpeta ? [carpeta] : carpetas).flatMap((c) =>
    c.archivos.filter(coincide).map((a) => ({ archivo: a, carpeta: c })),
  );

  const total = carpetas.reduce((n, c) => n + c.archivos.length, 0);

  return (
    <section id="comprobantes" className="scroll-mt-24">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Mis documentos</h2>
          <p className="mt-1 max-w-2xl text-sm text-tinta-suave">
            {total} archivos en {carpetas.length}{" "}
            {carpetas.length === 1 ? "carpeta" : "carpetas"}. Guardian los lee para
            extraer los datos y marcar inconsistencias; el original queda siempre como
            está.
          </p>
        </div>
        <Boton onClick={() => setSubiendo(true)}>Subir documento</Boton>
      </div>

      <Panel className="mb-4 p-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_14rem]">
          <Campo
            etiqueta="Buscar"
            type="search"
            placeholder="Nombre del archivo o tipo de documento"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <Seleccion
            etiqueta="Tipo de documento"
            opciones={[
              { valor: "todos", label: "Todos" },
              ...TIPOS.map((t) => ({ valor: t, label: DOCUMENTO_LABEL[t] })),
            ]}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoDocumento | "todos")}
          />
        </div>
      </Panel>

      <Migas
        carpeta={carpeta}
        filtrando={filtrando}
        cantidad={visibles.length}
        onVolver={() => setCarpetaId(null)}
      />

      {!carpeta && !filtrando ? (
        <ul className="grid gap-4 sm:grid-cols-2">
          {carpetas.map((c) => (
            <li key={c.id}>
              <FichaCarpeta carpeta={c} onAbrir={() => setCarpetaId(c.id)} />
            </li>
          ))}
        </ul>
      ) : visibles.length === 0 ? (
        <Vacio titulo="Ningún documento coincide">
          Probá con otro tipo de documento, o limpiá el buscador.
        </Vacio>
      ) : (
        <Panel className="overflow-hidden">
          <ul className="divide-y divide-borde">
            {visibles.map(({ archivo, carpeta: c }) => (
              <li key={archivo.documento.id}>
                <FilaArchivo
                  archivo={archivo}
                  carpeta={carpeta ? undefined : c.titulo}
                  onAbrir={() => setAbierto(archivo)}
                />
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Modal
        abierto={abierto !== null}
        titulo={abierto ? DOCUMENTO_LABEL[abierto.documento.tipo] : ""}
        onCerrar={() => setAbierto(null)}
        pie={
          <Boton variante="secundario" onClick={() => setAbierto(null)}>
            Cerrar
          </Boton>
        }
      >
        {abierto ? (
          <DocumentoCard
            documento={abierto.documento}
            discrepancias={abierto.discrepancias}
            conTitulo={false}
          />
        ) : null}
      </Modal>

      <FormularioSubida
        abierto={subiendo}
        carpetas={carpetas}
        carpetaActual={carpeta?.id}
        onCerrar={() => setSubiendo(false)}
      />
    </section>
  );
}

/** Dónde está parado el productor y cómo se sale de ahí. */
function Migas({
  carpeta,
  filtrando,
  cantidad,
  onVolver,
}: {
  carpeta?: CarpetaRepo;
  filtrando: boolean;
  cantidad: number;
  onVolver: () => void;
}) {
  if (!carpeta && !filtrando) return null;

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      <button
        type="button"
        onClick={onVolver}
        className="min-h-11 rounded-lg text-marca underline underline-offset-2 hover:text-marca-viva"
      >
        Todas las carpetas
      </button>
      {carpeta ? (
        <>
          <span aria-hidden className="text-tinta-tenue">
            /
          </span>
          <span className="font-medium">{carpeta.titulo}</span>
          {carpeta.href ? (
            <Link
              href={carpeta.href}
              className="text-tinta-suave underline underline-offset-2 hover:text-marca"
            >
              Ver el proyecto
            </Link>
          ) : null}
        </>
      ) : (
        <span className="text-tinta-suave">
          {cantidad} {cantidad === 1 ? "documento" : "documentos"} en todas las carpetas
        </span>
      )}
    </div>
  );
}

function FichaCarpeta({
  carpeta,
  onAbrir,
}: {
  carpeta: CarpetaRepo;
  onAbrir: () => void;
}) {
  const conDiscrepancias = carpeta.archivos.filter((a) =>
    a.discrepancias.some((d) => !d.resuelta),
  ).length;
  const sinVerificar = carpeta.archivos.filter(
    (a) => a.documento.estadoAutenticidad !== "verificada",
  ).length;

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="block h-full w-full rounded-xl border border-borde bg-superficie p-5 text-left shadow-[var(--sombra-baja)] transition-colors hover:border-borde-fuerte hover:bg-superficie-2"
    >
      <p className="font-medium">{carpeta.titulo}</p>
      <p className="mt-1 text-sm text-tinta-suave">
        {carpeta.archivos.length}{" "}
        {carpeta.archivos.length === 1 ? "documento" : "documentos"}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {conDiscrepancias > 0 ? (
          <Badge tono="alerta">
            {conDiscrepancias} con discrepancias
          </Badge>
        ) : null}
        {sinVerificar > 0 ? (
          <Badge tono="neutro">{sinVerificar} sin verificar</Badge>
        ) : (
          <Badge tono="ok">Autenticidad verificada</Badge>
        )}
      </div>
    </button>
  );
}

function FilaArchivo({
  archivo,
  carpeta,
  onAbrir,
}: {
  archivo: ArchivoRepo;
  /** El nombre de la carpeta, solo cuando la lista cruza varias. */
  carpeta?: string;
  onAbrir: () => void;
}) {
  const { documento } = archivo;
  const sinResolver = archivo.discrepancias.filter((d) => !d.resuelta).length;

  return (
    <button
      type="button"
      onClick={onAbrir}
      className="flex min-h-14 w-full flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3 text-left transition-colors hover:bg-superficie-2"
    >
      <span className="min-w-0">
        <span className="block font-medium">{DOCUMENTO_LABEL[documento.tipo]}</span>
        <span className="codigo mt-0.5 block truncate text-sm text-tinta-suave">
          {documento.nombreArchivo}
        </span>
        {carpeta ? (
          <span className="mt-0.5 block text-sm text-tinta-tenue">{carpeta}</span>
        ) : null}
      </span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {sinResolver > 0 ? (
          <Badge tono="alerta">
            {sinResolver} {sinResolver === 1 ? "discrepancia" : "discrepancias"}
          </Badge>
        ) : null}
        <AutenticidadBadge estado={documento.estadoAutenticidad} breve />
        <span className="tabular text-sm text-tinta-tenue">
          {formatFecha(documento.subidoAt)}
        </span>
      </span>
    </button>
  );
}

/**
 * Subir un papel suelto, fuera del alta de un proyecto. Es el caso del contrato,
 * el presupuesto o la factura: aparecen cuando aparecen y no tienen por qué
 * esperar a que haya un proyecto abierto.
 */
function FormularioSubida({
  abierto,
  carpetas,
  carpetaActual,
  onCerrar,
}: {
  abierto: boolean;
  carpetas: CarpetaRepo[];
  carpetaActual?: string;
  onCerrar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoDocumento>("renspa");
  const [destino, setDestino] = useState(carpetaActual ?? carpetas[0]?.id ?? "");
  const [archivo, setArchivo] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const cerrar = () => {
    setArchivo("");
    onCerrar();
  };

  return (
    <Modal
      abierto={abierto}
      titulo="Subir un documento"
      onCerrar={cerrar}
      pie={
        <>
          <Boton variante="secundario" onClick={cerrar}>
            Cancelar
          </Boton>
          <Boton disabled={archivo === ""} onClick={cerrar}>
            Subir y leer
          </Boton>
        </>
      }
    >
      <div className="space-y-5">
        <Seleccion
          etiqueta="Qué documento es"
          ayuda="Guardian lee cada tipo distinto: de esto depende qué datos busca adentro."
          opciones={TIPOS.map((t) => ({ valor: t, label: DOCUMENTO_LABEL[t] }))}
          value={tipo}
          onChange={(e) => setTipo(e.target.value as TipoDocumento)}
        />

        <Seleccion
          etiqueta="En qué carpeta va"
          opciones={carpetas.map((c) => ({ valor: c.id, label: c.titulo }))}
          value={destino}
          onChange={(e) => setDestino(e.target.value)}
        />

        <div>
          <p className="font-medium">El archivo</p>
          <p className="mt-0.5 text-sm text-tinta-suave">
            PDF o foto. Si es un escaneo sin capa de texto, se lee con visión y demora un
            poco más.
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              ref={input}
              type="file"
              accept="application/pdf,image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setArchivo(f.name);
              }}
            />
            <Boton variante="secundario" onClick={() => input.current?.click()}>
              {archivo === "" ? "Elegir archivo" : "Cambiar archivo"}
            </Boton>
            {archivo !== "" ? (
              <span className="codigo text-sm text-tinta-suave">{archivo}</span>
            ) : null}
          </div>
        </div>

        <Aviso titulo="El original no se toca">
          Guardian extrae los datos y deja el archivo como está, con su historial de
          revisiones. Si más adelante subís una versión nueva, la anterior queda.
        </Aviso>

        <p className="text-sm text-tinta-suave">
          <Badge tono="alerta">Prototipo</Badge>{" "}
          <span className="ml-1">
            Sin backend, el archivo no se guarda al cerrar la pantalla.
          </span>
        </p>
      </div>
    </Modal>
  );
}
