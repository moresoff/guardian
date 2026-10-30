"use client";

import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { EnviadoAValidacion } from "@/components/enviado-a-validacion";
import {
  SlotDocumento,
  leerArchivo,
  type EstadoCarga,
} from "@/components/subir-documento";
import { Campo, CampoLargo, GrupoOpciones, Seleccion } from "@/components/ui/campos";
import {
  Aviso,
  Boton,
  Panel,
  Progreso,
} from "@/components/ui/primitivos";
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

/**
 * Lo que cada paso necesita para pasar al siguiente. Es una lista y no una
 * condición porque el botón tiene que poder nombrar lo que falta.
 */
const OBLIGATORIOS: Record<number, ClaveFicha[]> = {
  1: ["cabezas", "pesoEntradaKg", "pesoSalidaObjetivoKg"],
  2: ["montoObjetivoArs"],
};

/** Tres pasos, cada uno con una pregunta: qué animales, cómo y cuánto, y los papeles. */
const PASOS = [
  { n: 1, titulo: "Tus animales" },
  { n: 2, titulo: "El ciclo" },
  { n: 3, titulo: "Documentos" },
] as const;

/** La pregunta de si los animales ya existen, en palabras del campo. Define qué papeles se piden. */
const TENENCIA: { valor: TipoPosesion; titulo: string; descripcion: string }[] = [
  {
    valor: "existencia_comprobada",
    titulo: "Sí, ya los tengo",
    descripcion: "Los animales ya están en mi campo.",
  },
  {
    valor: "promesa_inversion",
    titulo: "No, los tengo que comprar",
    descripcion: "Todavía no los compré.",
  },
  {
    valor: "hibrido",
    titulo: "Una parte sí y otra la compro",
    descripcion: "Una parte ya está en mi campo y el resto lo compro.",
  },
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
  pesoSalidaObjetivoKg: "",
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
}: {
  grupo: CampoFicha["grupo"];
  b: Borrador;
  set: <K extends keyof Borrador>(k: K, v: Borrador[K]) => void;
  garantias?: OpcionGarantia[];
  /** Los campos que el último intento de avanzar encontró vacíos. */
  huecos?: ClaveFicha[];
}) {
  return (
    <>
      {CAMPOS_FICHA.filter((c) => c.grupo === grupo).map((c) => {
        const etiqueta = c.sufijo ? `${c.etiqueta} (${c.sufijo})` : c.etiqueta;
        const id = idDeCampo(c.clave);
        const error = huecos.includes(c.clave) ? "Falta completar este dato." : undefined;

        if (c.tipo === "garantia") {
          return (
            <Seleccion
              key={c.clave}
              id={id}
              error={error}
              etiqueta={etiqueta}
              ayuda={c.ayuda}
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
              ayuda={c.ayuda}
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
                ayuda={c.ayuda}
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
            ayuda={c.ayuda ?? (c.tipo === "moneda" ? "En pesos." : undefined)}
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

export function WizardPublicacion({ garantias }: { garantias: OpcionGarantia[] }) {
  const [paso, setPaso] = useState(1);
  const [b, setB] = useState<Borrador>(INICIAL);
  const [cargas, setCargas] = useState<Record<string, EstadoCarga>>({});

  const set = <K extends keyof Borrador>(k: K, v: Borrador[K]) =>
    setB((prev) => ({ ...prev, [k]: v }));

  const requeridos = useMemo(
    () => documentosRequeridos(b.tipoPosesion),
    [b.tipoPosesion],
  );

  const cabezasNum = Number(b.cabezas) || 0;
  const completos = requeridos.filter((t) => cargas[t]?.fase === "listo").length;

  const discrepancias = requeridos
    .map((t) => {
      const carga = cargas[t];
      if (carga?.fase !== "listo") return null;
      const det = carga.lectura.cabezasDetectadas;
      if (det === undefined || det === cabezasNum) return null;
      return { tipo: t, declarado: cabezasNum, extraido: det };
    })
    .filter((d): d is { tipo: TipoDocumento; declarado: number; extraido: number } =>
      Boolean(d),
    );

  const [enviado, setEnviado] = useState(false);
  /** Los huecos que encontró el último intento de avanzar. Vacío hasta el primero. */
  const [huecos, setHuecos] = useState<ClaveFicha[]>([]);
  const [faltanDocs, setFaltanDocs] = useState(false);

  const huecosDelPaso = (n: number): ClaveFicha[] =>
    (OBLIGATORIOS[n] ?? []).filter((c) => b[c].trim() === "" || Number(b[c]) === 0);

  /**
   * El botón nunca está gris. Se aprieta, y si falta algo el foco cae en el
   * primer campo vacío con el error escrito al lado: el productor ve qué le
   * falta en vez de adivinar por qué no lo dejan pasar.
   */
  const intentarAvanzar = () => {
    const pendientes = huecosDelPaso(paso);
    setHuecos(pendientes);
    if (pendientes.length > 0) {
      document.getElementById(idDeCampo(pendientes[0]))?.focus();
      return;
    }
    setPaso((p) => p + 1);
    window.scrollTo({ top: 0 });
  };

  const intentarEnviar = () => {
    const sinSubir = completos < requeridos.length;
    setFaltanDocs(sinSubir);
    if (sinSubir || discrepancias.length > 0) {
      document.getElementById("documentacion-alta")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setEnviado(true);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Dónde estoy: una barra partida en tres y el nombre del paso. */}
      <div className="flex gap-1.5" aria-hidden>
        {PASOS.map((p) => (
          <span
            key={p.n}
            className={`h-1.5 flex-1 rounded-full ${p.n <= paso ? "bg-marca" : "bg-borde"}`}
          />
        ))}
      </div>
      <p className="tabular mt-2 text-sm text-tinta-tenue" aria-live="polite">
        Paso {paso} de {PASOS.length} · {PASOS[paso - 1].titulo}
      </p>

      <Panel className="mt-4 rounded-3xl p-6 sm:p-8">
        {paso === 1 ? <Paso1 b={b} set={set} huecos={huecos} /> : null}
        {paso === 2 ? (
          <Paso2 b={b} set={set} cabezas={cabezasNum} garantias={garantias} huecos={huecos} />
        ) : null}
        {paso === 3 ? (
          <Paso3
            b={b}
            requeridos={requeridos}
            cargas={cargas}
            setCargas={setCargas}
            cabezas={cabezasNum}
            discrepancias={discrepancias}
          />
        ) : null}
      </Panel>

      <div className="mt-4 flex items-center justify-between gap-3">
        {paso > 1 ? (
          <Boton variante="secundario" onClick={() => setPaso((p) => p - 1)}>
            Atrás
          </Boton>
        ) : (
          <span />
        )}
        {paso < PASOS.length ? (
          <Boton onClick={intentarAvanzar}>Continuar</Boton>
        ) : (
          <Boton onClick={intentarEnviar}>Enviar a validación</Boton>
        )}
      </div>

      {huecos.length > 0 ? (
        <p className="mt-3 text-right text-sm text-alerta" role="alert">
          {huecos.length === 1 ? "Falta un dato: " : `Faltan ${huecos.length} datos: `}
          {huecos
            .map((c) => CAMPOS_FICHA.find((x) => x.clave === c)?.etiqueta ?? c)
            .join(", ")}
          .
        </p>
      ) : null}

      {paso === 3 && faltanDocs ? (
        <p className="mt-3 text-right text-sm text-alerta" role="alert">
          Faltan {requeridos.length - completos} de {requeridos.length} documentos.
        </p>
      ) : null}

      {paso === 3 && discrepancias.length > 0 ? (
        <p className="mt-3 text-right text-sm text-alerta" role="alert">
          Resolvé las diferencias antes de enviar el proyecto.
        </p>
      ) : null}

      <p className="mt-6 text-center text-sm text-tinta-tenue">
        Lo que cargás se guarda como borrador. Podés dejarlo por la mitad y seguir después.
      </p>

      <EnviadoAValidacion
        abierto={enviado}
        cabezas={cabezasNum}
        documentos={completos}
        onCerrar={() => setEnviado(false)}
      />
    </div>
  );
}

/* ---------- Paso 1: los animales ---------- */

function Paso1({
  b,
  set,
  huecos,
}: {
  b: Borrador;
  set: <K extends keyof Borrador>(k: K, v: Borrador[K]) => void;
  huecos: ClaveFicha[];
}) {
  const entrada = Number(b.pesoEntradaKg) || 0;
  const salida = Number(b.pesoSalidaObjetivoKg) || 0;
  const ganancia = salida - entrada;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">¿Qué animales vas a engordar?</h2>
        <p className="mt-1.5 text-tinta-suave">
          Contanos cuántos son y cuánto pesan hoy. Después lo comparamos con tus papeles.
        </p>
        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <CamposDeFicha grupo="El lote" b={b} set={set} huecos={huecos} />
        </div>

        {ganancia > 0 ? (
          <div className="mt-4">
            <Aviso tono="marca">
              Cada animal tiene que ganar{" "}
              <strong className="font-medium text-tinta">{ganancia} kg</strong>
              {Number(b.cabezas) > 0 ? (
                <>
                  , unos{" "}
                  <strong className="font-medium text-tinta">
                    {formatNum(ganancia * Number(b.cabezas))} kg
                  </strong>{" "}
                  en todo el lote
                </>
              ) : null}
              .
            </Aviso>
          </div>
        ) : null}
        {ganancia < 0 ? (
          <div className="mt-4">
            <Aviso tono="error">El peso final es menor al de entrada. Revisá los números.</Aviso>
          </div>
        ) : null}
      </div>

      <div>
        <h3 className="text-lg font-semibold tracking-tight">¿Los animales ya son tuyos?</h3>
        <p className="mt-1 text-sm text-tinta-suave">
          Según eso te pedimos unos papeles u otros.
        </p>
        <div className="mt-3">
          <GrupoOpciones
            etiqueta="¿Los animales ya son tuyos?"
            valor={b.tipoPosesion}
            onCambio={(v) => set("tipoPosesion", v)}
            opciones={TENENCIA}
          />
        </div>
      </div>
    </div>
  );
}

/* ---------- Paso 2: el ciclo y lo que necesitás ---------- */

function Paso2({
  b,
  set,
  cabezas,
  garantias,
  huecos,
}: {
  b: Borrador;
  set: <K extends keyof Borrador>(k: K, v: Borrador[K]) => void;
  cabezas: number;
  garantias: OpcionGarantia[];
  huecos: ClaveFicha[];
}) {
  const monto = Number(b.montoObjetivoArs) || 0;
  const porCabeza = cabezas > 0 ? monto / cabezas : 0;
  const comprando = b.tipoPosesion !== "existencia_comprobada";

  const alternar = (uso: string) =>
    set("usos", b.usos.includes(uso) ? b.usos.filter((u) => u !== uso) : [...b.usos, uso]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">¿Cómo los vas a engordar?</h2>
        <p className="mt-1.5 text-tinta-suave">
          Elegí el tipo de ciclo. Define cuánto dura y cómo se reparte el resultado.
        </p>
        <div className="mt-4">
          <GrupoOpciones
            etiqueta="Tipo de ciclo"
            valor={b.sistemaProductivo}
            onCambio={(v) => {
              set("sistemaProductivo", v);
              set("plazoDias", String(CICLOS[v].plazoDias));
            }}
            opciones={SISTEMAS_EN_ORDEN.map((k) => ({
              valor: k,
              titulo: `${CICLOS[k].nombre} · ${CICLOS[k].plazoDias} días`,
              descripcion: `${CICLOS[k].descripcion} Reparto: productor ${formatPct(CICLOS[k].productorPct)}, colaboradores ${formatPct(CICLOS[k].colaboradoresPct)}. Rentabilidad anual estimada para el productor: ${formatPct(CICLOS[k].rentabilidadAnualProductorPct)}.`,
            }))}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold tracking-tight">¿Cuánto necesitás para el ciclo?</h3>
        <div className="mt-3 max-w-xs">
          <Campo
            id={idDeCampo("montoObjetivoArs")}
            etiqueta="Monto en pesos"
            inputMode="numeric"
            className="tabular"
            placeholder="Por ejemplo, 45000000…"
            error={huecos.includes("montoObjetivoArs") ? "Falta completar este dato." : undefined}
            value={b.montoObjetivoArs}
            onChange={(e) => set("montoObjetivoArs", e.target.value)}
          />
        </div>
        {porCabeza > 0 ? (
          <p className="mt-2 text-sm text-tinta-suave">
            Son unos{" "}
            <strong className="font-medium text-tinta">{formatArs(Math.round(porCabeza))}</strong>{" "}
            por animal.
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="text-lg font-semibold tracking-tight">¿En qué lo vas a usar?</h3>
        <p className="mt-1 text-sm text-tinta-suave">Tocá todo lo que corresponda.</p>
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
        <div className="mt-4">
          <CampoLargo
            etiqueta="Algo más que quieras contar (opcional)"
            value={b.destinoDetalle}
            onChange={(e) => set("destinoDetalle", e.target.value)}
          />
        </div>
      </div>

      <details className="group rounded-2xl border border-borde p-4">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between text-sm font-medium text-tinta-suave [&::-webkit-details-marker]:hidden">
          Más opciones (opcional)
          <ChevronDown
            className="size-5 transition-transform group-open:rotate-180"
            strokeWidth={1.75}
            aria-hidden
          />
        </summary>
        <div className="mt-4 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
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
          </div>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={b.tieneSeguro}
              onChange={(e) => set("tieneSeguro", e.target.checked)}
              className="mt-0.5 size-4 accent-[var(--marca)]"
            />
            <span className="text-sm">Tengo seguro de mortandad sobre el lote</span>
          </label>
        </div>
      </details>
    </div>
  );
}

/* ---------- Paso 3: los papeles ---------- */

function Paso3({
  b,
  requeridos,
  cargas,
  setCargas,
  cabezas,
  discrepancias,
}: {
  b: Borrador;
  requeridos: TipoDocumento[];
  cargas: Record<string, EstadoCarga>;
  setCargas: React.Dispatch<React.SetStateAction<Record<string, EstadoCarga>>>;
  cabezas: number;
  discrepancias: { tipo: TipoDocumento; declarado: number; extraido: number }[];
}) {
  const listos = requeridos.filter((t) => cargas[t]?.fase === "listo").length;
  const pct = Math.round((listos / requeridos.length) * 100);

  return (
    <div id="documentacion-alta" className="scroll-mt-24 space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Subí tus papeles</h2>
        <p className="mt-1.5 text-tinta-suave">
          Los leemos al subirlos y los comparamos con lo que cargaste. Si ya los subiste antes,
          no hace falta repetirlos.
        </p>
      </div>

      {/* Un resumen corto de lo que se va a enviar, para revisar antes de mandar. */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-superficie-2 p-4 sm:grid-cols-4">
        <div>
          <dt className="text-sm text-tinta-tenue">Animales</dt>
          <dd className="font-semibold">
            {formatNum(cabezas)} {b.categoria.toLowerCase()}s
          </dd>
        </div>
        <div>
          <dt className="text-sm text-tinta-tenue">Ciclo</dt>
          <dd className="font-semibold">{CICLOS[b.sistemaProductivo].nombre}</dd>
        </div>
        <div>
          <dt className="text-sm text-tinta-tenue">Duración</dt>
          <dd className="font-semibold">{b.plazoDias} días</dd>
        </div>
        <div>
          <dt className="text-sm text-tinta-tenue">Monto</dt>
          <dd className="tabular font-semibold">{formatArs(Number(b.montoObjetivoArs) || 0)}</dd>
        </div>
      </dl>

      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium">
            {listos} de {requeridos.length} documentos
          </span>
          <span className="tabular text-tinta-tenue">{pct} %</span>
        </div>
        <Progreso valor={pct} label="Documentos cargados" />
      </div>

      <div className="space-y-4">
        {requeridos.map((tipo) => (
          <SlotDocumento
            key={tipo}
            tipo={tipo}
            estado={cargas[tipo] ?? { fase: "vacio" }}
            cabezas={cabezas}
            onArchivo={(nombre) =>
              leerArchivo(tipo, nombre, cabezas, (e) =>
                setCargas((prev) => ({ ...prev, [tipo]: e })),
              )
            }
          />
        ))}
      </div>

      {discrepancias.length > 0 ? (
        <Aviso
          tono="alerta"
          titulo={`${discrepancias.length} ${
            discrepancias.length === 1 ? "diferencia" : "diferencias"
          } entre lo que cargaste y tus papeles`}
        >
          <ul className="mt-1 space-y-1">
            {discrepancias.map((d) => (
              <li key={d.tipo}>
                <strong className="font-medium text-tinta">{DOCUMENTO_LABEL[d.tipo]}</strong>:
                cargaste {formatNum(d.declarado)} cabezas y el documento ampara{" "}
                {formatNum(d.extraido)}.
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Corregí la cantidad en el paso 1 o subí el documento del lote completo.
          </p>
        </Aviso>
      ) : null}
    </div>
  );
}

