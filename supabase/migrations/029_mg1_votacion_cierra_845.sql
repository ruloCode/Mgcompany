-- La votacion del publico cierra a las 8:45 p.m. y no a las 8:00.
-- Espejo de MG1_VOTACION_CIERRA en lib/mg1-votacion.ts.
CREATE OR REPLACE FUNCTION public.mg1_votacion_cierra()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT '2026-10-30 20:45:00-05'::timestamptz $$;
