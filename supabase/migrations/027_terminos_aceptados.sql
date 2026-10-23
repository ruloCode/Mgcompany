-- ============================================================
-- Qué términos aceptó cada persona, y cuándo
-- ============================================================
-- Las fiestas tienen términos y condiciones (lib/eventos-terminos.ts), y el
-- registro exige aceptarlos. Esta migración guarda la constancia: la VERSIÓN
-- aceptada y el momento. Si mañana alguien reclama, lo que protege a MG es
-- poder mostrar qué texto aceptó esa persona, no el que esté publicado hoy.
--
-- Se reescribe la última aceptación en cada registro (incluido un reenvío
-- del formulario), porque cada envío vuelve a marcar la casilla sobre el
-- texto vigente en ese momento.
--
-- Las dos columnas entran en la lista de campos que proteger_registro_evento
-- devuelve a su valor anterior cuando escribe alguien con sesión del panel:
-- una constancia que el equipo pudiera editar no constaría de nada.

ALTER TABLE public.evento_registros
    ADD COLUMN IF NOT EXISTS terminos_version TEXT,
    ADD COLUMN IF NOT EXISTS terminos_aceptados_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.evento_registros.terminos_version IS
    'Versión de los términos (lib/eventos-terminos.ts) aceptada en el último registro.';

CREATE OR REPLACE FUNCTION public.proteger_registro_evento()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    NEW.evento                := OLD.evento;
    NEW.persona_id            := OLD.persona_id;
    NEW.codigo                := OLD.codigo;
    NEW.referido_por          := OLD.referido_por;
    NEW.acepta_invitaciones   := OLD.acepta_invitaciones;
    NEW.origen                := OLD.origen;
    NEW.utm_source            := OLD.utm_source;
    NEW.utm_medium            := OLD.utm_medium;
    NEW.utm_campaign          := OLD.utm_campaign;
    NEW.user_agent            := OLD.user_agent;
    NEW.correo_enviado_at     := OLD.correo_enviado_at;
    NEW.pase_abierto_at       := OLD.pase_abierto_at;
    NEW.terminos_version      := OLD.terminos_version;
    NEW.terminos_aceptados_at := OLD.terminos_aceptados_at;
    NEW.created_at            := OLD.created_at;

    -- Quien solo acredita en la puerta marca el ingreso y nada más.
    IF NOT public.puede_operar() THEN
        NEW.notas := OLD.notas;
    END IF;
    RETURN NEW;
END;
$$;
