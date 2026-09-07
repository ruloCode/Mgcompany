-- ============================================================
-- La Gala es el viernes 11 de SEPTIEMBRE, no el 11 de octubre
-- ============================================================
-- La 019 se escribio con la fecha equivocada y esa fecha viaja en el nombre
-- de la edicion, que es la clave por la que el trigger del aforo cuenta y por
-- la que el indice unico de correo agrupa. Cambiarla solo en lib/gala.ts
-- habria partido la tabla en dos: los registros viejos contando para una
-- edicion que ya no existe y los nuevos empezando el aforo desde cero.
--
-- Por eso se mueve el DEFAULT y se traen las filas que ya estaban.

ALTER TABLE public.gala_registros
    ALTER COLUMN edicion SET DEFAULT 'gala-2026-09-11';

UPDATE public.gala_registros
   SET edicion = 'gala-2026-09-11'
 WHERE edicion = 'gala-2026-10-11';

COMMENT ON COLUMN public.gala_registros.edicion IS
    'Edicion del evento. Agrupa el aforo y el indice unico de correo: gala-2026-09-11 es la primera.';
