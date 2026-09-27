"use client";

import Link from "next/link";
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
  TituloBloque,
} from "@/components/ui/primitivos";
import {
  CAMPOS_FICHA,
  type CampoFicha,
  type ClaveFicha,
  type OpcionGarantia,
} from "@/lib/ficha";
import {
  MODALIDAD_DESCRIPCION,
  MODALIDAD_LABEL,
  MODALIDAD_RETORNO,
  DOCUMENTO_LABEL,
  POSESION_DESCRIPCION,
  POSESION_LABEL,
  SISTEMA_LABEL,
  documentosRequeridos,
  formatArs,
  formatNum,
} from "@/lib/format";
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
  2: ["cabezas", "pesoEntradaKg", "pesoSalidaObjetivoKg"],
  3: ["montoObjetivoArs", "plazoDias"],
};

const PASOS = [
  { n: 1, titulo: "Tipo de proyecto" },
  { n: 2, titulo: "El lote" },
  { n: 3, titulo: "Condiciones" },
  { n: 4, titulo: "Documentación" },
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
   * Lo que pide el plan de operaciones según la modalidad. Todavía no son campos
   * del proyecto: viven en el borrador del alta hasta que haya backend que los
   * guarde, y están anotados en el backlog.
   */
  vendedor: string;
  establecimientoReceptor: string;
  proveedores: string;
  fuenteRepago: string;
  calendario: string;
  tipoPosesion: TipoPosesion;
  sistemaProductivo: SistemaProductivo;
  tieneSeguro: boolean;
};

const INICIAL: Borrador = {
  modalidad: "capital_trabajo",
  vendedor: "",
  establecimientoReceptor: "",
  proveedores: "",
  fuenteRepago: "",
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
  plazoDias: "120",
  plazoCobroDias: "30",
  rendimientoEsperadoPct: "",
  garantiaId: "",
  tieneSeguro: false,
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
  const [presupuesto, setPresupuesto] = useState<FilaPresupuesto[]>([
    { rubro: "Alimentación", concepto: "", monto: "" },
  ]);

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
    <div className="grid gap-6 lg:grid-cols-[1fr_17rem]">
      <div>
        <Panel className="p-6">
          {paso === 1 ? <Paso1 b={b} set={set} /> : null}
          {paso === 2 ? <Paso2 b={b} set={set} huecos={huecos} /> : null}
          {paso === 3 ? (
            <Paso3
              presupuesto={presupuesto}
              setPresupuesto={setPresupuesto}
              b={b}
              set={set}
              cabezas={cabezasNum}
              garantias={garantias}
              huecos={huecos}
            />
          ) : null}
          {paso === 4 ? (
            <Paso4
              requeridos={requeridos}
              cargas={cargas}
              setCargas={setCargas}
              cabezas={cabezasNum}
              discrepancias={discrepancias}
              posesion={b.tipoPosesion}
            />
          ) : null}
        </Panel>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Boton
            variante="secundario"
            onClick={() => setPaso((p) => Math.max(1, p - 1))}
            disabled={paso === 1}
          >
            Atrás
          </Boton>

          <p className="text-sm text-tinta-tenue">Paso {paso} de 4</p>

          {paso < 4 ? (
            <Boton onClick={intentarAvanzar}>Continuar</Boton>
          ) : (
            <Boton onClick={intentarEnviar}>Enviar a validación</Boton>
          )}
        </div>

        {huecos.length > 0 ? (
          <p className="mt-3 text-right text-sm text-alerta">
            {huecos.length === 1
              ? "Falta un dato: "
              : `Faltan ${huecos.length} datos: `}
            {huecos
              .map((c) => CAMPOS_FICHA.find((x) => x.clave === c)?.etiqueta ?? c)
              .join(", ")}
            .
          </p>
        ) : null}

        {paso === 4 && faltanDocs ? (
          <p className="mt-3 text-right text-sm text-alerta">
            Faltan {requeridos.length - completos} de {requeridos.length} comprobantes
            obligatorios.
          </p>
        ) : null}

        {paso === 4 && discrepancias.length > 0 ? (
          <p className="mt-3 text-right text-sm text-alerta">
            Resolvé las discrepancias antes de enviar el proyecto.
          </p>
        ) : null}
      </div>

      <EnviadoAValidacion
        abierto={enviado}
        cabezas={cabezasNum}
        documentos={completos}
        onCerrar={() => setEnviado(false)}
      />

      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Panel className="p-5">
          <ol className="space-y-3">
            {PASOS.map((p) => {
              const actual = p.n === paso;
              const hecho = p.n < paso;
              return (
                <li key={p.n} className="flex items-center gap-3">
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-full text-sm font-medium ${
                      actual
                        ? "bg-marca text-marca-contraste"
                        : hecho
                          ? "bg-marca-suave text-marca"
                          : "bg-superficie-2 text-tinta-tenue"
                    }`}
                  >
                    {hecho ? "✓" : p.n}
                  </span>
                  <span
                    className={`text-sm ${actual ? "font-medium" : "text-tinta-suave"}`}
                  >
                    {p.titulo}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-5 border-t border-borde pt-4">
            <p className="text-sm text-tinta-tenue">
              El borrador se guarda en cada paso. Podés dejarlo por la mitad y seguir
              después.
            </p>
          </div>
        </Panel>
      </aside>
    </div>
  );
}

/* ---------- Paso 1 ---------- */

function Paso1({
  b,
  set,
}: {
  b: Borrador;
  set: <K extends keyof Borrador>(k: K, v: Borrador[K]) => void;
}) {
  return (
    <div className="space-y-8">
      <div>
        <TituloBloque descripcion="La diferencia es si el capital compra hacienda o no.">
          Modalidad del proyecto
        </TituloBloque>
        <GrupoOpciones
          etiqueta="Modalidad del proyecto"
          valor={b.modalidad}
          onCambio={(v) => set("modalidad", v)}
          opciones={(["compra_engorde", "capital_trabajo"] as Modalidad[]).map((m) => ({
            valor: m,
            titulo: MODALIDAD_LABEL[m],
            descripcion: MODALIDAD_DESCRIPCION[m],
          }))}
        />
        {/* Lo que el colaborador va a recibir cambia con la modalidad y conviene
            que el productor lo vea al elegirla: en una participa del resultado
            y en la otra cobra una tasa que el productor se obliga a pagar. */}
        <div className="mt-4 rounded-lg border border-borde bg-superficie-2 p-4">
          <p className="text-sm font-medium">Qué va a recibir el colaborador</p>
          <p className="mt-1 text-sm text-tinta-suave">{MODALIDAD_RETORNO[b.modalidad]}</p>
        </div>
      </div>

      <div>
        <TituloBloque descripcion="Define qué documentación se te va a pedir. Elegí según el estado real de los animales.">
          ¿Ya tenés la hacienda?
        </TituloBloque>
        <GrupoOpciones
          etiqueta="¿Ya tenés la hacienda?"
          valor={b.tipoPosesion}
          onCambio={(v) => set("tipoPosesion", v)}
          opciones={(Object.keys(POSESION_LABEL) as TipoPosesion[]).map((t) => ({
            valor: t,
            titulo: POSESION_LABEL[t],
            descripcion: POSESION_DESCRIPCION[t],
          }))}
        />

        <div className="mt-4">
          <Aviso titulo="Documentación que se te va a pedir">
            <ul className="mt-1 list-inside list-disc">
              {documentosRequeridos(b.tipoPosesion).map((t) => (
                <li key={t}>{DOCUMENTO_LABEL[t]}</li>
              ))}
            </ul>
          </Aviso>
        </div>
      </div>
    </div>
  );
}

/* ---------- Paso 2 ---------- */

function Paso2({
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
    <div className="space-y-6">
      <TituloBloque descripcion="Los animales que entran al ciclo y hasta dónde los querés llevar.">
        El lote
      </TituloBloque>

      <div className="grid gap-5 sm:grid-cols-2">
        <CamposDeFicha grupo="El lote" b={b} set={set} huecos={huecos} />
        <Seleccion
          etiqueta="Sistema productivo"
          opciones={Object.values(SISTEMA_LABEL)}
          value={SISTEMA_LABEL[b.sistemaProductivo]}
          onChange={(e) => {
            const clave = (Object.keys(SISTEMA_LABEL) as SistemaProductivo[]).find(
              (k) => SISTEMA_LABEL[k] === e.target.value,
            );
            if (clave) set("sistemaProductivo", clave);
          }}
        />
      </div>

      {ganancia > 0 ? (
        <Aviso tono="marca">
          Ganancia de peso objetivo:{" "}
          <strong className="font-medium text-tinta">{ganancia} kg por cabeza</strong>, es
          decir{" "}
          <strong className="font-medium text-tinta">
            {formatNum(ganancia * (Number(b.cabezas) || 0))} kg
          </strong>{" "}
          en todo el lote.
        </Aviso>
      ) : null}

      {ganancia < 0 ? (
        <Aviso tono="error">
          El peso objetivo es menor al de entrada. Revisá los valores.
        </Aviso>
      ) : null}
    </div>
  );
}

/* ---------- Paso 3 ---------- */

function Paso3({
  b,
  set,
  cabezas,
  garantias,
  huecos,
  presupuesto,
  setPresupuesto,
}: {
  presupuesto: FilaPresupuesto[];
  setPresupuesto: (f: FilaPresupuesto[]) => void;
  b: Borrador;
  set: <K extends keyof Borrador>(k: K, v: Borrador[K]) => void;
  cabezas: number;
  garantias: OpcionGarantia[];
  huecos: ClaveFicha[];
}) {
  const monto = Number(b.montoObjetivoArs) || 0;
  const porCabeza = cabezas > 0 ? monto / cabezas : 0;

  return (
    <div className="space-y-6">
      <TituloBloque descripcion="Cuánto capital pedís, por cuánto tiempo y qué lo respalda.">
        Condiciones
      </TituloBloque>

      <div className="grid gap-5 sm:grid-cols-2">
        <CamposDeFicha
          grupo="Condiciones"
          b={b}
          set={set}
          garantias={garantias}
          huecos={huecos}
        />
      </div>

      {/* Cada modalidad necesita datos distintos y son pocos: en compra hay
          que saber a quién se le compra y dónde entra la hacienda; en capital de
          trabajo, a quién se le paga y con qué se devuelve. */}
      <div>
        <TituloBloque
          descripcion={
            b.modalidad === "compra_engorde"
              ? "A quién le comprás y dónde entra la hacienda."
              : "A quién se le paga y con qué se devuelve."
          }
        >
          {b.modalidad === "compra_engorde" ? "La compra" : "Los gastos"}
        </TituloBloque>
        <div className="grid gap-5 sm:grid-cols-2">
          {b.modalidad === "compra_engorde" ? (
            <>
              <Campo
                etiqueta="Vendedor"
                ayuda="Quién vende la hacienda."
                value={b.vendedor}
                onChange={(e) => set("vendedor", e.target.value)}
              />
              <Campo
                etiqueta="Establecimiento receptor"
                ayuda="Dónde entra el lote."
                value={b.establecimientoReceptor}
                onChange={(e) => set("establecimientoReceptor", e.target.value)}
              />
            </>
          ) : (
            <>
              <Campo
                etiqueta="Proveedores principales"
                ayuda="A quién se le compra la ración, la sanidad o el servicio."
                value={b.proveedores}
                onChange={(e) => set("proveedores", e.target.value)}
              />
              <Campo
                etiqueta="Fuente prevista de repago"
                ayuda="Con qué se devuelve. No es una garantía."
                value={b.fuenteRepago}
                onChange={(e) => set("fuenteRepago", e.target.value)}
              />
            </>
          )}
          <Seleccion
            etiqueta="Calendario de desembolsos"
            opciones={["Por hito", "Mensual", "Todo al inicio"]}
            value={b.calendario}
            onChange={(e) => set("calendario", e.target.value)}
          />
        </div>
      </div>

      <PresupuestoEditor
        filas={presupuesto}
        onCambio={setPresupuesto}
        objetivo={Number(b.montoObjetivoArs) || 0}
      />

      <Aviso titulo="La garantía no es la documentación del lote">
        Los documentos muestran qué hay; la garantía es lo que se ejecuta si el ciclo no
        se cumple. Se configura una vez en{" "}
        <Link href="/productor/documentacion#garantias" className="font-medium text-marca">
          Mi documentación
        </Link>
        .
      </Aviso>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={b.tieneSeguro}
          onChange={(e) => set("tieneSeguro", e.target.checked)}
          className="mt-0.5 size-4 accent-[var(--marca)]"
        />
        <span className="text-sm">Tengo seguro de mortandad sobre el lote</span>
      </label>

      {porCabeza > 0 ? (
        <Aviso tono="marca">
          Estás pidiendo{" "}
          <strong className="font-medium text-tinta">
            {formatArs(Math.round(porCabeza))} por cabeza
          </strong>{" "}
          sobre {formatNum(cabezas)} cabezas.
        </Aviso>
      ) : null}

      <Aviso>
        Lo que cargues se le muestra al colaborador como proyección tuya, no como un retorno
        garantizado.
      </Aviso>
    </div>
  );
}

/* ---------- Paso 4 ---------- */

function Paso4({
  requeridos,
  cargas,
  setCargas,
  cabezas,
  discrepancias,
  posesion,
}: {
  requeridos: TipoDocumento[];
  cargas: Record<string, EstadoCarga>;
  setCargas: React.Dispatch<React.SetStateAction<Record<string, EstadoCarga>>>;
  cabezas: number;
  discrepancias: { tipo: TipoDocumento; declarado: number; extraido: number }[];
  posesion: TipoPosesion;
}) {
  const listos = requeridos.filter((t) => cargas[t]?.fase === "listo").length;
  const pct = Math.round((listos / requeridos.length) * 100);

  return (
    <div id="documentacion-alta" className="scroll-mt-24 space-y-6">
      <TituloBloque
        descripcion={`Lo que se pide por haber declarado "${POSESION_LABEL[
          posesion
        ].toLowerCase()}". Cada archivo se lee al subirlo.`}
      >
        Documentación
      </TituloBloque>

      <div>
        <div className="mb-2 flex items-baseline justify-between text-sm">
          <span className="font-medium">
            {listos} de {requeridos.length} documentos
          </span>
          <span className="tabular text-tinta-tenue">{pct} %</span>
        </div>
        <Progreso valor={pct} label="Documentación cargada" />
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
            discrepancias.length === 1 ? "discrepancia" : "discrepancias"
          } entre lo declarado y la documentación`}
        >
          <ul className="mt-1 space-y-1">
            {discrepancias.map((d) => (
              <li key={d.tipo}>
                <strong className="font-medium text-tinta">
                  {DOCUMENTO_LABEL[d.tipo]}
                </strong>
                : declaraste {formatNum(d.declarado)} cabezas y el documento ampara{" "}
                {formatNum(d.extraido)}.
              </li>
            ))}
          </ul>
          <p className="mt-2">
            Corregí la cantidad en el paso 2 o subí el documento del lote completo.
          </p>
        </Aviso>
      ) : null}

      <Aviso>
        Que las cifras cierren no prueba que el documento sea auténtico: eso se verifica
        después, contra el organismo emisor.
      </Aviso>
    </div>
  );
}

/**
 * El presupuesto por rubro, en el alta.
 *
 * Es una lista de filas y no un texto libre porque después cada factura se
 * imputa contra un rubro: escrito en prosa no se puede comparar contra nada. La
 * suma se controla contra el monto pedido y lo dice cuando no cierra, que es el
 * error más frecuente al cargar.
 */
export interface FilaPresupuesto {
  rubro: string;
  concepto: string;
  monto: string;
}

const RUBROS = [
  "Hacienda",
  "Alimentación",
  "Sanidad",
  "Corral",
  "Flete",
  "Mano de obra",
  "Otro",
];

function PresupuestoEditor({
  filas,
  onCambio,
  objetivo,
}: {
  filas: FilaPresupuesto[];
  onCambio: (f: FilaPresupuesto[]) => void;
  objetivo: number;
}) {
  const total = filas.reduce((a, f) => a + (Number(f.monto) || 0), 0);
  const diferencia = objetivo - total;

  const actualizar = (i: number, campo: keyof FilaPresupuesto, valor: string) =>
    onCambio(filas.map((f, j) => (i === j ? { ...f, [campo]: valor } : f)));

  return (
    <div>
      <TituloBloque descripcion="En qué se gasta el capital. Cada rubro es contra lo que después se rinde una factura.">
        Presupuesto por rubro
      </TituloBloque>

      <ul className="space-y-3">
        {filas.map((fila, i) => (
          <li key={i} className="rounded-lg border border-borde p-4">
            <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_9rem_auto] sm:items-end">
              <Seleccion
                etiqueta="Rubro"
                opciones={RUBROS}
                value={fila.rubro}
                onChange={(e) => actualizar(i, "rubro", e.target.value)}
              />
              <Campo
                etiqueta="Concepto"
                value={fila.concepto}
                onChange={(e) => actualizar(i, "concepto", e.target.value)}
              />
              <Campo
                etiqueta="Monto, en pesos"
                inputMode="numeric"
                className="tabular"
                value={fila.monto}
                onChange={(e) => actualizar(i, "monto", e.target.value)}
              />
              <Boton
                variante="sutil"
                onClick={() => onCambio(filas.filter((_, j) => j !== i))}
                aria-label={`Quitar el rubro ${fila.rubro}`}
              >
                Quitar
              </Boton>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Boton
          variante="secundario"
          onClick={() =>
            onCambio([...filas, { rubro: "Alimentación", concepto: "", monto: "" }])
          }
        >
          Agregar rubro
        </Boton>
        <p className="tabular text-sm">
          Suma {formatArs(total)} de {formatArs(objetivo)}
        </p>
      </div>

      {objetivo > 0 && diferencia !== 0 && filas.length > 0 ? (
        <div className="mt-3">
          <Aviso tono="alerta">
            {diferencia > 0
              ? `Faltan ${formatArs(diferencia)} por asignar a un rubro.`
              : `El presupuesto se pasa ${formatArs(-diferencia)} del monto que pedís.`}
          </Aviso>
        </div>
      ) : null}
    </div>
  );
}
