-- Guardian financia solamente el proceso productivo de engorde y ya no es el
-- fiduciario de las series.
--
--  * Hay una sola modalidad: `compra_engorde`. Desaparecen `capital_trabajo`, la
--    tasa pactada y el "sin determinar", que existía solo para decidir entre dos.
--  * El fiduciario de cada serie es un tercero independiente de Guardian.
--
-- Corre sobre una base ya migrada con 0001: los proyectos que estaban como
-- capital de trabajo (o sin modalidad) pasan a compra y engorde. Su reparto del
-- resultado queda "Sin pactar" cuando no tenían uno: no se inventa un porcentaje.

-- Los proyectos que cobraban tasa no tenían participación: se marca pendiente.
update condiciones_economicas
   set participacion_base = 'Sin pactar',
       participacion_fuente = coalesce(participacion_fuente, 'demostrativo')
 where participacion_base is null;

update proyectos set modalidad = 'compra_engorde'
 where modalidad is null or modalidad::text = 'capital_trabajo';
update proyectos set destino_fondos_previo = 'ciclo_engorde'
 where destino_fondos_previo::text = 'capital_trabajo';

-- La regla "un proyecto publicado tiene modalidad" ya no tiene sentido: la
-- columna pasa a ser obligatoria.
alter table proyectos drop constraint publicado_tiene_modalidad;
alter table proyectos drop column motivo_revision_modalidad;

alter table proyectos alter column modalidad type text;
drop type modalidad;
create type modalidad as enum ('compra_engorde');
alter table proyectos
  alter column modalidad type modalidad using modalidad::modalidad,
  alter column modalidad set not null;

-- La clasificación vieja ya no distingue capital de trabajo.
alter table proyectos alter column destino_fondos_previo type text;
drop type destino_fondos;
create type destino_fondos as enum ('ciclo_engorde', 'mixto');
alter table proyectos
  alter column destino_fondos_previo type destino_fondos using destino_fondos_previo::destino_fondos;

-- Sin capital de trabajo no hay tasa.
alter table condiciones_economicas
  drop column tasa_pct,
  drop column tasa_base,
  drop column tasa_calculo,
  drop column tasa_vencimientos,
  drop column tasa_fuente;
drop type base_tasa;

-- Las series que nombraban a Guardian como fiduciario pasan a un fiduciario
-- tercero. El nombre es genérico y de demostración: se reemplaza por el real.
update fideicomisos
   set fiduciario = 'Fiduciaria Independiente S.A., fiduciario de la serie (tercero ajeno a Guardian)'
 where fiduciario like 'Guardian S.A.S.%';

comment on table fideicomisos is
  'El fideicomiso de la serie. El fiduciario es un tercero independiente de Guardian.';
