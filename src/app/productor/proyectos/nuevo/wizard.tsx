"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { EnviadoAValidacion } from "@/components/enviado-a-validacion";
import {
  SlotDocumento,
  leerArchivo,
  type EstadoCarga,
} from "@/components/subir-documento";
import {
  Campo,
  CampoLargo,
  GrupoOpciones,
  Seleccion,
} from "@/components/ui/campos";
import { Aviso, Boton } from "@/components/ui/primitivos";
import {
  CAMPOS_FICHA,
  type CampoFicha,
  type ClaveFicha,
  type OpcionGarantia,
} from "@/lib/ficha";
import {
  DOCUMENTO_LABEL,
  documentosRequeridos,
  formatArs,
  formatNum,
  formatPct,
} from "@/lib/format";
import { CICLOS, SISTEMAS_EN_ORDEN } from "@/lib/ciclos";
import type {
  Modalidad,
  SistemaProductivo,
  TipoDocumento,
  TipoPosesion,
} from "@/lib/types";

/** El id del control de un campo declarado, para poder darle el foco de afuera. */
const idDeCampo = (clave: ClaveFicha) => `alta-${clave}`;

/** Lo mínimo para poder enviar. El botón nombra lo que falta. */
const OBLIGATORIOS: ClaveFicha[] = [
  "cabezas",
  "pesoEntradaKg",
  "montoObjetivoArs",
];

/**
 * El borrador tiene una clave por cada campo de `CAMPOS_FICHA`, más lo que no es
 * un dato declarado sino una elección de estructura (destino, posesión, sistema,
 * seguro). Los campos declarados se dibujan desde esa lista y no a mano, así el
 * alta pide exactamente lo mismo que después muestra la ficha del proyecto.
 */
type Borrador = Record<ClaveFicha, string> & {
  modalidad: Modalidad;
  /**
   * Lo que pide el plan de operaciones según si el lote ya existe. Todavía no son campos
   * del proyecto: viven en el borrador del alta hasta que haya backend que los
   * guarde, y están anotados en el backlog.
   */
  vendedor: string;
  establecimientoReceptor: string;
  proveedores: string;
  calendario: string;
  tipoPosesion: TipoPosesion;
  sistemaProductivo: SistemaProductivo;
  tieneSeguro: boolean;
  usos: string[];
};

const INICIAL: Borrador = {
  modalidad: "compra_engorde",
  vendedor: "",
  establecimientoReceptor: "",
  proveedores: "",
  calendario: "Por hito",
  tipoPosesion: "existencia_comprobada",
  sistemaProductivo: "corral",
  cabezas: "",
  categoria: "Novillito",
  raza: "Angus",
  pesoEntradaKg: "",
  destinoDetalle: "",
  montoObjetivoArs: "",
  plazoDias: String(CICLOS.corral.plazoDias),
  plazoCobroDias: "30",
  garantiaId: "",
  tieneSeguro: false,
  usos: ["Ración", "Sanidad", "Mano de obra"],
};

/**
 * Los campos declarados de un grupo, dibujados desde `CAMPOS_FICHA`. Es el mismo
 * recorrido que hace la ficha técnica de un proyecto ya creado.
 */
function CamposDeFicha({
  grupo,
  b,
  set,
  garantias = [],
  huecos = [],
  sinAyuda = false,
}: {
  grupo: CampoFicha["grupo"];
  b: Borrador;
  set: <K extends keyof Borrador>(k: K, v: Borrador[K]) => void;
  garantias?: OpcionGarantia[];
  /** Los campos que el último intento de avanzar encontró vacíos. */
  huecos?: ClaveFicha[];
  /** En una pantalla compacta la ayuda sobra: el campo se explica solo. */
  sinAyuda?: boolean;
}) {
  return (
    <>
      {CAMPOS_FICHA.filter((c) => c.grupo === grupo).map((c) => {
        const etiqueta = c.sufijo ? `${c.etiqueta} (${c.sufijo})` : c.etiqueta;
        const id = idDeCampo(c.clave);
        const error = huecos.includes(c.clave)
          ? "Falta completar este dato."
          : undefined;

        if (c.tipo === "garantia") {
          return (
            <Seleccion
              key={c.clave}
              id={id}
              error={error}
              etiqueta={etiqueta}
              ayuda={sinAyuda ? undefined : c.ayuda}
              opciones={[
                { valor: "", label: "Elegí una garantía" },
                ...garantias.map((g) => ({
                  valor: g.id,
                  label: g.disponible ? g.label : `${g.label} — sin cupo`,
                  disabled: !g.disponible,
                })),
              ]}
              value={b[c.clave]}
              onChange={(e) => set(c.clave, e.target.value)}
            />
          );
        }

        if (c.opciones) {
          return (
            <Seleccion
              key={c.clave}
              id={id}
              error={error}
              etiqueta={etiqueta}
              ayuda={sinAyuda ? undefined : c.ayuda}
              opciones={["", ...c.opciones]}
              value={b[c.clave]}
              onChange={(e) => set(c.clave, e.target.value)}
            />
          );
        }

        if (c.tipo === "parrafo") {
          return (
            <div key={c.clave} className="sm:col-span-2">
              <CampoLargo
                id={id}
                error={error}
                etiqueta={etiqueta}
                ayuda={sinAyuda ? undefined : c.ayuda}
                value={b[c.clave]}
                onChange={(e) => set(c.clave, e.target.value)}
              />
            </div>
          );
        }

        return (
          <Campo
            key={c.clave}
            id={id}
            error={error}
            etiqueta={etiqueta}
            ayuda={
              sinAyuda
                ? undefined
                : (c.ayuda ?? (c.tipo === "moneda" ? "En pesos." : undefined))
            }
            inputMode={c.tipo === "texto" ? undefined : "numeric"}
            className="tabular"
            value={b[c.clave]}
            onChange={(e) => set(c.clave, e.target.value)}
          />
        );
      })}
    </>
  );
}

/** La pregunta de si los animales ya existen, en palabras del campo. Define qué papeles se piden. */
const TENENCIA: { valor: TipoPosesion; titulo: string }[] = [
  { valor: "existencia_comprobada", titulo: "Sí, ya los tengo" },
  { valor: "promesa_inversion", titulo: "No, los tengo que comprar" },
  { valor: "hibrido", titulo: "Una parte sí y otra la compro" },
];

/** En qué se puede usar lo que se junta. Se elige tocando, sin escribir. */
const USOS = [
  "Compra de hacienda",
  "Ración",
  "Sanidad",
  "Mano de obra",
  "Sales minerales",
  "Flete a faena",
] as const;

/** Un bloque de la pantalla: título corto y su contenido, sin adornos. */
function Bloque({
  titulo,
  children,
  id,
}: {
  titulo: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-2xl border border-borde bg-superficie p-4"
    >
      <h2 className="text-base font-semibold tracking-tight">{titulo}</h2>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/**
 * Publicar un proyecto, en una sola pantalla. Antes eran cuatro pasos y había
 * que desplazar mucho: acá todo está a la vista, en bloques chicos, y los papeles
 * que se piden cambian solos según si los animales ya son del productor.
 */
export function WizardPublicacion({
  garantias,
}: {
  garantias: OpcionGarantia[];
}) {
  const [b, setB] = useState<Borrador>(INICIAL);
  const [cargas, setCargas] = useState<Record<string, EstadoCarga>>({});
  const [enviado, setEnviado] = useState(false);
  const [huecos, setHuecos] = useState<ClaveFicha[]>([]);
  const [faltanDocs, setFaltanDocs] = useState(false);
  const [opciones, setOpciones] = useState(false);

  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) =>
    setB((prev) => ({ ...prev, [k]: v }));

  const requeridos = useMemo(
    () => documentosRequeridos(b.tipoPosesion),
    [b.tipoPosesion],
  );

  const cabezasNum = Number(b.cabezas) || 0;
  const monto = Number(b.montoObjetivoArs) || 0;
  const porCabeza = cabezasNum > 0 ? monto / cabezasNum : 0;
  const comprando = b.tipoPosesion !== "existencia_comprobada";
  const completos = requeridos.filter(
    (t) => cargas[t]?.fase === "listo",
  ).length;

  const discrepancias = requeridos
    .map((t) => {
      const carga = cargas[t];
      if (carga?.fase !== "listo") return null;
      const det = carga.lectura.cabezasDetectadas;
      if (det === undefined || det === cabezasNum) return null;
      return { tipo: t, declarado: cabezasNum, extraido: det };
    })
    .filter(
      (d): d is { tipo: TipoDocumento; declarado: number; extraido: number } =>
        Boolean(d),
    );

  const alternar = (uso: string) =>
    set(
      "usos",
      b.usos.includes(uso) ? b.usos.filter((u) => u !== uso) : [...b.usos, uso],
    );

  /**
   * El botón nunca está gris. Se aprieta, y si falta algo el foco cae en el
   * primer dato vacío con el error escrito al lado.
   */
  const enviar = () => {
    const pendientes = OBLIGATORIOS.filter(
      (c) => b[c].trim() === "" || Number(b[c]) === 0,
    );
    setHuecos(pendientes);
    const sinSubir = completos < requeridos.length;
    setFaltanDocs(sinSubir);
    if (pendientes.length > 0) {
      document.getElementById(idDeCampo(pendientes[0]))?.focus();
      return;
    }
    if (sinSubir || discrepancias.length > 0) {
      document
        .getElementById("documentacion-alta")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setEnviado(true);
  };

  return (
    <div className="space-y-3">
      {/* Arriba, lo esencial: los animales y cuánto necesitás, y si ya son tuyos. */}
      <div className="grid gap-3 lg:grid-cols-[2fr_1fr]">
        <Bloque titulo="¿Qué animales vas a engordar y cuánto necesitás?">
          <div className="grid gap-x-3 gap-y-2 sm:grid-cols-3">
            <CamposDeFicha
              grupo="El lote"
              b={b}
              set={set}
              huecos={huecos}
              sinAyuda
            />
            <div>
              <Campo
                id={idDeCampo("montoObjetivoArs")}
                etiqueta="Monto que necesitás ($)"
                inputMode="numeric"
                className="tabular"
                placeholder="Ej.: 45000000…"
                error={
                  huecos.includes("montoObjetivoArs")
                    ? "Falta completar este dato."
                    : undefined
                }
                value={b.montoObjetivoArs}
                onChange={(e) => set("montoObjetivoArs", e.target.value)}
              />
              {porCabeza > 0 ? (
                <p className="mt-1 text-sm text-tinta-suave">
                  Unos {formatArs(Math.round(porCabeza))} por animal.
                </p>
              ) : null}
            </div>
          </div>
        </Bloque>

        <Bloque titulo="¿Los animales ya son tuyos?">
          <GrupoOpciones
            etiqueta="¿Los animales ya son tuyos?"
            className="space-y-2"
            valor={b.tipoPosesion}
            onCambio={(v) => set("tipoPosesion", v)}
            opciones={TENENCIA}
            compacto
          />
        </Bloque>
      </div>

      <Bloque titulo="¿Cómo los vas a engordar?">
        <GrupoOpciones
          etiqueta="Tipo de ciclo"
          className="grid gap-3 md:grid-cols-3"
          valor={b.sistemaProductivo}
          onCambio={(v) => {
            set("sistemaProductivo", v);
            set("plazoDias", String(CICLOS[v].plazoDias));
          }}
          opciones={SISTEMAS_EN_ORDEN.map((k) => ({
            valor: k,
            titulo: `${CICLOS[k].nombre} · ${CICLOS[k].plazoDias} días`,
            descripcion: `Productor ${formatPct(CICLOS[k].productorPct)} · colaboradores ${formatPct(CICLOS[k].colaboradoresPct)}. Rentabilidad anual estimada para el productor: ${formatPct(CICLOS[k].rentabilidadAnualProductorPct)}.`,
          }))}
          compacto
        />
      </Bloque>

      <section className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-borde bg-superficie px-4 py-3">
        <h2 className="text-base font-semibold tracking-tight">
          ¿En qué lo vas a usar?
        </h2>
        <ul className="flex flex-wrap gap-2" aria-label="En qué se usa">
          {USOS.map((u) => {
            const activo = b.usos.includes(u);
            return (
              <li key={u}>
                <button
                  type="button"
                  aria-pressed={activo}
                  onClick={() => alternar(u)}
                  className={`min-h-11 rounded-full border px-4 text-sm font-medium transition-colors ${
                    activo
                      ? "border-marca bg-marca text-marca-contraste"
                      : "border-borde-fuerte bg-superficie text-tinta hover:border-marca hover:bg-marca-suave"
                  }`}
                >
                  {u}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Bloque
        titulo={`Tus papeles · ${completos} de ${requeridos.length} subidos`}
        id="documentacion-alta"
      >
        <div className="grid gap-3 md:grid-cols-3">
          {requeridos.map((tipo) => (
            <SlotDocumento
              key={tipo}
              tipo={tipo}
              estado={cargas[tipo] ?? { fase: "vacio" }}
              cabezas={cabezasNum}
              onArchivo={(nombre) =>
                leerArchivo(tipo, nombre, cabezasNum, (e) =>
                  setCargas((prev) => ({ ...prev, [tipo]: e })),
                )
              }
            />
          ))}
        </div>

        {discrepancias.length > 0 ? (
          <div className="mt-3">
            <Aviso
              tono="alerta"
              titulo={`${discrepancias.length === 1 ? "Una diferencia" : `${discrepancias.length} diferencias`} entre lo que cargaste y tus papeles`}
            >
              {discrepancias.map((d) => (
                <span key={d.tipo} className="block">
                  {DOCUMENTO_LABEL[d.tipo]}: cargaste {formatNum(d.declarado)}{" "}
                  cabezas y el documento ampara {formatNum(d.extraido)}.
                </span>
              ))}
            </Aviso>
          </div>
        ) : null}
      </Bloque>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Boton variante="sutil" onClick={() => setOpciones(true)}>
          Más opciones
        </Boton>
        <p className="flex-1 text-right text-sm text-alerta" role="alert">
          {huecos.length > 0
            ? `${huecos.length === 1 ? "Falta un dato: " : `Faltan ${huecos.length} datos: `}${huecos
                .map(
                  (c) => CAMPOS_FICHA.find((x) => x.clave === c)?.etiqueta ?? c,
                )
                .join(", ")}.`
            : faltanDocs && completos < requeridos.length
              ? `Faltan ${requeridos.length - completos} de ${requeridos.length} documentos.`
              : discrepancias.length > 0
                ? "Resolvé las diferencias antes de enviar el proyecto."
                : ""}
        </p>
        <Boton onClick={enviar}>Enviar a validación</Boton>
      </div>

      <Modal
        abierto={opciones}
        titulo="Más opciones"
        onCerrar={() => setOpciones(false)}
        pie={<Boton onClick={() => setOpciones(false)}>Listo</Boton>}
      >
        <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2">
          {comprando ? (
            <>
              <Campo
                etiqueta="¿Quién te vende la hacienda?"
                value={b.vendedor}
                onChange={(e) => set("vendedor", e.target.value)}
              />
              <Campo
                etiqueta="¿A qué campo entra el lote?"
                value={b.establecimientoReceptor}
                onChange={(e) => set("establecimientoReceptor", e.target.value)}
              />
            </>
          ) : (
            <Campo
              etiqueta="¿A quién le comprás ración y sanidad?"
              value={b.proveedores}
              onChange={(e) => set("proveedores", e.target.value)}
            />
          )}
          {garantias.length > 0 ? (
            <Seleccion
              etiqueta="Garantía que ofrecés"
              opciones={[
                { valor: "", label: "Ninguna por ahora" },
                ...garantias.map((g) => ({
                  valor: g.id,
                  label: g.disponible ? g.label : `${g.label} — sin cupo`,
                  disabled: !g.disponible,
                })),
              ]}
              value={b.garantiaId}
              onChange={(e) => set("garantiaId", e.target.value)}
            />
          ) : null}
          <div className="sm:col-span-2">
            <CampoLargo
              etiqueta="Algo más que quieras contar"
              value={b.destinoDetalle}
              onChange={(e) => set("destinoDetalle", e.target.value)}
            />
          </div>
          <label className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={b.tieneSeguro}
              onChange={(e) => set("tieneSeguro", e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--marca)]"
            />
            <span className="text-sm">
              Tengo seguro de mortandad sobre el lote
            </span>
          </label>
        </div>
      </Modal>

      <EnviadoAValidacion
        abierto={enviado}
        cabezas={cabezasNum}
        documentos={completos}
        onCerrar={() => setEnviado(false)}
      />
    </div>
  );
}
