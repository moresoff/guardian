/**
 * Compara el repositorio de Postgres contra el del seed en memoria.
 *
 * Es la prueba que sostiene la migración: si las dos implementaciones, con los
 * mismos datos, devuelven lo mismo para las veintidós consultas, entonces
 * enchufar la base no cambió lo que ven las pantallas. Cuando difieren, la
 * diferencia se imprime campo por campo.
 *
 * Corre contra un Postgres en proceso (PGlite), así que no hace falta tener
 * ninguna base levantada ni credenciales de nadie:
 *
 *   npx tsx scripts/comparar-repositorios.ts
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { repositorioEnMemoria } from "@/lib/data/memoria";
import { crearRepositorioPostgres, type Consultar } from "@/lib/data/postgres";
import type { Repositorio } from "@/lib/data/repositorio";

async function main() {
  const db = new PGlite();
  await db.waitReady;
  await db.exec(readFileSync("supabase/migrations/0001_esquema.sql", "utf8"));
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));

  const consultar: Consultar = async <T>(sql: string, params: unknown[] = []) => {
    const r = await db.query(sql, params);
    return r.rows as T[];
  };

  const pg = crearRepositorioPostgres(consultar);
  const mem = repositorioEnMemoria;

  /**
   * Las consultas a comparar, con argumentos que tocan los casos que importan:
   * un proyecto abierto, uno cerrado, uno sin clasificar, el productor de la demo
   * y el colaborador de la demo.
   */
  const casos: { nombre: string; correr: (r: Repositorio) => Promise<unknown> }[] = [
    { nombre: "getProyectosPublicos()", correr: (r) => r.getProyectosPublicos() },
    {
      nombre: "getProyectosPublicos({ provincia: 'Córdoba' })",
      correr: (r) => r.getProyectosPublicos({ provincia: "Córdoba" }),
    },
    {
      nombre: "getProyectosPublicos({ modalidad: 'capital_trabajo' })",
      correr: (r) => r.getProyectosPublicos({ modalidad: "capital_trabajo" }),
    },
    {
      nombre: "getProyectosPublicos({ montoMaximo: 60_000_000 })",
      correr: (r) => r.getProyectosPublicos({ montoMaximo: 60_000_000 }),
    },
    { nombre: "getProyecto('pry-2')", correr: (r) => r.getProyecto("pry-2") },
    { nombre: "getProyecto('pry-9')", correr: (r) => r.getProyecto("pry-9") },
    { nombre: "getProyecto('pry-14')", correr: (r) => r.getProyecto("pry-14") },
    { nombre: "getProyecto('no-existe')", correr: (r) => r.getProyecto("no-existe") },
    {
      nombre: "getProyectosDeProductor('prod-1')",
      correr: (r) => r.getProyectosDeProductor("prod-1"),
    },
    { nombre: "getProyectosEnValidacion()", correr: (r) => r.getProyectosEnValidacion() },
    { nombre: "getProductor('prod-1')", correr: (r) => r.getProductor("prod-1") },
    { nombre: "getColaborador('col-1')", correr: (r) => r.getColaborador("col-1") },
    {
      nombre: "getDocumentosDeProyecto('pry-2')",
      correr: (r) => r.getDocumentosDeProyecto("pry-2"),
    },
    {
      nombre: "getDocumentosDeProductor('prod-1')",
      correr: (r) => r.getDocumentosDeProductor("prod-1"),
    },
    {
      nombre: "getDocumentosVigentesDeProyecto('pry-2', 'prod-1')",
      correr: (r) => r.getDocumentosVigentesDeProyecto("pry-2", "prod-1"),
    },
    {
      nombre: "getDocumentosPermanentes('prod-1')",
      correr: (r) => r.getDocumentosPermanentes("prod-1"),
    },
    {
      nombre: "getDiscrepanciasDeProyecto('pry-2')",
      correr: (r) => r.getDiscrepanciasDeProyecto("pry-2"),
    },
    {
      nombre: "getSaldosDeProductor('prod-1')",
      correr: (r) => r.getSaldosDeProductor("prod-1"),
    },
    {
      nombre: "getGarantiasDeProductor('prod-1')",
      correr: (r) => r.getGarantiasDeProductor("prod-1"),
    },
    { nombre: "getGarantiasConUso('prod-1')", correr: (r) => r.getGarantiasConUso("prod-1") },
    {
      nombre: "getSeguimientoDeProyecto('pry-9')",
      correr: (r) => r.getSeguimientoDeProyecto("pry-9"),
    },
    {
      nombre: "getAportesDeColaborador('col-1')",
      correr: (r) => r.getAportesDeColaborador("col-1"),
    },
    {
      nombre: "getAportesDeProyecto('pry-2')",
      correr: (r) => r.getAportesDeProyecto("pry-2"),
    },
    {
      nombre: "getLiquidacionesDeColaborador('col-1')",
      correr: (r) => r.getLiquidacionesDeColaborador("col-1"),
    },
    {
      nombre: "getCarteraDeColaborador('col-1')",
      correr: (r) => r.getCarteraDeColaborador("col-1"),
    },
  ];

  /**
   * Normaliza antes de comparar. `undefined` y una clave ausente son lo mismo para
   * el dominio, y JSON.stringify los trata distinto; lo mismo un array vacío que
   * viene de una tabla sin filas.
   */
  function normalizar(v: unknown): unknown {
    if (Array.isArray(v)) return v.map(normalizar);
    if (v && typeof v === "object") {
      const salida: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).sort()) {
        const valor = (v as Record<string, unknown>)[k];
        if (valor === undefined) continue;
        salida[k] = normalizar(valor);
      }
      return salida;
    }
    return v;
  }

  /** Dónde difieren dos estructuras, con la ruta del campo. */
  function diferencias(a: unknown, b: unknown, ruta = ""): string[] {
    if (JSON.stringify(a) === JSON.stringify(b)) return [];

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) {
        return [`${ruta}: memoria tiene ${a.length} y postgres ${b.length}`];
      }
      return a.flatMap((x, i) => diferencias(x, b[i], `${ruta}[${i}]`));
    }

    if (a && b && typeof a === "object" && typeof b === "object") {
      const claves = new Set([...Object.keys(a), ...Object.keys(b)]);
      return [...claves].flatMap((k) =>
        diferencias(
          (a as Record<string, unknown>)[k],
          (b as Record<string, unknown>)[k],
          ruta ? `${ruta}.${k}` : k,
        ),
      );
    }

    return [`${ruta}: memoria ${JSON.stringify(a)} · postgres ${JSON.stringify(b)}`];
  }

  let fallaron = 0;

  for (const caso of casos) {
    const enMemoria = normalizar(await caso.correr(mem));
    const enPostgres = normalizar(await caso.correr(pg));
    const dif = diferencias(enMemoria, enPostgres);

    if (dif.length === 0) {
      console.log(`  ok   ${caso.nombre}`);
    } else {
      fallaron++;
      console.log(`  MAL  ${caso.nombre}`);
      for (const d of dif.slice(0, 6)) console.log(`         ${d}`);
      if (dif.length > 6) console.log(`         … y ${dif.length - 6} diferencias más`);
    }
  }

  console.log(
    fallaron === 0
      ? `\nlas ${casos.length} consultas devuelven lo mismo en memoria y en Postgres`
      : `\n${fallaron} de ${casos.length} difieren`,
  );

  process.exit(fallaron === 0 ? 0 : 1);

}

main();
