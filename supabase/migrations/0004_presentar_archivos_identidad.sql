-- Lo que hace falta para que la app escriba: presentar un proyecto, guardar los
-- archivos y validar la identidad.
--
--  * Cada cuenta queda vinculada a su ficha de productor o de colaborador
--    (`perfil_id` ya existía; acá se vuelve única).
--  * Un documento sabe dónde está su archivo: la ruta dentro del almacenamiento,
--    el tipo y el tamaño. El archivo en sí no va en la base.
--  * `verificaciones_identidad` guarda el resultado de la validación de identidad
--    (KYC) y los datos que se declaran en ella. Mientras no haya proveedor, la
--    verificación es simulada y el método lo dice.
--  * El bucket `documentos` es privado: sin políticas, solo el servidor de la
--    aplicación, con la clave secreta, puede leer o escribir.

create unique index if not exists productores_perfil_unico
  on productores (perfil_id) where perfil_id is not null;
create unique index if not exists colaboradores_perfil_unico
  on colaboradores (perfil_id) where perfil_id is not null;

alter table documentos add column if not exists ruta_archivo text;
alter table documentos add column if not exists tipo_mime text;
alter table documentos add column if not exists tamano_bytes integer
  check (tamano_bytes is null or tamano_bytes > 0);

create table if not exists verificaciones_identidad (
  id text primary key default gen_random_uuid()::text,
  perfil_id text not null references perfiles (id) on delete cascade,
  -- Lo que figura en el DNI.
  nombre text not null,
  apellido text not null,
  dni text not null check (dni ~ '^[0-9]{7,8}$'),
  fecha_nacimiento date not null,
  sexo text not null check (sexo in ('F', 'M', 'X')),
  nacionalidad text not null,
  -- Lo que se declara.
  cuit text not null check (cuit ~ '^[0-9]{11}$'),
  domicilio text not null,
  localidad text not null,
  provincia text not null,
  ocupacion text not null,
  pep boolean not null,
  sujeto_obligado boolean not null,
  origen_fondos text,
  cbu text check (cbu is null or cbu ~ '^[0-9]{22}$'),
  -- Las imágenes, en el almacenamiento privado.
  dni_frente_ruta text not null,
  dni_dorso_ruta text not null,
  selfie_ruta text not null,
  -- El resultado.
  prueba_de_vida boolean not null,
  coincidencia_facial numeric(4, 3) not null
    check (coincidencia_facial >= 0 and coincidencia_facial <= 1),
  estado text not null check (estado in ('aprobada', 'en_revision', 'rechazada')),
  metodo text not null,
  verificada_at timestamptz not null default now()
);

create index if not exists verificaciones_perfil_idx
  on verificaciones_identidad (perfil_id, verificada_at desc);

alter table verificaciones_identidad enable row level security;

-- El bucket solo existe en Supabase: en un Postgres suelto no hay esquema
-- `storage`, y ahí la app guarda los archivos en disco.
do $$
begin
  if exists (select 1 from pg_namespace where nspname = 'storage') then
    insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    values (
      'documentos', 'documentos', false, 10485760,
      array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    )
    on conflict (id) do nothing;
  end if;
end
$$;
