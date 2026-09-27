"use client";

import { useMemo, useState } from "react";
import {
  FormularioGuiado,
  SeccionFormulario,
  type PasoGuiado,
} from "@/components/formulario-guiado";
import { EnviadoAValidacion } from "@/components/enviado-a-validacion";
import {
  SlotDocumento,
  leerArchivo,
  type EstadoCarga,
} from "@/components/subir-documento";
import { Campo, Seleccion } from "@/components/ui/campos";
import { Modal } from "@/components/ui/modal";
import { Aviso, Badge, Boton, Panel, Progreso } from "@/components/ui/primitivos";
import {
  CAMPOS_FICHA,
  estaCompleto,
  type ClaveFicha,
  type OpcionGarantia,
} from "@/lib/ficha";
import { DOCUMENTO_LABEL, POSESION_LABEL, formatNum } from "@/lib/format";
import type { Proyecto, TipoDocumento } from "@/lib/types";

/** El id del control de un campo, para poder darle el foco desde el botón. */
const idDeCampo = (clave: ClaveFicha) => `ficha-${clave}`;

export interface DocumentoCargado {
  tipo: TipoDocumento;
  archivo: string;
  campos: { etiqueta: string; valor: string }[];
}

/**
 * La ficha técnica de un borrador: lo que el productor todavía tiene que
 * completar, con los huecos a la vista en vez de escondidos. Los datos y la
 * documentación viven en la misma pantalla a propósito —son las dos mitades de
 * la misma declaración— y el proyecto no se envía hasta que cierren las dos.
 */
export function FichaTecnica({
  proyecto,
  garantias,
  requeridos,
  yaCargados,
}: {
  proyecto: Proyecto;
  garantias: OpcionGarantia[];
  requeridos: TipoDocumento[];
  yaCargados: DocumentoCargado[];
}) {
  const [valores, setValores] = useState<Record<ClaveFicha, string>>(() => {
    const inicial = {} as Record<ClaveFicha, string>;
    for (const c of CAMPOS_FICHA) {
      const v = proyecto[c.clave];
      inicial[c.clave] = estaCompleto(v) ? String(v) : "";
    }
    return inicial;
  });

  const [cargas, setCargas] = useState<Record<string, EstadoCarga>>(() => {
    const inicial: Record<string, EstadoCarga> = {};
    for (const d of yaCargados) {
      inicial[d.tipo] = {
        fase: "listo",
        archivo: d.archivo,
        lectura: { campos: d.campos },
      };
    }
    return inicial;
  });

  const [enviado, setEnviado] = useState(false);
  /**
   * El aviso de envío, aparte de `enviado`: el proyecto sigue en revisión
   * después de cerrar el modal, pero el modal no vuelve a abrirse solo.
   */
  const [avisoEnvio, setAvisoEnvio] = useState(false);
  /** El documento que se acaba de leer, para mostrar la lectura sin buscarla. */
  const [leido, setLeido] = useState<{ tipo: TipoDocumento; estado: EstadoCarga } | null>(
    null,
  );
  const [guardado, setGuardado] = useState(false);
  /** Si ya se intentó enviar. Hasta entonces, ningún campo se pinta de rojo. */
  const [intentado, setIntentado] = useState(false);

  const faltanDatos = CAMPOS_FICHA.filter((c) => valores[c.clave].trim() === "");
  const faltanEnLote = faltanDatos.filter((c) => c.grupo === "El lote").length;
  const faltanEnCondiciones = faltanDatos.filter((c) => c.grupo === "Condiciones").length;
  const documentosListos = requeridos.filter((t) => cargas[t]?.fase === "listo");
  const faltanDocs = requeridos.filter((t) => cargas[t]?.fase !== "listo");
  const cabezas = Number(valores.cabezas) || 0;

  const discrepancias = useMemo(
    () =>
      requeridos
        .map((t) => {
          const carga = cargas[t];
          if (carga?.fase !== "listo") return null;
          const det = carga.lectura.cabezasDetectadas;
          if (det === undefined || det === cabezas) return null;
          return { tipo: t, declarado: cabezas, extraido: det };
        })
        .filter((d): d is { tipo: TipoDocumento; declarado: number; extraido: number } =>
          Boolean(d),
        ),
    [requeridos, cargas, cabezas],
  );

  const total = CAMPOS_FICHA.length + requeridos.length;
  const hechos = total - faltanDatos.length - faltanDocs.length;
  const pct = Math.round((hechos / total) * 100);
  const listoParaEnviar =
    faltanDatos.length === 0 && faltanDocs.length === 0 && discrepancias.length === 0;

  /**
   * Enviar siempre se puede apretar. Si algo falta, el foco cae en el primer
   * hueco y el campo lo dice al lado; si faltan comprobantes, la pantalla baja
   * hasta ellos. Un botón gris no explica nada y obliga a buscar el motivo.
   */
  const intentarEnviar = () => {
    if (listoParaEnviar) {
      setEnviado(true);
      setAvisoEnvio(true);
      return;
    }
    setIntentado(true);
    const primero = faltanDatos[0];
    if (primero) {
      document.getElementById(idDeCampo(primero.clave))?.focus();
      return;
    }
    document.getElementById("documentacion")?.scrollIntoView({ behavior: "smooth" });
  };

  const pasos: PasoGuiado[] = estadosDePasos([
    {
      clave: "lote",
      titulo: "El lote",
      detalle: faltanEnLote > 0 ? `Faltan ${faltanEnLote} datos` : "Completo",
      completo: faltanEnLote === 0,
      href: "#lote",
    },
    {
      clave: "condiciones",
      titulo: "Condiciones",
      detalle:
        faltanEnCondiciones > 0 ? `Faltan ${faltanEnCondiciones} datos` : "Completo",
      completo: faltanEnCondiciones === 0,
      href: "#condiciones",
    },
    {
      clave: "documentacion",
      titulo: "Documentación",
      detalle: `${documentosListos.length} de ${requeridos.length} comprobantes`,
      completo: faltanDocs.length === 0,
      href: "#documentacion",
    },
    {
      clave: "envio",
      titulo: "Enviar a revisión",
      detalle: listoParaEnviar ? "Ya podés enviarlo" : "Todavía falta completar la ficha",
      completo: enviado,
      href: "#envio",
    },
  ]);

  const grupos = ["El lote", "Condiciones"] as const;

  return (
    <FormularioGuiado
      progreso={pct}
      pasos={pasos}
      aside={
        <Panel className="p-5">
          <p className="rotulo text-tinta-tenue">Documentación exigida</p>
          <p className="mt-2 text-sm text-tinta-suave">
            Sale de haber declarado el proyecto como{" "}
            {POSESION_LABEL[proyecto.tipoPosesion].toLowerCase()}.
          </p>
          <ul className="mt-4 space-y-2.5">
            {requeridos.map((t) => {
              const listo = cargas[t]?.fase === "listo";
              return (
                <li key={t} className="flex items-center justify-between gap-3 text-sm">
                  <span className={listo ? "" : "text-tinta-suave"}>
                    {DOCUMENTO_LABEL[t]}
                  </span>
                  <Badge tono={listo ? "ok" : "neutro"}>{listo ? "Listo" : "Falta"}</Badge>
                </li>
              );
            })}
          </ul>
          <p className="mt-5 border-t border-borde pt-4 text-sm text-tinta-suave">
            Guardian lee cada documento y verifica que las cifras cierren. Que cierren no
            prueba que el papel sea auténtico: eso se verifica después, contra el
            organismo emisor.
          </p>
        </Panel>
      }
    >
      <Panel className="p-6 sm:p-7">
        <div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-borde pb-5">
          <p className="font-medium">
            {faltanDatos.length === 0 && faltanDocs.length === 0
              ? "La ficha está completa"
              : `Te falta completar ${[
                  faltanDatos.length > 0
                    ? `${faltanDatos.length} ${faltanDatos.length === 1 ? "dato" : "datos"}`
                    : null,
                  faltanDocs.length > 0
                    ? `${faltanDocs.length} ${
                        faltanDocs.length === 1 ? "documento" : "documentos"
                      }`
                    : null,
                ]
                  .filter(Boolean)
                  .join(" y ")}`}
          </p>
          <p className="tabular text-sm text-tinta-tenue">
            {hechos} de {total}
          </p>
        </div>

        <div className="space-y-10">
          {grupos.map((grupo) => (
            <SeccionFormulario
              key={grupo}
              id={grupo === "El lote" ? "lote" : "condiciones"}
              titulo={grupo}
              descripcion={
                grupo === "El lote"
                  ? "Los animales que entran al ciclo. Es contra estos números que se lee la documentación."
                  : "Cuánto capital pedís, en cuánto tiempo lo devolvés y con qué lo respaldás."
              }
            >
              <div className="grid gap-5 sm:grid-cols-2">
                {CAMPOS_FICHA.filter((c) => c.grupo === grupo).map((c) => {
                  const valor = valores[c.clave];
                  const etiqueta = c.sufijo
                    ? `${c.etiqueta} (${c.sufijo})`
                    : c.etiqueta;
                  const cambiar = (v: string) =>
                    setValores((prev) => ({ ...prev, [c.clave]: v }));

                  const id = idDeCampo(c.clave);
                  const error =
                    intentado && valor.trim() === ""
                      ? "Falta completar este dato."
                      : undefined;

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
                        value={valor}
                        onChange={(e) => cambiar(e.target.value)}
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
                        value={valor}
                        onChange={(e) => cambiar(e.target.value)}
                      />
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
                      value={valor}
                      onChange={(e) => cambiar(e.target.value)}
                    />
                  );
                })}
              </div>
            </SeccionFormulario>
          ))}

          <SeccionFormulario
            id="documentacion"
            titulo="Documentación"
            descripcion="Cada archivo se lee al subirlo y se compara con los datos de arriba."
          >
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">
                {documentosListos.length} de {requeridos.length} documentos
              </span>
              <span className="tabular text-tinta-tenue">
                {Math.round((documentosListos.length / requeridos.length) * 100)} %
              </span>
            </div>
            <div className="mb-5">
              <Progreso
                valor={(documentosListos.length / requeridos.length) * 100}
                label="Documentación cargada"
              />
            </div>

            <div className="space-y-4">
              {requeridos.map((tipo) => (
                <SlotDocumento
                  key={tipo}
                  tipo={tipo}
                  estado={cargas[tipo] ?? { fase: "vacio" }}
                  cabezas={cabezas}
                  onArchivo={(nombre) =>
                    leerArchivo(tipo, nombre, cabezas, (e) => {
                      setCargas((prev) => ({ ...prev, [tipo]: e }));
                      // La lectura termina sola, unos segundos después de soltar
                      // el archivo: si el resultado quedara abajo, el productor
                      // sigue completando la ficha sin enterarse.
                      if (e.fase === "listo") setLeido({ tipo, estado: e });
                    })
                  }
                />
              ))}
            </div>

            {discrepancias.length > 0 ? (
              <p className="mt-5 text-sm font-medium text-alerta">
                {discrepancias.length === 1
                  ? "Hay una discrepancia sin resolver: "
                  : `Hay ${discrepancias.length} discrepancias sin resolver: `}
                {discrepancias
                  .map(
                    (d) =>
                      `${DOCUMENTO_LABEL[d.tipo]} ampara ${formatNum(d.extraido)} cabezas`,
                  )
                  .join(", ")}
                . Corregí la cantidad declarada o subí el documento que cubra el lote
                completo.
              </p>
            ) : null}
          </SeccionFormulario>

          <section id="envio" className="scroll-mt-24 border-t border-borde pt-7">
            <div className="flex flex-wrap items-center gap-3">
              <Boton onClick={intentarEnviar}>Enviar a revisión</Boton>
              <Boton
                variante="secundario"
                onClick={() => {
                  setEnviado(false);
                  setGuardado(true);
                }}
              >
                Guardar y seguir después
              </Boton>
              {listoParaEnviar ? (
                <p className="text-sm text-marca">
                  Todo cierra: los datos están completos y coinciden con los documentos.
                </p>
              ) : null}
            </div>

            {!listoParaEnviar ? (
              <div className="mt-4">
                <Aviso titulo="Qué falta antes de que Guardian lo mire">
                  <ul className="mt-1 space-y-1">
                    {faltanDatos.length > 0 ? (
                      <li>
                        Datos sin cargar:{" "}
                        <strong className="font-medium text-tinta">
                          {faltanDatos.map((c) => c.etiqueta).join(", ")}
                        </strong>
                      </li>
                    ) : null}
                    {faltanDocs.length > 0 ? (
                      <li>
                        Documentos sin subir:{" "}
                        <strong className="font-medium text-tinta">
                          {faltanDocs.map((t) => DOCUMENTO_LABEL[t]).join(", ")}
                        </strong>
                      </li>
                    ) : null}
                    {discrepancias.length > 0 ? (
                      <li>
                        Discrepancias sin resolver:{" "}
                        <strong className="font-medium text-tinta">
                          {discrepancias
                            .map(
                              (d) =>
                                `${DOCUMENTO_LABEL[d.tipo]} ampara ${formatNum(
                                  d.extraido,
                                )} y declaraste ${formatNum(d.declarado)}`,
                            )
                            .join("; ")}
                        </strong>
                        . Poné la cantidad que dice el documento, o subí el que cubra el
                        lote completo.
                      </li>
                    ) : null}
                  </ul>
                </Aviso>
              </div>
            ) : null}

            {/* El detalle de lo que sigue lo cuenta el modal. Acá queda una línea
                porque, cerrado el modal, la pantalla todavía tiene que decir en
                qué estado quedó el proyecto. */}
            {enviado ? (
              <p className="mt-4 text-sm text-marca">
                Enviado. Quedó en{" "}
                <strong className="font-medium">En revisión</strong> y no lo podés editar
                hasta que Guardian lo mire.
              </p>
            ) : null}
          </section>
        </div>
      </Panel>

      <EnviadoAValidacion
        abierto={avisoEnvio}
        cabezas={cabezas}
        documentos={documentosListos.length}
        etiquetaCerrar="Ver la ficha"
        onCerrar={() => setAvisoEnvio(false)}
      />

      <ModalLectura leido={leido} cabezas={cabezas} onCerrar={() => setLeido(null)} />

      <Modal
        abierto={guardado}
        titulo="Guardamos la ficha"
        onCerrar={() => setGuardado(false)}
        pie={
          <Boton variante="secundario" onClick={() => setGuardado(false)}>
            Seguir completando
          </Boton>
        }
      >
        <p className="text-tinta-suave">
          Quedaron {hechos} de {total} puntos completos. Podés cerrar la pantalla y
          retomarla cuando quieras: el proyecto sigue en borrador y nadie más lo ve.
        </p>
        <p className="mt-4 text-sm text-tinta-suave">
          <Badge tono="alerta">Prototipo</Badge>{" "}
          <span className="ml-1">
            Mientras no esté el backend, lo que completás acá no se guarda al salir de
            la pantalla.
          </span>
        </p>
      </Modal>
    </FormularioGuiado>
  );
}

/**
 * Lo que Guardian leyó del documento, apenas termina de leerlo. Muestra los
 * campos extraídos incluso cuando todo cierra: el productor tiene que poder ver
 * qué entendió la máquina, no solo enterarse cuando algo falla.
 */
function ModalLectura({
  leido,
  cabezas,
  onCerrar,
}: {
  leido: { tipo: TipoDocumento; estado: EstadoCarga } | null;
  cabezas: number;
  onCerrar: () => void;
}) {
  if (!leido || leido.estado.fase !== "listo") return null;

  const { archivo, lectura } = leido.estado;
  const detectadas = lectura.cabezasDetectadas;
  const discrepa = detectadas !== undefined && detectadas !== cabezas;

  return (
    <Modal
      abierto
      titulo={discrepa ? "El documento no coincide" : "Leímos el documento"}
      onCerrar={onCerrar}
      pie={
        <>
          {discrepa ? (
            <Boton
              onClick={() => {
                onCerrar();
                document.getElementById("lote")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Revisar lo declarado
            </Boton>
          ) : null}
          <Boton variante={discrepa ? "secundario" : "primario"} onClick={onCerrar}>
            Entendido
          </Boton>
        </>
      }
    >
      <p className="text-sm text-tinta-suave">
        {DOCUMENTO_LABEL[leido.tipo]} · {archivo}
      </p>

      <dl className="mt-4 space-y-2.5 border-t border-borde pt-4">
        {lectura.campos.map((c) => (
          <div key={c.etiqueta} className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-tinta-suave">{c.etiqueta}</dt>
            <dd className="codigo text-right font-medium">{c.valor}</dd>
          </div>
        ))}
      </dl>

      {discrepa ? (
        <p className="mt-5 rounded-lg bg-alerta-suave p-4">
          Declaraste {formatNum(cabezas)} cabezas y el documento ampara{" "}
          {formatNum(detectadas)}. Corregí la cantidad o subí el comprobante que cubra el
          lote completo: Guardian no publica proyectos con discrepancias sin resolver.
        </p>
      ) : (
        <p className="mt-5 text-tinta-suave">
          Las cifras cierran con lo que declaraste. Que cierren no prueba que el papel sea
          auténtico: eso se verifica después, contra el organismo emisor.
        </p>
      )}
    </Modal>
  );
}

/**
 * El primer tramo incompleto es el actual; lo anterior está hecho y lo que sigue,
 * pendiente. Es la única lectura honesta cuando el formulario no obliga a un orden.
 */
function estadosDePasos(
  tramos: { clave: string; titulo: string; detalle: string; completo: boolean; href: string }[],
): PasoGuiado[] {
  const actual = tramos.findIndex((t) => !t.completo);
  return tramos.map((t, i) => ({
    clave: t.clave,
    titulo: t.titulo,
    detalle: t.detalle,
    href: t.href,
    estado: t.completo ? "hecho" : i === actual ? "actual" : "pendiente",
  }));
}
