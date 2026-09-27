import "server-only";
import { Pool } from "pg";
import type { Consultar } from "@/lib/data/postgres";

/**
 * La conexión a Postgres.
 *
 * `server-only` arriba no es decorativo: la cadena de conexión trae la
 * contraseña de la base, y ese import hace que el build falle si alguien
 * importa este archivo desde un componente de cliente, en vez de descubrirlo
 * cuando la credencial ya viajó al navegador.
 *
 * El pool se guarda en el objeto global porque en desarrollo Next recarga los
 * módulos en cada cambio: sin esto, cada recarga abre un pool nuevo y la base
 * termina rechazando conexiones.
 */

const global_ = globalThis as unknown as { poolGuardian?: Pool };

/**
 * Si hay una cadena de conexión de verdad.
 *
 * El marcador que trae la cadena de Supabase cuando se copia del panel cuenta
 * como no configurada: con él la variable está puesta pero la contraseña no es
 * una contraseña, y la app fallaría en cada pantalla en vez de caer al seed,
 * que es lo que uno espera cuando todavía no terminó de configurar.
 */
export function hayBaseConfigurada(): boolean {
  const url = process.env.DATABASE_URL;
  return Boolean(url) && !url!.includes("[YOUR-PASSWORD]");
}

function pool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Falta DATABASE_URL. Sin esa variable la app corre contra el seed en memoria; " +
        "esta función no debería haberse llamado.",
    );
  }

  global_.poolGuardian ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    // Supabase exige TLS. `rejectUnauthorized` en false porque el pooler presenta
    // un certificado que no encadena contra las CA del sistema; la conexión sigue
    // cifrada.
    ssl: process.env.DATABASE_URL.includes("localhost")
      ? undefined
      : { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 30_000,
  });

  return global_.poolGuardian;
}

export const consultar: Consultar = async <T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
): Promise<T[]> => {
  const { rows } = await pool().query(sql, params);
  return rows as T[];
};
