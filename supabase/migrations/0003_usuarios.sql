-- Las cuentas: `perfiles` ya guardaba la identidad (nombre, correo, teléfono,
-- lado). Se le agrega lo que hace falta para entrar con contraseña.
--
--  * `clave_hash`: la contraseña nunca se guarda; acá va el hash (scrypt) con su
--    sal. Las tablas tienen RLS sin políticas para la API pública, así que esta
--    columna solo la lee el servidor de la aplicación.
--  * `cuit`: el CUIT o CUIL que se declara al crear la cuenta.
--  * El correo se compara sin mayúsculas: no puede haber dos cuentas que difieran
--    solo en eso.
alter table perfiles add column if not exists clave_hash text;
alter table perfiles add column if not exists cuit text;
create unique index if not exists perfiles_correo_minusculas
  on perfiles (lower(correo));
