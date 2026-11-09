-- Las firmas de los contratos.
--
-- Cada parte firma un contrato distinto: el colaborador, el de adhesión a la
-- serie; el productor, el del fideicomiso que la constituye. Se guarda qué
-- versión firmó y la huella (SHA-256) del texto que tuvo delante: si el texto
-- cambia después, la huella ya no coincide y se sabe que no es lo que firmó.
--
-- Mientras no haya proveedor de firma electrónica, la firma es un código de un
-- solo uso (simulado) y el método lo dice.

create table if not exists firmas (
  id text primary key default gen_random_uuid()::text,
  perfil_id text not null references perfiles (id) on delete restrict,
  proyecto_id text not null references proyectos (id) on delete restrict,
  rol text not null check (rol in ('colaborador', 'productor')),
  documento text not null check (documento in ('adhesion', 'fideicomiso')),
  contrato_version text not null,
  contrato_hash text not null check (contrato_hash ~ '^[0-9a-f]{64}$'),
  fiduciario text not null,
  metodo text not null,
  aporte_id text references aportes (id) on delete set null,
  firmado_at timestamptz not null default now(),
  -- El productor firma el fideicomiso de su proyecto una sola vez.
  constraint documento_segun_rol check (
    (rol = 'colaborador' and documento = 'adhesion')
    or (rol = 'productor' and documento = 'fideicomiso')
  )
);

create unique index if not exists firma_fideicomiso_unica
  on firmas (proyecto_id) where documento = 'fideicomiso';
create index if not exists firmas_perfil_idx on firmas (perfil_id);

alter table firmas enable row level security;
