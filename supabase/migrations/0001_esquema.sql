-- Guardian — esquema inicial
--
-- Traduce a tablas el modelo que hoy vive en src/lib/types.ts. Dos criterios lo
-- ordenan:
--
--   1. Lo que la interfaz decide hoy tiene que poder decidirse acá. Por eso las
--      restricciones que importan son de la base y no del código: un RFID en dos
--      proyectos vivos y una referencia bancaria repetida no dependen de que
--      alguien se acuerde de chequearlos.
--   2. Los importes son numeric. En punto flotante, sumar los aportes de un
--      proyecto y compararlos contra el objetivo da distinto según el orden.
--
-- Los identificadores son text y no uuid: la demo trae ids legibles (pry-2,
-- prod-1) que se leen en las URL y en los mensajes de error. Las filas nuevas
-- usan gen_random_uuid()::text, que convive sin problema.

-- ---------------------------------------------------------------------------
-- Enumeraciones. Son las uniones de types.ts: si aparece un valor que no está,
-- la escritura falla acá y no tres pantallas más adelante.
-- ---------------------------------------------------------------------------

create type rol as enum ('productor', 'colaborador', 'admin');

create type modalidad as enum ('compra_engorde', 'capital_trabajo');

-- La clasificación vieja, anterior a las dos modalidades. Se guarda para poder
-- rastrear de dónde salió la modalidad de un proyecto migrado.
create type destino_fondos as enum ('capital_trabajo', 'ciclo_engorde', 'mixto');

create type fuente_condicion as enum ('contrato', 'demostrativo');

create type base_tasa as enum ('anual', 'mensual', 'ciclo');

create type a_cargo_de as enum ('colaborador', 'productor', 'fideicomiso');

create type caso_contingencia as enum (
  'mortandad', 'sanitaria', 'demora', 'incumplimiento', 'precio'
);

create type tipo_posesion as enum (
  'promesa_inversion', 'existencia_comprobada', 'hibrido'
);

create type sistema_productivo as enum ('corral', 'pastura', 'mixto');

create type estado_proyecto as enum (
  'borrador', 'en_validacion', 'abierto', 'fondeado', 'en_curso', 'cerrado', 'rechazado'
);

create type tipo_documento as enum (
  'renspa', 'dte', 'romaneo', 'boleto_compraventa', 'listado_rfid',
  'poliza_seguro', 'otro'
);

create type estado_extraccion as enum ('pendiente', 'procesando', 'ok', 'error');
create type estado_consistencia as enum ('sin_revisar', 'consistente', 'con_discrepancias');
create type estado_autenticidad as enum ('sin_verificar', 'verificada', 'rechazada');
create type severidad as enum ('alta', 'media', 'baja');

create type tipo_garantia as enum (
  'hipoteca', 'prenda_rodeo', 'aval_establecimiento', 'cesion_derechos', 'fianza_personal'
);
create type estado_garantia as enum ('vigente', 'sin_verificar', 'vencida');
create type estado_constitucion as enum ('propuesta', 'en_revision', 'constituida');

create type estado_aporte as enum (
  'pendiente_acreditacion', 'acreditado_parcial', 'acreditado', 'devuelto'
);
create type estado_conciliacion as enum ('conciliado', 'con_diferencia', 'sin_identificar');
create type estado_liquidacion as enum ('calculada', 'aprobada', 'pagada');

create type alcance_restriccion as enum ('adhesiones', 'desembolsos');

-- ---------------------------------------------------------------------------
-- Participantes
-- ---------------------------------------------------------------------------

-- La identidad, separada del rol que cumple. Una misma persona puede ser
-- productor y colaborador: por eso el rol no es una columna de productores.
create table perfiles (
  id text primary key default gen_random_uuid()::text,
  -- El usuario de Supabase Auth, cuando haya login. Nulo mientras tanto.
  auth_user_id uuid unique,
  nombre text not null,
  correo text not null unique,
  telefono text not null,
  rol rol not null,
  creado_at date not null default current_date
);

create table productores (
  id text primary key default gen_random_uuid()::text,
  perfil_id text references perfiles (id) on delete set null,
  nombre text not null,
  razon_social text not null,
  responsable text not null,
  correo text not null,
  telefono text not null,
  cuit text not null,
  -- RENSPA y marca no se editan a mano: salen de la constancia de SENASA. La
  -- base no puede impedir un UPDATE, pero sí dejar escrito de dónde salen.
  renspa text not null,
  marca_registrada text not null,
  establecimiento text not null,
  localidad text not null,
  provincia text not null,
  sistema_productivo sistema_productivo not null,
  capacidad_instalada integer not null check (capacidad_instalada > 0),
  ocupacion_actual integer not null default 0 check (ocupacion_actual >= 0),
  ciclos_completados integer not null default 0 check (ciclos_completados >= 0),
  constraint ocupacion_dentro_de_capacidad
    check (ocupacion_actual <= capacidad_instalada)
);

create table colaboradores (
  id text primary key default gen_random_uuid()::text,
  perfil_id text references perfiles (id) on delete set null,
  nombre text not null,
  email text not null,
  telefono text not null,
  cuil text not null,
  alta_at date not null default current_date,
  -- Contra qué se verificó la identidad. Nulo es "todavía no".
  identidad_metodo text,
  identidad_fecha date,
  cbu_devolucion text,
  alias_devolucion text,
  constraint identidad_completa_o_vacia
    check ((identidad_metodo is null) = (identidad_fecha is null))
);

-- ---------------------------------------------------------------------------
-- Garantías. Viven en el productor y no en el proyecto: la misma hipoteca sirve
-- para varios ciclos, y el cupo es lo que evita que respalde diez a la vez.
-- ---------------------------------------------------------------------------

create table garantias (
  id text primary key default gen_random_uuid()::text,
  productor_id text not null references productores (id) on delete cascade,
  tipo tipo_garantia not null,
  identificacion text not null,
  descripcion text not null,
  valuacion_ars numeric(14, 2) not null check (valuacion_ars >= 0),
  cupo_proyectos integer not null check (cupo_proyectos > 0),
  vigencia_hasta date not null,
  estado estado_garantia not null,
  estado_constitucion estado_constitucion not null,
  instrumento text,
  -- El documento que la constituye. La clave foránea se agrega al final, cuando
  -- `documentos` ya existe.
  documento_id text
);

-- ---------------------------------------------------------------------------
-- Proyectos
-- ---------------------------------------------------------------------------

create table proyectos (
  id text primary key default gen_random_uuid()::text,
  productor_id text not null references productores (id) on delete restrict,
  titulo text not null,
  -- Nulo es "sin determinar", que no es lo mismo que una tercera modalidad: es
  -- un registro que nadie clasificó todavía, y no se publica así.
  modalidad modalidad,
  motivo_revision_modalidad text,
  destino_fondos_previo destino_fondos,
  destino_detalle text not null,
  tipo_posesion tipo_posesion not null,
  sistema_productivo sistema_productivo not null,
  cabezas integer not null check (cabezas > 0),
  categoria text not null,
  raza text not null,
  peso_entrada_kg integer not null check (peso_entrada_kg > 0),
  peso_salida_objetivo_kg integer not null,
  monto_objetivo_ars numeric(14, 2) not null check (monto_objetivo_ars >= 0),
  monto_recaudado_ars numeric(14, 2) not null default 0 check (monto_recaudado_ars >= 0),
  monto_liberado_ars numeric(14, 2) not null default 0 check (monto_liberado_ars >= 0),
  monto_retirado_ars numeric(14, 2) not null default 0 check (monto_retirado_ars >= 0),
  monto_minimo_inicio_ars numeric(14, 2),
  plazo_dias integer not null check (plazo_dias > 0),
  plazo_cobro_dias integer,
  rendimiento_esperado_pct numeric(6, 2) not null,
  garantia_id text references garantias (id) on delete restrict,
  tiene_seguro boolean not null default false,
  estado estado_proyecto not null,
  provincia text not null,
  creado_at date not null default current_date,
  publicado_at date,
  -- El romaneo de playa. Es lo único que describe el resultado real del ciclo,
  -- así que va junto y no disperso: o está entero o no está.
  resultado_dte_salida text,
  resultado_cabezas_faena integer,
  resultado_kilos_vivos numeric(12, 2),
  resultado_kg_carne numeric(12, 2),
  resultado_rendimiento_pct numeric(6, 2),
  resultado_fecha date,

  -- Un borrador tiene campos sin llenar, y eso es parte de ser borrador. Las
  -- reglas que describen un ciclo real se exigen desde que el proyecto sale a
  -- validación, que es cuando alguien lo mira.
  constraint engorde_suma_kilos
    check (
      estado in ('borrador', 'rechazado')
      or peso_salida_objetivo_kg > peso_entrada_kg
    ),
  -- No se puede retirar más de lo liberado, ni liberar más de lo recaudado.
  constraint retirado_no_supera_liberado
    check (monto_retirado_ars <= monto_liberado_ars),
  constraint liberado_no_supera_recaudado
    check (monto_liberado_ars <= monto_recaudado_ars),
  constraint resultado_entero_o_ausente
    check (
      (resultado_dte_salida is null and resultado_fecha is null)
      or (
        resultado_dte_salida is not null
        and resultado_cabezas_faena is not null
        and resultado_kilos_vivos is not null
        and resultado_kg_carne is not null
        and resultado_rendimiento_pct is not null
        and resultado_fecha is not null
      )
    ),
  -- Un proyecto publicado tiene modalidad. Que no se publique sin clasificar es
  -- una regla del negocio, no una preferencia de la pantalla que lo crea.
  constraint publicado_tiene_modalidad
    check (estado in ('borrador', 'en_validacion', 'rechazado') or modalidad is not null)
);

create index proyectos_estado_idx on proyectos (estado);
create index proyectos_productor_idx on proyectos (productor_id);
create index proyectos_provincia_idx on proyectos (provincia);

-- Las condiciones económicas se versionan: corregir una tasa no borra la que
-- estaba cuando alguien adhirió. La vigente es la de version más alta.
create table condiciones_economicas (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  version integer not null default 1,
  moneda_aporte text not null default 'ARS' check (moneda_aporte = 'ARS'),
  moneda_devolucion text not null default 'ARS' check (moneda_devolucion = 'ARS'),

  -- Compra y engorde: participación en el resultado.
  participacion_colaboradores_pct numeric(6, 2),
  participacion_productor_pct numeric(6, 2),
  participacion_base text,
  participacion_fuente fuente_condicion,

  -- Capital de trabajo: capital más tasa, con su base temporal.
  tasa_pct numeric(6, 2),
  tasa_base base_tasa,
  tasa_calculo text,
  tasa_vencimientos text,
  tasa_fuente fuente_condicion,

  -- La proyección del productor. No es el resultado y no se guarda como tal.
  proyeccion_fecha date,
  proyeccion_supuestos jsonb not null default '[]'::jsonb,
  proyeccion_ingresos_estimados_ars numeric(14, 2),
  proyeccion_costos_estimados_ars numeric(14, 2),
  proyeccion_comisiones_estimadas_ars numeric(14, 2),

  vigente_desde timestamptz not null default now(),
  unique (proyecto_id, version),
  -- Los porcentajes de reparto, cuando están, suman cien.
  constraint reparto_suma_cien
    check (
      participacion_colaboradores_pct is null
      or participacion_productor_pct is null
      or participacion_colaboradores_pct + participacion_productor_pct = 100
    )
);

create table comisiones (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  concepto text not null,
  base text not null,
  -- Nulo es "sin definir", y con una sola comisión sin definir la liquidación no
  -- se puede calcular. Se deja ver, no se completa con un supuesto.
  porcentaje numeric(6, 2),
  a_cargo_de a_cargo_de not null,
  momento text not null,
  fuente fuente_condicion not null,
  orden integer not null default 0
);

create table contingencias (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  caso caso_contingencia not null,
  que_dice text not null,
  a_cargo_de text not null,
  fuente fuente_condicion not null,
  orden integer not null default 0,
  unique (proyecto_id, caso)
);

create table presupuesto_rubros (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  rubro text not null,
  concepto text not null,
  proveedor text,
  monto_ars numeric(14, 2) not null check (monto_ars >= 0),
  periodo text not null,
  orden integer not null default 0
);

create table cronograma_hitos (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  hito text not null,
  momento text not null,
  monto_ars numeric(14, 2) not null check (monto_ars >= 0),
  condicion text not null,
  orden integer not null default 0
);

-- Un control sin alcance no dice nada: por eso alcance y método son not null.
create table controles (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  control text not null,
  fecha date not null,
  alcance text not null,
  metodo text not null,
  responsable text not null,
  orden integer not null default 0
);

create table restricciones (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  alcance alcance_restriccion not null,
  motivo text not null,
  responsable text not null,
  desde date not null,
  -- Levantar una restricción no la borra: se cierra con su fecha.
  hasta date
);

-- El fideicomiso de la serie. Guardian es el fiduciario.
create table fideicomisos (
  proyecto_id text primary key references proyectos (id) on delete cascade,
  serie text not null,
  fiduciario text not null,
  fiduciantes text not null,
  fideicomisarios text not null,
  bienes_fideicomitidos text not null,
  objeto text not null,
  reparto_resultado text not null,
  mortandad text not null,
  inicio_at date not null,
  extincion_at date not null,
  rendicion_cuentas text not null,
  seguro_responsabilidad_civil text not null,
  inscripcion text not null,
  -- El tope legal del plazo son 30 años (CCyC art. 1668).
  constraint plazo_dentro_del_tope
    check (extincion_at > inicio_at and extincion_at <= inicio_at + interval '30 years')
);

-- ---------------------------------------------------------------------------
-- Lote
-- ---------------------------------------------------------------------------

create table seguimiento (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  fecha date not null,
  cabezas integer not null check (cabezas >= 0),
  peso_promedio_kg numeric(8, 2) not null check (peso_promedio_kg > 0),
  mortandad integer not null default 0 check (mortandad >= 0),
  gasto_ars numeric(14, 2) not null default 0 check (gasto_ars >= 0),
  concepto_gasto text not null,
  nota text,
  unique (proyecto_id, fecha)
);

-- Las caravanas afectadas a un proyecto. La restricción de abajo es la que hace
-- que el mismo animal no pueda respaldar dos ciclos a la vez.
create table identificadores (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete cascade,
  identificador text not null,
  afectado_at timestamptz not null default now(),
  -- Cuando el animal sale del proyecto se libera con fecha, no se borra.
  liberado_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Documental
-- ---------------------------------------------------------------------------

create table documentos (
  id text primary key default gen_random_uuid()::text,
  -- Nulo cuando es documentación permanente del productor y no de un ciclo.
  proyecto_id text references proyectos (id) on delete cascade,
  productor_id text not null references productores (id) on delete cascade,
  tipo tipo_documento not null,
  nombre_archivo text not null,
  tiene_capa_texto boolean not null,
  subido_at date not null default current_date,
  estado_extraccion estado_extraccion not null default 'pendiente',
  estado_consistencia estado_consistencia not null default 'sin_revisar',
  -- Consistencia y autenticidad son dos cosas distintas y por eso son dos
  -- columnas. Que las cifras cierren no prueba que el papel sea auténtico.
  estado_autenticidad estado_autenticidad not null default 'sin_verificar',
  cuve text,
  controles_aritmeticos jsonb not null default '[]'::jsonb,
  observacion_admin text,
  -- La autenticidad de un DT-e se verifica con el CUVE ante SENASA: sin CUVE no
  -- hay con qué haberla verificado.
  constraint dte_verificado_tiene_cuve
    check (tipo <> 'dte' or estado_autenticidad <> 'verificada' or cuve is not null)
);

create index documentos_proyecto_idx on documentos (proyecto_id);
create index documentos_productor_idx on documentos (productor_id);

create table extracciones (
  id text primary key default gen_random_uuid()::text,
  documento_id text not null references documentos (id) on delete cascade,
  campo text not null,
  etiqueta text not null,
  valor text not null,
  confianza numeric(4, 3) not null check (confianza >= 0 and confianza <= 1),
  orden integer not null default 0,
  unique (documento_id, campo)
);

create table discrepancias (
  id text primary key default gen_random_uuid()::text,
  documento_id text not null references documentos (id) on delete cascade,
  campo text not null,
  etiqueta text not null,
  valor_declarado text not null,
  valor_extraido text not null,
  severidad severidad not null,
  detalle text not null,
  resuelta boolean not null default false,
  resolucion text,
  -- Una discrepancia resuelta dice cómo se resolvió. Sin eso, "resuelta" es una
  -- casilla tildada.
  constraint resuelta_tiene_resolucion
    check (not resuelta or resolucion is not null)
);

create index discrepancias_documento_idx on discrepancias (documento_id);

-- ---------------------------------------------------------------------------
-- Dinero
-- ---------------------------------------------------------------------------

create table aportes (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete restrict,
  colaborador_id text not null references colaboradores (id) on delete restrict,
  -- La emite el servidor y es única: es la referencia de la transferencia.
  orden_suscripcion text not null unique,
  monto_comprometido_ars numeric(14, 2) not null check (monto_comprometido_ars > 0),
  monto_acreditado_ars numeric(14, 2) not null default 0 check (monto_acreditado_ars >= 0),
  moneda text not null default 'ARS' check (moneda = 'ARS'),
  estado estado_aporte not null default 'pendiente_acreditacion',
  adhesion_at date not null default current_date,
  contrato_version text not null,
  constraint acreditado_no_supera_comprometido
    check (monto_acreditado_ars <= monto_comprometido_ars),
  -- El estado y los montos no pueden contradecirse: un aporte "acreditado" con
  -- menos plata que la comprometida es un aporte parcial mal rotulado.
  constraint estado_coherente_con_montos
    check (
      (estado = 'pendiente_acreditacion' and monto_acreditado_ars = 0)
      or (estado = 'acreditado_parcial'
          and monto_acreditado_ars > 0
          and monto_acreditado_ars < monto_comprometido_ars)
      or (estado = 'acreditado' and monto_acreditado_ars = monto_comprometido_ars)
      or estado = 'devuelto'
    )
);

create index aportes_proyecto_idx on aportes (proyecto_id);
create index aportes_colaborador_idx on aportes (colaborador_id);

create table movimientos_bancarios (
  id text primary key default gen_random_uuid()::text,
  aporte_id text references aportes (id) on delete set null,
  -- Única a propósito: es lo que hace que repetir la notificación del banco no
  -- duplique el aporte. Es la clave de idempotencia de la conciliación.
  referencia_externa text not null unique,
  importe_ars numeric(14, 2) not null check (importe_ars > 0),
  fecha date not null,
  estado_conciliacion estado_conciliacion not null default 'sin_identificar',
  observacion text,
  -- Un movimiento sin aporte es uno que no se pudo identificar. No se inventa la
  -- vinculación para que quede prolijo.
  constraint conciliado_tiene_aporte
    check (estado_conciliacion = 'sin_identificar' or aporte_id is not null)
);

create table liquidaciones (
  id text primary key default gen_random_uuid()::text,
  proyecto_id text not null references proyectos (id) on delete restrict,
  colaborador_id text not null references colaboradores (id) on delete restrict,
  concepto text not null,
  capital_ars numeric(14, 2) not null check (capital_ars >= 0),
  -- El resultado puede ser negativo: el colaborador participa de lo que salga.
  resultado_ars numeric(14, 2) not null,
  estado estado_liquidacion not null default 'calculada',
  fecha date not null,
  pagada_at date,
  -- Pagada no es aprobada, y aprobada no es calculada. La fecha de pago existe
  -- solo cuando está pagada.
  constraint pagada_tiene_fecha
    check ((estado = 'pagada') = (pagada_at is not null))
);

create index liquidaciones_colaborador_idx on liquidaciones (colaborador_id);

-- ---------------------------------------------------------------------------
-- Auditoría. Quién hizo qué, cuándo y por qué.
-- ---------------------------------------------------------------------------

create table auditoria (
  id bigint generated always as identity primary key,
  actor text not null,
  accion text not null,
  entidad text not null,
  entidad_id text not null,
  motivo text,
  cambios jsonb,
  ocurrido_at timestamptz not null default now()
);

create index auditoria_entidad_idx on auditoria (entidad, entidad_id);

-- Cerrada acá porque `garantias` se crea antes que `documentos`. Si el documento
-- se borra, la garantía sigue existiendo y queda sin instrumento cargado.
alter table garantias
  add constraint garantias_documento_id_fkey
  foreign key (documento_id) references documentos (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Las tres restricciones que el plan pide que estén en la base
-- ---------------------------------------------------------------------------

-- 1. Un identificador RFID no puede estar en dos proyectos vivos a la vez.
--    Parcial: una caravana liberada puede volver a afectarse a otro ciclo.
create unique index identificador_unico_en_proyectos_vivos
  on identificadores (identificador)
  where liberado_at is null;

-- 2. La referencia externa de un movimiento bancario es única. Está declarada
--    arriba como UNIQUE en la columna.

-- 3. Los importes van en numeric, nunca en punto flotante. Está en cada columna
--    de dinero: numeric(14, 2).

-- ---------------------------------------------------------------------------
-- Seguridad
--
-- RLS habilitada en todas las tablas y sin ninguna política. En Supabase la
-- clave anónima viaja al navegador, así que una tabla sin RLS es una tabla
-- pública. Sin políticas, nadie lee nada con esa clave.
--
-- Guardian renderiza en el servidor y lee con la cadena de conexión, como dueño
-- de la base: RLS no se le aplica, y esa cadena nunca sale del servidor. Cuando
-- entre el login, las políticas por rol se agregan acá, y recién ahí tiene
-- sentido darle lectura al cliente con la clave publicable.
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table %I enable row level security', t);
  end loop;
end
$$;
