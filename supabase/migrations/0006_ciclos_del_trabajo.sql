-- El feedlot dura 90 días, como dice el análisis económico del trabajo final
-- (antes la demo usaba 131). Solo cambia los proyectos que tenían el valor viejo.
update proyectos set plazo_dias = 90 where sistema_productivo = 'corral' and plazo_dias = 131;

-- Los textos del presupuesto que nombran el plazo, en los proyectos que se pasaron a 90 días.
update presupuesto_rubros r set periodo = replace(r.periodo, '131 días', '90 días')
  from proyectos p
 where p.id = r.proyecto_id and p.sistema_productivo = 'corral' and r.periodo like '%131 días%';

-- El reparto del feedlot del trabajo: 68,22 % colaboradores y 31,78 % productor.
update condiciones_economicas c
   set participacion_colaboradores_pct = 68.22, participacion_productor_pct = 31.78
  from proyectos p
 where p.id = c.proyecto_id and p.sistema_productivo = 'corral'
   and c.participacion_colaboradores_pct = 67.99;
update fideicomisos
   set reparto_resultado = replace(replace(reparto_resultado, '67,99 %', '68,22 %'), '32,01 %', '31,78 %')
 where reparto_resultado like '%67,99 %%';
update proyectos set rendimiento_esperado_pct = 7.87
 where sistema_productivo = 'corral' and rendimiento_esperado_pct = 6.59;
