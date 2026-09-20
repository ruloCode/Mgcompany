-- ============================================================
-- MG1 — la mesa del jurado: 12 fichas por jurado, y un hilo comun
-- ============================================================
-- De los 44 inscritos la curaduria dejo 32 preseleccionados. De esos 32 el
-- jurado tiene que sacar 12. Esta migracion es la mesa donde eso ocurre:
-- /mg1/seleccion/<jurado>, una URL secreta por jurado, sin login.
--
-- Cuatro decisiones que explican las dos tablas:
--
-- 1. EL TOPE DE 12 LO IMPONE LA BASE. Es la misma leccion de la Gala: si el
--    limite vive en el route handler, dos pestañas abiertas —o un doble clic
--    sobre una conexion lenta— leen el mismo conteo de 11 y las dos escriben.
--    `mg1_tope_del_jurado` toma un advisory lock por (edicion, jurado) y
--    levanta excepcion en el voto 13. La interfaz promete "solo 12"; aqui se
--    cumple.
--
-- 2. EL VOTO ES UNA FILA, NO UNA COLUMNA. Marcar es INSERT y desmarcar es
--    DELETE. Asi el tope es un COUNT y no hay estado intermedio que limpiar;
--    ademas cada jurado solo toca sus propias filas, nunca las de otro.
--
-- 3. EL JURADO ES UN TEXTO, NO UN auth.users. Los jurados no tienen cuenta en
--    el panel y no la van a tener por tres semanas de curaduria: entran por un
--    enlace privado. El slug de ese enlace ES la identidad, igual que en
--    /mg1/jurado/<invitado>. El catalogo de slugs valido vive en
--    lib/mg1-seleccion.ts y lo valida el servidor antes de escribir; aqui solo
--    se guarda el texto. Consecuencia honesta y aceptada: quien tenga el
--    enlace vota como esa persona.
--
-- 4. LOS COMENTARIOS SON COMUNES; LOS VOTOS, NO. El jurado ve lo que
--    escribieron los demas (para eso se escribe) pero no a quien marcaron:
--    el primero en votar no puede arrastrar al resto. Ese recorte se hace en
--    la consulta del servidor, no aqui — la tabla guarda todo, y el panel de
--    MG si ve el consolidado completo.
--
-- Ninguna de las dos tablas se abre a `anon`: se escriben con la service_role
-- desde los route handlers, como mg1_inscripciones. Las lee, ademas, quien ya
-- podia leer la seccion MG1 del panel (018), para el consolidado de /admin.

-- ---------- el tope ----------
-- En una funcion y no como literal suelto para que el trigger, el consolidado
-- del panel y cualquier consulta futura lean el mismo numero.
CREATE OR REPLACE FUNCTION public.mg1_tope_jurado()
RETURNS INTEGER
LANGUAGE sql IMMUTABLE SET search_path = ''
AS $$ SELECT 12 $$;

COMMENT ON FUNCTION public.mg1_tope_jurado() IS
    'Cuantas fichas puede marcar cada jurado. Espejo de MG1_TOPE_JURADO en lib/mg1-seleccion.ts.';

-- ---------- votos ----------
CREATE TABLE IF NOT EXISTS public.mg1_jurado_votos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    edicion TEXT NOT NULL DEFAULT 'mg1-2026',

    -- Slug del enlace privado: 'jony-roy', 'miguelacho-tf', ...
    jurado TEXT NOT NULL,

    inscripcion_id UUID NOT NULL
        REFERENCES public.mg1_inscripciones(id) ON DELETE CASCADE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un jurado no marca dos veces a la misma persona. Sin esto, un doble clic
    -- gastaria dos de sus doce cupos en la misma ficha.
    CONSTRAINT mg1_voto_unico UNIQUE (edicion, jurado, inscripcion_id)
);

CREATE INDEX IF NOT EXISTS idx_mg1_votos_jurado
    ON public.mg1_jurado_votos (edicion, jurado);

CREATE INDEX IF NOT EXISTS idx_mg1_votos_inscripcion
    ON public.mg1_jurado_votos (inscripcion_id);

-- El tope, donde no se puede saltar.
CREATE OR REPLACE FUNCTION public.mg1_tope_del_jurado()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    marcadas INTEGER;
BEGIN
    -- Serializa los votos de ESTE jurado en ESTA edicion durante la
    -- transaccion. Dos jurados distintos no se estorban.
    PERFORM pg_advisory_xact_lock(hashtext('mg1votos:' || NEW.edicion || ':' || NEW.jurado));

    SELECT count(*) INTO marcadas
      FROM public.mg1_jurado_votos
     WHERE edicion = NEW.edicion AND jurado = NEW.jurado;

    IF marcadas >= public.mg1_tope_jurado() THEN
        -- El route handler traduce este SQLSTATE al mensaje que ve el jurado.
        RAISE EXCEPTION 'El jurado % ya tiene sus % fichas', NEW.jurado, public.mg1_tope_jurado()
            USING ERRCODE = 'check_violation';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS mg1_votos_tope ON public.mg1_jurado_votos;
CREATE TRIGGER mg1_votos_tope
    BEFORE INSERT ON public.mg1_jurado_votos
    FOR EACH ROW EXECUTE FUNCTION public.mg1_tope_del_jurado();

-- ---------- comentarios ----------
-- Tabla propia y no mg_comentarios (011) a proposito: alli el autor es un
-- perfil del panel (FK a auth.users) y un jurado invitado no tiene perfil.
-- Meterlo con autor NULL romperia las menciones y la moderacion de ese hilo.
CREATE TABLE IF NOT EXISTS public.mg1_jurado_comentarios (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    edicion TEXT NOT NULL DEFAULT 'mg1-2026',

    jurado TEXT NOT NULL,
    inscripcion_id UUID NOT NULL
        REFERENCES public.mg1_inscripciones(id) ON DELETE CASCADE,

    texto TEXT NOT NULL CHECK (length(btrim(texto)) > 0 AND length(texto) <= 1000),

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un comentario por jurado y ficha: se edita, no se acumula. La mesa es
    -- para opinar sobre 32 personas, no para un hilo de chat por persona.
    CONSTRAINT mg1_comentario_unico UNIQUE (edicion, jurado, inscripcion_id)
);

CREATE INDEX IF NOT EXISTS idx_mg1_comentarios_inscripcion
    ON public.mg1_jurado_comentarios (inscripcion_id);

DROP TRIGGER IF EXISTS set_mg1_comentarios_updated_at ON public.mg1_jurado_comentarios;
CREATE TRIGGER set_mg1_comentarios_updated_at
    BEFORE UPDATE ON public.mg1_jurado_comentarios
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------- RLS ----------
-- Mismo criterio que mg1_inscripciones: el publico no entra, ni a leer ni a
-- escribir. Los route handlers usan service_role (bypass de RLS) y validan el
-- slug del jurado antes de tocar nada.
ALTER TABLE public.mg1_jurado_votos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mg1_jurado_comentarios ENABLE ROW LEVEL SECURITY;

-- Quien ve la seccion MG1 del panel ve el consolidado. Es la misma regla de la
-- 018 y la misma funcion: si cambia la lista blanca de la seccion, cambia con
-- ella. Sin policy de INSERT/UPDATE/DELETE: el panel muestra, no vota.
DROP POLICY IF EXISTS "mg1: la curaduria lee los votos del jurado" ON public.mg1_jurado_votos;
CREATE POLICY "mg1: la curaduria lee los votos del jurado" ON public.mg1_jurado_votos
    FOR SELECT TO authenticated USING (public.puede_ver_mg1());

DROP POLICY IF EXISTS "mg1: la curaduria lee los comentarios del jurado" ON public.mg1_jurado_comentarios;
CREATE POLICY "mg1: la curaduria lee los comentarios del jurado" ON public.mg1_jurado_comentarios
    FOR SELECT TO authenticated USING (public.puede_ver_mg1());

COMMENT ON TABLE public.mg1_jurado_votos IS
    'Una fila = un jurado marco a un preseleccionado. Maximo 12 por jurado, impuesto por trigger.';
COMMENT ON TABLE public.mg1_jurado_comentarios IS
    'Lo que cada jurado deja escrito sobre una ficha. Visible para los demas jurados.';
COMMENT ON COLUMN public.mg1_jurado_votos.jurado IS
    'Slug del enlace privado. El catalogo valido vive en lib/mg1-seleccion.ts, no en la base.';
