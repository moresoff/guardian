/**
 * Aplica las migraciones y, si se le pide, los datos de demostración.
 *
 *   npm run datos:migrar          solo el esquema
 *   npm run datos:migrar -- seed  el esquema y después el seed
 *
 * Lee `DATABASE_URL` de `.env.local`. La cadena no se imprime nunca: de la base
 * se dice a qué host se conectó y nada más, para que el log se pueda pegar en
 * cualquier lado sin filtrar la contraseña.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Client } from "pg";

function cargarEnvLocal() {
  let contenido: string;
  try {
    contenido = readFileSync(".env.local", "utf8");
  } catch {
    return;
  }
  for (const linea of contenido.split("\n")) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith("#")) continue;
    const i = limpia.indexOf("=");
    if (i === -1) continue;
    const clave = limpia.slice(0, i).trim();
    const valor = limpia.slice(i + 1).trim();
    if (valor && !process.env[clave]) process.env[clave] = valor;
  }
}

async function main() {
  cargarEnvLocal();

  // Las migraciones van por la conexión en modo sesión: el pooler en modo
  // transacción devuelve una conexión distinta entre sentencias, y una
  // migración necesita una sola para correr entera o no correr.
  const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!url || url.includes("[YOUR-PASSWORD]")) {
    console.error(
      "Falta la contraseña de la base en .env.local.\n" +
        "Sale de Supabase → Project Settings → Database, y reemplaza\n" +
        "[YOUR-PASSWORD] en DATABASE_URL y en DIRECT_URL.",
    );
    process.exit(1);
  }

  const conSeed = process.argv.includes("seed");

  // Solo el host, nunca la cadena entera.
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return "(host ilegible)";
    }
  })();

  const client = new Client({
    connectionString: url,
    ssl: url.includes("localhost") ? undefined : { rejectUnauthorized: false },
  });

  console.log(`conectando a ${host}`);
  await client.connect();

  const dir = "supabase/migrations";
  const migraciones = readdirSync(dir)
    .filter((n) => n.endsWith(".sql"))
    .sort();

  // Qué migraciones ya corrieron. Sin esto, correr el script dos veces fallaba en
  // la primera sentencia (`create type rol` ya existe) y no había forma de sumar
  // una migración nueva a una base ya creada.
  await client.query(
    `create table if not exists _migraciones (
       nombre text primary key,
       aplicada_at timestamptz not null default now()
     )`,
  );
  await client.query("alter table _migraciones enable row level security");
  const { rows: hechas } = await client.query<{ nombre: string }>(
    "select nombre from _migraciones",
  );
  const aplicadas = new Set(hechas.map((r) => r.nombre));

  // Una base migrada antes de que existiera el registro: tiene el esquema pero
  // no la lista. Las tres primeras migraciones son las que había entonces.
  if (aplicadas.size === 0) {
    const { rows: previa } = await client.query(
      "select 1 from pg_tables where schemaname = 'public' and tablename = 'perfiles'",
    );
    if (previa.length > 0) {
      for (const m of ["0001_esquema.sql", "0002_solo_engorde.sql", "0003_usuarios.sql"]) {
        await client.query("insert into _migraciones (nombre) values ($1) on conflict do nothing", [m]);
        aplicadas.add(m);
      }
    }
  }

  for (const m of migraciones) {
    if (aplicadas.has(m)) {
      console.log(`  ${m} ya estaba`);
      continue;
    }
    process.stdout.write(`  aplicando ${m} … `);
    // Cada migración va en su propia transacción: si falla a la mitad, no deja
    // media base creada.
    await client.query("begin");
    try {
      await client.query(readFileSync(join(dir, m), "utf8"));
      await client.query("insert into _migraciones (nombre) values ($1)", [m]);
      await client.query("commit");
      console.log("ok");
    } catch (e) {
      await client.query("rollback");
      console.log("falló");
      console.error(`\n${(e as Error).message}`);
      await client.end();
      process.exit(1);
    }
  }

  // El seed solo entra en una base vacía: cargarlo dos veces duplicaría claves.
  const { rows: conDatos } = await client.query("select 1 from proyectos limit 1");
  if (conSeed && conDatos.length > 0) {
    console.log("  supabase/seed.sql: la base ya tiene datos, no se carga de nuevo");
  } else if (conSeed) {
    process.stdout.write("  cargando supabase/seed.sql … ");
    await client.query("begin");
    try {
      await client.query(readFileSync("supabase/seed.sql", "utf8"));
      await client.query("commit");
      console.log("ok");
    } catch (e) {
      await client.query("rollback");
      console.log("falló");
      console.error(`\n${(e as Error).message}`);
      await client.end();
      process.exit(1);
    }
  }

  const { rows } = await client.query(
    `select count(*)::int tablas from pg_tables where schemaname = 'public' and tablename <> '_migraciones'`,
  );
  const { rows: sinRls } = await client.query(
    `select count(*)::int n from pg_tables where schemaname = 'public' and not rowsecurity`,
  );

  console.log(`\n${rows[0].tablas} tablas en public`);
  console.log(
    sinRls[0].n === 0
      ? "todas con RLS habilitada"
      : `ATENCIÓN: ${sinRls[0].n} tablas sin RLS`,
  );

  await client.end();
}

main();
