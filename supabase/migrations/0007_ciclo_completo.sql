-- El ciclo después de la participación: cerrarla (con el mínimo o sin él),
-- pagar la compra en un solo pago y liquidar.

-- Un proyecto que cerró la participación sin llegar al mínimo: no arranca y se
-- devuelven los aportes. No es «rechazado», que es una decisión de la validación.
alter type estado_proyecto add value if not exists 'desierto';

-- El único pago del fideicomiso al vendedor de la hacienda, en sus tres
-- instancias: requisitos verificados, pago aprobado y pago hecho. Cada una con
-- quién y cuándo, para la constancia que recibe el colaborador.
create table if not exists pagos_compra (
  proyecto_id text primary key references proyectos (id) on delete restrict,
  vendedor text not null,
  vendedor_cuit text not null,
  renspa_receptor text not null,
  cabezas integer not null check (cabezas > 0),
  kilos numeric(12, 2) not null check (kilos > 0),
  precio_kg_ars numeric(12, 2) not null check (precio_kg_ars > 0),
  monto_ars numeric(14, 2) not null check (monto_ars > 0),
  requisitos_at timestamptz not null default now(),
  requisitos_por text not null,
  aprobado_at timestamptz,
  aprobado_por text,
  pagado_at timestamptz,
  pagado_por text,
  constraint pago_en_orden check (
    (pagado_at is null or aprobado_at is not null)
  )
);

-- Como el resto: la app entra por el servidor, no por la API pública.
alter table pagos_compra enable row level security;
