import "server-only";
import { randomUUID } from "node:crypto";
import { guardarArchivo, type ArchivoValidado } from "@/lib/almacen";
import { CICLOS } from "@/lib/ciclos";
import { MODELOS, SUPUESTOS } from "@/lib/simulador";
import { consultar, enTransaccion, hayBaseConfigurada } from "@/lib/db/conexion";
import { getProductor, getProyecto } from "@/lib/data";
import type { Consultar } from "@/lib/data/postgres";
import { discrepancias, documentos, proyectos } from "@/lib/data/seed";
import { simularLectura } from "@/lib/lectura";
import type {
  Documento,
  Proyecto,
  SistemaProductivo,
  TipoDocumento,
  TipoPosesion,
} from "@/lib/types";

/**
 * Las escrituras. Todo lo que cambia datos pasa por acá, y cada una deja su
 * asiento en `auditoria`: quién, qué, sobre qué y cuándo.
 *
 * Con base configurada, cada escritura es una transacción. Sin base, se escribe
 * en el seed en memoria, igual que se lee de él: la demo funciona sin
 * configurar nada y se pierde al reiniciar el servidor.
 */

/** Lo que el productor declara al presentar. Ya validado por la acción del servidor. */
export interface Presentacion {
  cabezas: number;
  categoria: string;
  raza: string;
  pesoEntradaKg: number;
  montoObjetivoArs: number;
  tipoPosesion: TipoPosesion;
  sistemaProductivo: SistemaProductivo;
  usos: string[];
  destinoDetalle: string;
  garantiaId: string | null;
  tieneSeguro: boolean;
  vendedor: string;
  establecimientoReceptor: string;
  proveedores: string;
}

/**
 * Ganancia diaria esperada por sistema, en kilos por cabeza: la del modelo del
 * simulador (de 180 kg a la salida en los días del ciclo). Da el peso de salida
 * objetivo, que el alta no pregunta.
 */
const GANANCIA_DIARIA = (s: SistemaProductivo) =>
  (MODELOS[s].pesoSalidaKg - SUPUESTOS.pesoEntradaKg) / MODELOS[s].dias;

const TITULO: Record<SistemaProductivo, string> = {
  corral: "Engorde a corral",
  mixto: "Recría y terminación",
  pastura: "Engorde sobre pastura",
};

const BASE_REPARTO =
  "Sobre el resultado neto de la venta, una vez cubiertos los gastos reconocidos del ciclo";

const hoy = () => new Date().toISOString().slice(0, 10);

/** El umbral del trabajo final: con el 80 % juntado, el proyecto arranca. */
export const MINIMO_PARA_ARRANCAR = 0.8;

function detalleDelDestino(p: Presentacion): string {
  const partes = [
    p.usos.length > 0 ? `${p.usos.join(", ")}.` : "",
    p.destinoDetalle.trim(),
    p.vendedor.trim() ? `Vende la hacienda: ${p.vendedor.trim()}.` : "",
    p.establecimientoReceptor.trim()
      ? `Entra al campo: ${p.establecimientoReceptor.trim()}.`
      : "",
    p.proveedores.trim() ? `Proveedores: ${p.proveedores.trim()}.` : "",
  ];
  return partes.filter(Boolean).join(" ");
}

export async function presentarProyecto(
  actor: string,
  productorId: string,
  p: Presentacion,
  archivos: { tipo: TipoDocumento; archivo: ArchivoValidado }[],
): Promise<{ id: string }> {
  const productor = await getProductor(productorId);
  if (!productor) throw new Error("No se encontró el productor.");

  const id = randomUUID();
  const ciclo = CICLOS[p.sistemaProductivo];
  const pesoSalida = Math.round(
    p.pesoEntradaKg + ciclo.plazoDias * GANANCIA_DIARIA(p.sistemaProductivo),
  );
  const titulo = `${TITULO[p.sistemaProductivo]} — ${p.cabezas} ${p.categoria.toLowerCase()}s`;

  const docs = await Promise.all(
    archivos.map(({ tipo, archivo }) => prepararDocumento(id, tipo, archivo, p.cabezas)),
  );

  if (!hayBaseConfigurada()) {
    const proyecto: Proyecto = {
      id,
      productorId,
      titulo,
      modalidad: "compra_engorde",
      condiciones: {
        monedaAporte: "ARS",
        monedaDevolucion: "ARS",
        participacion: {
          colaboradoresPct: ciclo.colaboradoresPct,
          productorPct: ciclo.productorPct,
          base: BASE_REPARTO,
          fuente: "demostrativo",
        },
        comisiones: [],
        contingencias: [],
      },
      // El trabajo: el proyecto arranca con al menos el 80 % de lo pedido.
      montoMinimoInicioArs: Math.round(p.montoObjetivoArs * MINIMO_PARA_ARRANCAR),
      destinoDetalle: detalleDelDestino(p),
      tipoPosesion: p.tipoPosesion,
      sistemaProductivo: p.sistemaProductivo,
      cabezas: p.cabezas,
      categoria: p.categoria,
      raza: p.raza,
      pesoEntradaKg: p.pesoEntradaKg,
      pesoSalidaObjetivoKg: pesoSalida,
      montoObjetivoArs: p.montoObjetivoArs,
      montoRecaudadoArs: 0,
      montoLiberadoArs: 0,
      montoRetiradoArs: 0,
      plazoDias: ciclo.plazoDias,
      plazoCobroDias: 30,
      presupuesto: [],
      cronograma: [],
      controles: [],
      rendimientoEsperadoPct: ciclo.rentabilidadAnualProductorPct,
      garantiaId: p.garantiaId ?? "",
      tieneSeguro: p.tieneSeguro,
      estado: "en_validacion",
      provincia: productor.provincia,
      creadoAt: hoy(),
    };
    proyectos.push(proyecto);
    for (const d of docs) documentoEnMemoria(d, productorId, id, p.cabezas);
    return { id };
  }

  await enTransaccion(async (q: Consultar) => {
    await q(
      `insert into proyectos (id, productor_id, titulo, modalidad, destino_detalle, tipo_posesion,
         sistema_productivo, cabezas, categoria, raza, peso_entrada_kg, peso_salida_objetivo_kg,
         monto_objetivo_ars, plazo_dias, plazo_cobro_dias, rendimiento_esperado_pct, garantia_id,
         tiene_seguro, estado, provincia, monto_minimo_inicio_ars)
       values ($1, $2, $3, 'compra_engorde', $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 30, $14,
               $15, $16, 'en_validacion', $17, $18)`,
      [
        id, productorId, titulo, detalleDelDestino(p), p.tipoPosesion, p.sistemaProductivo,
        p.cabezas, p.categoria, p.raza, p.pesoEntradaKg, pesoSalida, p.montoObjetivoArs,
        ciclo.plazoDias, ciclo.rentabilidadAnualProductorPct, p.garantiaId, p.tieneSeguro,
        productor.provincia, Math.round(p.montoObjetivoArs * MINIMO_PARA_ARRANCAR),
      ],
    );
    await q(
      `insert into condiciones_economicas (proyecto_id, version, participacion_colaboradores_pct,
         participacion_productor_pct, participacion_base, participacion_fuente)
       values ($1, 1, $2, $3, $4, 'demostrativo')`,
      [id, ciclo.colaboradoresPct, ciclo.productorPct, BASE_REPARTO],
    );

    for (const d of docs) await insertarDocumento(q, d, productorId, id, p.cabezas);

    // La capacidad de una ficha nueva arranca en 1: un lote presentado dice
    // cuánto entra, como mínimo.
    await q(
      `update productores set capacidad_instalada = greatest(capacidad_instalada, $2) where id = $1`,
      [productorId, p.cabezas],
    );

    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'presentar', 'proyecto', $2, $3)`,
      [
        actor,
        id,
        JSON.stringify({
          estado: { de: null, a: "en_validacion" },
          documentos: docs.map((d) => ({ tipo: d.tipo, ruta: d.ruta })),
        }),
      ],
    );
  });

  return { id };
}

type DocumentoPreparado = {
  docId: string;
  tipo: TipoDocumento;
  archivo: ArchivoValidado;
  ruta: string;
  lectura: ReturnType<typeof simularLectura>;
  discrepa: boolean;
};

/**
 * Guarda el archivo y lo lee. Los archivos se guardan antes que la fila y con
 * nombre propio: si después la base falla, queda un archivo suelto en el
 * almacenamiento, que no hace daño; al revés quedaría un documento que apunta a
 * un archivo que no existe.
 */
async function prepararDocumento(
  proyectoId: string,
  tipo: TipoDocumento,
  archivo: ArchivoValidado,
  cabezas: number,
): Promise<DocumentoPreparado> {
  const docId = randomUUID();
  const ruta = await guardarArchivo(
    `proyectos/${proyectoId}/${tipo}-${docId}.${archivo.extension}`,
    archivo,
  );
  const lectura = simularLectura(tipo, cabezas);
  const discrepa =
    lectura.cabezasDetectadas !== undefined && lectura.cabezasDetectadas !== cabezas;
  return { docId, tipo, archivo, ruta, lectura, discrepa };
}

const DETALLE_DISCREPANCIA =
  "Las cabezas que ampara el documento no coinciden con las declaradas.";

async function insertarDocumento(
  q: Consultar,
  d: DocumentoPreparado,
  productorId: string,
  proyectoId: string,
  cabezas: number,
) {
  // El RENSPA es del establecimiento y no del ciclo: queda en el legajo
  // permanente del productor, sin proyecto.
  await q(
    `insert into documentos (id, proyecto_id, productor_id, tipo, nombre_archivo,
       tiene_capa_texto, estado_extraccion, estado_consistencia, ruta_archivo, tipo_mime,
       tamano_bytes, cuve)
     values ($1, $2, $3, $4, $5, $6, 'ok', $7, $8, $9, $10, $11)`,
    [
      d.docId, d.tipo === "renspa" ? null : proyectoId, productorId, d.tipo, d.archivo.nombre,
      d.archivo.tipo === "application/pdf",
      d.discrepa ? "con_discrepancias" : "consistente",
      d.ruta, d.archivo.tipo, d.archivo.tamano,
      d.lectura.campos.find((c) => c.etiqueta === "CUVE")?.valor ?? null,
    ],
  );
  for (const [i, c] of d.lectura.campos.entries()) {
    await q(
      `insert into extracciones (documento_id, campo, etiqueta, valor, confianza, orden)
       values ($1, $2, $3, $4, 0.9, $5)`,
      [d.docId, `campo${i + 1}`, c.etiqueta, c.valor, i],
    );
  }
  if (d.discrepa) {
    await q(
      `insert into discrepancias (documento_id, campo, etiqueta, valor_declarado,
         valor_extraido, severidad, detalle)
       values ($1, 'cabezas', 'Cantidad de cabezas', $2, $3, 'alta', $4)`,
      [d.docId, String(cabezas), String(d.lectura.cabezasDetectadas), DETALLE_DISCREPANCIA],
    );
  }
}

function documentoEnMemoria(
  d: DocumentoPreparado,
  productorId: string,
  proyectoId: string,
  cabezas: number,
) {
  const doc: Documento = {
    id: d.docId,
    proyectoId: d.tipo === "renspa" ? null : proyectoId,
    productorId,
    tipo: d.tipo,
    nombreArchivo: d.archivo.nombre,
    tieneCapaTexto: d.archivo.tipo === "application/pdf",
    subidoAt: hoy(),
    estadoExtraccion: "ok",
    estadoConsistencia: d.discrepa ? "con_discrepancias" : "consistente",
    estadoAutenticidad: "sin_verificar",
    cuve: d.lectura.campos.find((c) => c.etiqueta === "CUVE")?.valor,
    camposExtraidos: d.lectura.campos.map((c, i) => ({
      campo: `campo${i + 1}`,
      etiqueta: c.etiqueta,
      valor: c.valor,
      confianza: 0.9,
    })),
  };
  documentos.push(doc);
  if (d.discrepa) {
    discrepancias.push({
      id: randomUUID(),
      documentoId: d.docId,
      campo: "cabezas",
      etiqueta: "Cantidad de cabezas",
      valorDeclarado: String(cabezas),
      valorExtraido: String(d.lectura.cabezasDetectadas),
      severidad: "alta",
      detalle: DETALLE_DISCREPANCIA,
      resuelta: false,
    });
  }
}

/**
 * Suma un papel a un proyecto que ya existe: uno que faltaba o respaldo nuevo
 * (una póliza, el romaneo al cierre). Solo el dueño del proyecto.
 */
export async function agregarDocumento(
  actor: string,
  productorId: string,
  proyectoId: string,
  tipo: TipoDocumento,
  archivo: ArchivoValidado,
): Promise<{ id: string; lectura: DocumentoPreparado["lectura"] }> {
  const proyecto = await getProyecto(proyectoId);
  if (!proyecto || proyecto.productorId !== productorId)
    throw new Error("El proyecto no es de este productor.");

  const d = await prepararDocumento(proyectoId, tipo, archivo, proyecto.cabezas);

  if (!hayBaseConfigurada()) {
    documentoEnMemoria(d, productorId, proyectoId, proyecto.cabezas);
    return { id: d.docId, lectura: d.lectura };
  }

  await enTransaccion(async (q) => {
    await insertarDocumento(q, d, productorId, proyectoId, proyecto.cabezas);
    await q(
      `insert into auditoria (actor, accion, entidad, entidad_id, cambios)
       values ($1, 'subir_documento', 'proyecto', $2, $3)`,
      [actor, proyectoId, JSON.stringify({ documento: d.docId, tipo, ruta: d.ruta })],
    );
  });
  return { id: d.docId, lectura: d.lectura };
}

/** Garantías del productor que puede elegir: las suyas, nada más. */
export async function garantiaEsDelProductor(garantiaId: string, productorId: string) {
  if (!hayBaseConfigurada()) {
    const { getGarantia } = await import("@/lib/data");
    return (await getGarantia(garantiaId))?.productorId === productorId;
  }
  const filas = await consultar(`select 1 from garantias where id = $1 and productor_id = $2`, [
    garantiaId,
    productorId,
  ]);
  return filas.length > 0;
}
