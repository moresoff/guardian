"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

const PASOS = ["Tus animales", "Tenencia", "El ciclo", "Tus papeles"] as const;

const TITULOS = [
  "¿Qué animales vas a engordar y cuánto necesitás?",
  "¿Los animales ya son tuyos?",
  "¿Cómo los vas a engordar?",
  "Subí tus papeles",
] as const;

/**
 * Publicar un proyecto, de a un paso por vez: los animales y el monto, si ya son
 * del productor, el ciclo y los papeles. Cada paso es una sola pregunta, así no
 * se ve todo junto, y los papeles que se piden cambian solos según la tenencia.
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
  const [paso, setPaso] = useState(0);
  const titulo = useRef<HTMLHeadingElement>(null);
  const primeraVez = useRef(true);

  // Al cambiar de paso el foco va al título: con teclado o lector de pantalla
  // se entiende que cambió la pantalla, y se vuelve a ver desde arriba.
  useEffect(() => {
    if (primeraVez.current) {
      primeraVez.current = false;
      return;
    }
    titulo.current?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [paso]);

  const irA = (n: number) => {
    setHuecos([]);
    setPaso(n);
  };

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
   * Los papeles no frenan el envío: se pueden subir ahora o después, desde el
   * proyecto. Lo único obligatorio son los datos del primer paso.
   */
  const enviar = () => {
    const pendientes = OBLIGATORIOS.filter(
      (c) => b[c].trim() === "" || Number(b[c]) === 0,
    );
    if (pendientes.length > 0) {
      setHuecos(pendientes);
      irA(0);
      return;
    }
    setEnviado(true);
  };

  /** El primer paso no deja seguir con datos vacíos: el foco cae en el primero. */
  const siguiente = () => {
    if (paso === 0) {
      const pendientes = OBLIGATORIOS.filter(
        (c) => b[c].trim() === "" || Number(b[c]) === 0,
      );
      if (pendientes.length > 0) {
        setHuecos(pendientes);
        document.getElementById(idDeCampo(pendientes[0]))?.focus();
        return;
      }
    }
    irA(paso + 1);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-5">
        <ol className="flex gap-2" aria-label="Pasos para publicar">
          {PASOS.map((t, i) => (
            <li
              key={t}
              aria-current={i === paso ? "step" : undefined}
              className="flex-1"
            >
              <span
                className={`block h-1.5 rounded-full transition-colors ${
                  i <= paso ? "bg-marca" : "bg-borde"
                }`}
              />
              <span
                className={`mt-2 hidden text-sm sm:block ${
                  i === paso ? "font-medium text-tinta" : "text-tinta-suave"
                }`}
              >
                {i + 1}. {t}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-sm text-tinta-suave sm:hidden">
          Paso {paso + 1} de {PASOS.length} · {PASOS[paso]}
        </p>
      </div>

      <section className="rounded-2xl border border-borde bg-superficie p-5 shadow-[var(--sombra-baja)] sm:p-7">
        <h2
          ref={titulo}
          tabIndex={-1}
          className="text-xl font-semibold tracking-tight outline-none"
        >
          {TITULOS[paso]}
        </h2>

        {paso === 0 ? (
          <div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2">
            <CamposDeFicha
              grupo="El lote"
              b={b}
              set={set}
              huecos={huecos}
              sinAyuda
            />
            <div className="sm:col-span-2">
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
                <p className="mt-1.5 text-sm text-tinta-suave">
                  Unos {formatArs(Math.round(porCabeza))} por animal.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {paso === 1 ? (
          <div className="mt-5">
            <GrupoOpciones
              etiqueta="¿Los animales ya son tuyos?"
              className="space-y-3"
              valor={b.tipoPosesion}
              onCambio={(v) => set("tipoPosesion", v)}
              opciones={TENENCIA}
            />
            <p className="mt-4 text-sm text-tinta-suave">
              Según lo que elijas, en el último paso te pedimos unos papeles u otros.
            </p>
          </div>
        ) : null}

        {paso === 2 ? (
          <div className="mt-5 space-y-6">
            <GrupoOpciones
              etiqueta="Tipo de ciclo"
              className="space-y-3"
              valor={b.sistemaProductivo}
              onCambio={(v) => {
                set("sistemaProductivo", v);
                set("plazoDias", String(CICLOS[v].plazoDias));
              }}
              opciones={SISTEMAS_EN_ORDEN.map((k) => ({
                valor: k,
                titulo: `${CICLOS[k].nombre} · ${CICLOS[k].plazoDias} días`,
                descripcion: `Te queda el ${formatPct(CICLOS[k].productorPct)} del resultado de la venta. Rentabilidad anual estimada: ${formatPct(CICLOS[k].rentabilidadAnualProductorPct)}.`,
              }))}
            />

            <div>
              <h3 className="font-medium">¿En qué lo vas a usar?</h3>
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="En qué se usa">
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
            </div>
          </div>
        ) : null}

        {paso === 3 ? (
          <div className="mt-5" id="documentacion-alta">
            <p className="text-sm text-tinta-suave">
              {completos} de {requeridos.length} subidos. Podés enviarlo así y completar
              los papeles después; Guardian los lee y los cruza con lo que cargaste.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
              <div className="mt-4">
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

            <div className="mt-8 border-t border-borde pt-6">
              <h3 className="font-medium">Si querés, contá un poco más</h3>
              <p className="mt-1 text-sm text-tinta-suave">
                Nada de esto es obligatorio. Lo podés completar después.
              </p>
              <div className="mt-4 grid gap-x-4 gap-y-3 sm:grid-cols-2">
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
                <label className="flex min-h-11 items-center gap-3 sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={b.tieneSeguro}
                    onChange={(e) => set("tieneSeguro", e.target.checked)}
                    className="size-5 accent-[var(--marca)]"
                  />
                  <span>
                    Tengo seguro de mortandad sobre el lote
                  </span>
                </label>
              </div>
            </div>
          </div>
        ) : null}

        <p className="mt-5 min-h-5 text-sm text-alerta" role="alert">
          {huecos.length > 0
            ? `${huecos.length === 1 ? "Falta un dato: " : `Faltan ${huecos.length} datos: `}${huecos
                .map(
                  (c) => CAMPOS_FICHA.find((x) => x.clave === c)?.etiqueta ?? c,
                )
                .join(", ")}.`
            : ""}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-borde pt-5">
          {paso > 0 ? (
            <Boton variante="secundario" onClick={() => irA(paso - 1)}>
              Atrás
            </Boton>
          ) : (
            <span />
          )}
          {paso < PASOS.length - 1 ? (
            <Boton onClick={siguiente}>Siguiente</Boton>
          ) : (
            <Boton onClick={enviar}>Enviar a validación</Boton>
          )}
        </div>
      </section>


      <EnviadoAValidacion
        abierto={enviado}
        cabezas={cabezasNum}
        documentos={completos}
        onCerrar={() => setEnviado(false)}
      />
    </div>
  );
}
