-- ============================================================
-- Sección "Fiesta Def": la Coronación sola
-- ============================================================
-- /admin/fiesta-def es la vista de /admin/eventos/coronacion-mg1 con su propia
-- entrada en la navegación. Quien ya ve "Eventos y comunidad" la ve sin más:
-- las policies de la 024 no cambian.
--
-- Lo nuevo es poder concederle a alguien SOLO esta fiesta (secciones_extra =
-- 'fiesta-def'), por ejemplo a quien coordina con DEF. Esa persona lee:
--   - la fila de la fiesta,
--   - sus registros,
--   - las personas inscritas en ella y quienes las invitaron (sin el
--     promotor, el ranking de la fiesta quedaría con huecos).
-- Nada de la Gala, ni de otras fiestas, ni el historial de nadie.
--
-- Solo lectura. Acreditar en la puerta sigue exigiendo 'eventos:acreditar'
-- o puede_operar(), como en la 024.
--
-- El slug está fijo aquí y en EVENTO_FIESTA_DEF (lib/eventos.ts): si la
-- sección pasa a ser de otra fiesta, cambian los dos.

CREATE OR REPLACE FUNCTION public.puede_ver_fiesta_def()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
    SELECT public.tiene_seccion_extra('fiesta-def')
$$;

-- SECURITY DEFINER para que la policy de personas no dependa de la de
-- evento_registros (y no se encadenen al evaluarse).
CREATE OR REPLACE FUNCTION public.persona_en_fiesta_def(p UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.evento_registros r
        WHERE r.evento = 'coronacion-mg1'
          AND (r.persona_id = p OR r.referido_por = p)
    )
$$;

DROP POLICY IF EXISTS "eventos: la fiesta def" ON public.eventos;
CREATE POLICY "eventos: la fiesta def" ON public.eventos
    FOR SELECT TO authenticated
    USING (slug = 'coronacion-mg1' AND public.puede_ver_fiesta_def());

DROP POLICY IF EXISTS "registros de evento: la fiesta def" ON public.evento_registros;
CREATE POLICY "registros de evento: la fiesta def" ON public.evento_registros
    FOR SELECT TO authenticated
    USING (evento = 'coronacion-mg1' AND public.puede_ver_fiesta_def());

DROP POLICY IF EXISTS "personas: las de la fiesta def" ON public.personas;
CREATE POLICY "personas: las de la fiesta def" ON public.personas
    FOR SELECT TO authenticated
    USING (public.puede_ver_fiesta_def() AND public.persona_en_fiesta_def(id));
