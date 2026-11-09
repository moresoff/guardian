import "server-only";
import { SUPUESTOS } from "@/lib/simulador";

/**
 * El precio del kilo de hoy, de dos fuentes públicas:
 *
 * - Compra: el Índice Ternero de ROSGAN, el promedio del ternero de invernada en
 *   su último remate. Lo publica en JSON, sin cuenta.
 * - Venta: el promedio de los novillitos de 300 a 390 kg en el Mercado
 *   Agroganadero de Cañuelas, de los últimos siete días. Es el peso con el que
 *   sale el lote. El mercado lo publica como una tabla HTML.
 *
 * Se piden una vez cada seis horas. Si una fuente no responde o cambia de forma,
 * se usa el valor del análisis económico y la pantalla lo dice: nunca se
 * inventa un precio «de hoy».
 */

export interface PrecioKg {
  valor: number;
  fuente: string;
  /** Cuándo es el dato, en palabras: «remate de octubre de 2026». */
  cuando: string;
  enVivo: boolean;
}

export interface PreciosHacienda {
  compra: PrecioKg;
  venta: PrecioKg;
}

const SEIS_HORAS = 6 * 60 * 60 * 1000;
const ESPERA = 8_000;

const cache = globalThis as unknown as {
  preciosHacienda?: { hasta: number; precios: PreciosHacienda };
};

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const respaldoCompra: PrecioKg = {
  valor: SUPUESTOS.precioCompraKg,
  fuente: "Supuesto del análisis económico",
  cuando: "no se pudo traer el precio de hoy",
  enVivo: false,
};

const respaldoVenta: PrecioKg = {
  valor: SUPUESTOS.precioVentaKg,
  fuente: "Supuesto del análisis económico",
  cuando: "no se pudo traer el precio de hoy",
  enVivo: false,
};

/** ROSGAN: el índice del ternero del último remate con dato. */
async function compraRosgan(): Promise<PrecioKg> {
  const r = await fetch("https://www.rosgan.app/api/market-indices", {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(ESPERA),
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`ROSGAN ${r.status}`);
  const { data } = (await r.json()) as {
    data?: { indice_ternero?: number; anio_remate?: number; mes_remate?: number }[];
  };
  const ultimo = data?.find((d) => Number(d.indice_ternero) > 1000);
  if (!ultimo) throw new Error("ROSGAN sin índice");
  const mes = MESES[(ultimo.mes_remate ?? 1) - 1];
  return {
    valor: Math.round(Number(ultimo.indice_ternero)),
    fuente: "ROSGAN · Índice Ternero",
    cuando: `remate de ${mes} de ${ultimo.anio_remate}`,
    enVivo: true,
  };
}

const ddmmaaaa = (d: Date) =>
  d.toLocaleDateString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

const aNumero = (s: string) => Number(s.replace(/\./g, "").replace(",", "."));

/** Cañuelas: la fila de novillitos medianos en la tabla de precios por categoría. */
async function ventaCanuelas(): Promise<PrecioKg> {
  const hoy = new Date();
  // Si en la semana no hubo remates de esa categoría, se mira más atrás.
  for (const dias of [7, 21]) {
    const desde = new Date(hoy.getTime() - dias * 24 * 60 * 60 * 1000);
    const cuerpo = new URLSearchParams({
      ID: "",
      CP: "",
      FLASH: "",
      USUARIO: "SIN IDENTIFICAR",
      OPCIONMENU: "",
      OPCIONSUBMENU: "",
      txtFechaIni: ddmmaaaa(desde),
      txtFechaFin: ddmmaaaa(hoy),
    });
    const r = await fetch("https://www.mercadoagroganadero.com.ar/dll/hacienda1.dll/haciinfo000002", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: cuerpo,
      signal: AbortSignal.timeout(ESPERA),
      cache: "no-store",
    });
    if (!r.ok) throw new Error(`Cañuelas ${r.status}`);
    const html = new TextDecoder("latin1").decode(await r.arrayBuffer());

    for (const fila of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
      const celdas = [...fila[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((c) =>
        c[1].replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").trim(),
      );
      // Categoría, mínimo, máximo, promedio, mediana, cabezas, …
      if (/^NOVILLITOS\s+EyB\s+M/i.test(celdas[0] ?? "")) {
        const promedio = aNumero(celdas[3] ?? "");
        if (promedio > 1000) {
          const rango = html.match(/DESDE EL \w+ (\d{2}\/\d{2})\/\d{4} AL \w+ (\d{2}\/\d{2}\/\d{4})/i);
          return {
            valor: Math.round(promedio),
            fuente: "Mercado Agroganadero de Cañuelas · Novillitos 300 a 390 kg",
            cuando: rango ? `promedio del ${rango[1]} al ${rango[2]}` : "promedio de los últimos días",
            enVivo: true,
          };
        }
      }
    }
  }
  throw new Error("Cañuelas sin novillitos");
}

export async function getPreciosHacienda(): Promise<PreciosHacienda> {
  const guardado = cache.preciosHacienda;
  if (guardado && guardado.hasta > Date.now()) return guardado.precios;

  const [compra, venta] = await Promise.allSettled([compraRosgan(), ventaCanuelas()]);
  const precios: PreciosHacienda = {
    compra: compra.status === "fulfilled" ? compra.value : respaldoCompra,
    venta: venta.status === "fulfilled" ? venta.value : respaldoVenta,
  };
  // Si alguna falló, se vuelve a probar en diez minutos y no en seis horas.
  const ambas = precios.compra.enVivo && precios.venta.enVivo;
  cache.preciosHacienda = { hasta: Date.now() + (ambas ? SEIS_HORAS : 10 * 60 * 1000), precios };
  return precios;
}
