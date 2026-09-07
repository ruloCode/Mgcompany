-- ============================================================
-- Gala MG — registro del primer evento presencial de la comunidad
-- ============================================================
-- 11 de octubre, 5:00 a 9:00 p.m. Privado, sin cover, aforo 80.
--
-- Tres decisiones que explican toda la tabla:
--
-- 1. NADIE se confirma solo. Todo registro entra en 'pending' y el equipo
--    aprueba a mano (derecho de admision reservado: hay que cuidar la
--    paridad ~60/40 y que la sala tenga la mezcla correcta de gremio). Por eso
--    el estado NO es un campo del formulario: lo pone un trigger, y un INSERT
--    que llegue con estado='confirmed' se ignora en silencio.
--
-- 2. El cupo se decide EN LA BASE, no en el route handler. Dos personas
--    enviando el formulario en el mismo segundo leerian el mismo conteo y las
--    dos entrarian como cupo principal. `gala_asignar_cupo` toma un advisory
--    lock por edicion, asi que la fila 81 siempre sale 'waitlist'.
--
-- 3. Pasar del cupo NO es un rechazo. La persona queda en 'waitlist' con su
--    ficha completa; si alguien cae, el equipo la sube a 'confirmed' desde el
--    panel y el pase se emite ahi mismo.
--
-- El QR no se guarda: se guarda `codigo`, y el pase se dibuja desde el codigo.
-- Solo existe cuando el estado es 'confirmed' — es la definicion misma de
-- "el QR se envia cuando se confirma", puesta donde no se puede saltar.
--
-- No se pide genero a proposito (se infiere del nombre para el analisis de
-- paridad) ni direccion: datos personales que no se usan, no se recogen.

-- ---------- aforo ----------
-- En una funcion y no como constante suelta para que el trigger, las metricas
-- y cualquier consulta futura lean el mismo numero. Cambiarlo es una migracion.
CREATE OR REPLACE FUNCTION public.gala_cupo()
RETURNS INTEGER
LANGUAGE sql IMMUTABLE SET search_path = ''
AS $$ SELECT 80 $$;

COMMENT ON FUNCTION public.gala_cupo() IS
    'Aforo total del salon de la Gala MG. Espejo de GALA_CUPO en lib/gala.ts.';

CREATE TABLE IF NOT EXISTS public.gala_registros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    edicion TEXT NOT NULL DEFAULT 'gala-2026-10-11',

    -- Lo que llena la persona
    nombre_completo TEXT NOT NULL,
    email TEXT NOT NULL,
    celular TEXT NOT NULL,
    nombre_artistico TEXT,
    tipo_asistente TEXT NOT NULL
        CHECK (tipo_asistente IN ('artista', 'productor', 'influencer', 'asistente')),
    instagram TEXT,
    tiktok TEXT,
    rango_edad TEXT NOT NULL
        CHECK (rango_edad IN ('16-20', '21-25', '26-30', '31-35', '36+')),

    -- Lo que decide el equipo
    estado TEXT NOT NULL DEFAULT 'pending'
        CHECK (estado IN ('pending', 'confirmed', 'waitlist', 'rejected')),
    notas TEXT,

    -- El pase. Solo existe si estado = 'confirmed'.
    codigo TEXT UNIQUE,
    confirmado_at TIMESTAMP WITH TIME ZONE,
    ingreso_at TIMESTAMP WITH TIME ZONE,

    -- Trazabilidad (Ley 1581 de 2012: constancia de la autorizacion)
    acepta_terminos BOOLEAN NOT NULL DEFAULT true,
    origen TEXT,
    user_agent TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    -- Un pase emitido sin confirmacion seria un QR valido para alguien que
    -- nadie aprobo. La invariante se declara aqui, no solo en el trigger.
    CONSTRAINT gala_codigo_solo_si_confirmado
        CHECK (codigo IS NULL OR estado = 'confirmed')
);

-- Un correo = un registro por edicion (case-insensitive), como en MG1.
CREATE UNIQUE INDEX IF NOT EXISTS idx_gala_registros_email_edicion
    ON public.gala_registros (lower(email), edicion);

CREATE INDEX IF NOT EXISTS idx_gala_registros_estado
    ON public.gala_registros (edicion, estado);

CREATE INDEX IF NOT EXISTS idx_gala_registros_created_at
    ON public.gala_registros (created_at DESC);

DROP TRIGGER IF EXISTS set_gala_registros_updated_at ON public.gala_registros;
CREATE TRIGGER set_gala_registros_updated_at
    BEFORE UPDATE ON public.gala_registros
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------- 1. el cupo lo reparte la base ----------
CREATE OR REPLACE FUNCTION public.gala_asignar_cupo()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    ocupados INTEGER;
BEGIN
    -- Serializa los registros de esta edicion durante la transaccion. Es un
    -- lock por texto de edicion, asi que dos ediciones distintas no se estorban.
    PERFORM pg_advisory_xact_lock(hashtext('gala:' || NEW.edicion));

    -- Cuentan los que ocupan silla: confirmados y los que esperan veredicto.
    -- Los rechazados liberan su silla; los de lista de espera nunca la tuvieron.
    SELECT count(*) INTO ocupados
      FROM public.gala_registros
     WHERE edicion = NEW.edicion
       AND estado IN ('pending', 'confirmed');

    NEW.estado := CASE WHEN ocupados >= public.gala_cupo() THEN 'waitlist' ELSE 'pending' END;

    -- Nadie llega confirmado ni con pase desde el formulario, venga lo que venga
    -- en el INSERT.
    NEW.codigo := NULL;
    NEW.confirmado_at := NULL;
    NEW.ingreso_at := NULL;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gala_asignar_cupo_trigger ON public.gala_registros;
CREATE TRIGGER gala_asignar_cupo_trigger
    BEFORE INSERT ON public.gala_registros
    FOR EACH ROW EXECUTE FUNCTION public.gala_asignar_cupo();

-- ---------- 2. el pase se emite al confirmar ----------
-- Al volver a 'confirmed' se reusa el codigo anterior a proposito: si alguien
-- se cae y luego vuelve a entrar, el QR que ya tiene en el celular sigue
-- sirviendo. La validez la decide el estado, no la existencia del codigo.
CREATE OR REPLACE FUNCTION public.gala_emitir_pase()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    intento TEXT;
BEGIN
    IF NEW.estado = 'confirmed' THEN
        IF NEW.codigo IS NULL THEN
            LOOP
                intento := 'MG-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
                EXIT WHEN NOT EXISTS (SELECT 1 FROM public.gala_registros WHERE codigo = intento);
            END LOOP;
            NEW.codigo := intento;
        END IF;
        IF NEW.confirmado_at IS NULL THEN
            NEW.confirmado_at := now();
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS gala_emitir_pase_trigger ON public.gala_registros;
CREATE TRIGGER gala_emitir_pase_trigger
    BEFORE UPDATE ON public.gala_registros
    FOR EACH ROW EXECUTE FUNCTION public.gala_emitir_pase();

-- ---------- 3. quien ve la seccion, lee la tabla ----------
-- Misma regla que la 018 para MG1, y por el mismo motivo: aqui hay nombre,
-- correo y celular de gente que no es del equipo. Quien no tiene que hablar
-- con ellos no tiene por que tener su telefono.
--
-- OJO AL ESPEJO: duplica en SQL lo que SECCIONES_POR_ROL decide en
-- lib/mg/permisos.ts. Si algun rol recortado recibe la seccion 'gala', hay que
-- añadir una migracion aqui o la pantalla saldra vacia sin explicar por que.
CREATE OR REPLACE FUNCTION public.puede_ver_gala()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
    SELECT public.tiene_rol('owner','admin','manager','viewer')
        OR public.tiene_seccion_extra('gala')
        OR public.tiene_extra('gala:acreditar')
$$;

-- Quien esta en la puerta la noche del evento marca ingresos y anota; no
-- decide admisiones. Es el mismo reparto que 'mg1:contactar': una tarea
-- concreta con lo minimo para hacerla.
CREATE OR REPLACE FUNCTION public.proteger_admision_gala()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    -- Sin sesion es la service_role (el route handler publico y mantenimiento).
    IF auth.uid() IS NULL OR public.puede_operar() THEN
        RETURN NEW;
    END IF;

    IF NEW.estado IS DISTINCT FROM OLD.estado THEN
        RAISE EXCEPTION 'Admitir o rechazar en la Gala requiere rol owner, admin o manager';
    END IF;

    -- Lo que escribio la persona en el formulario es suyo: se lee, no se reescribe.
    NEW.edicion          := OLD.edicion;
    NEW.nombre_completo  := OLD.nombre_completo;
    NEW.email            := OLD.email;
    NEW.celular          := OLD.celular;
    NEW.nombre_artistico := OLD.nombre_artistico;
    NEW.tipo_asistente   := OLD.tipo_asistente;
    NEW.instagram        := OLD.instagram;
    NEW.tiktok           := OLD.tiktok;
    NEW.rango_edad       := OLD.rango_edad;
    NEW.codigo           := OLD.codigo;
    NEW.confirmado_at    := OLD.confirmado_at;
    NEW.acepta_terminos  := OLD.acepta_terminos;
    NEW.origen           := OLD.origen;
    NEW.user_agent       := OLD.user_agent;
    NEW.created_at       := OLD.created_at;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteger_admision_gala_trigger ON public.gala_registros;
CREATE TRIGGER proteger_admision_gala_trigger
    BEFORE UPDATE ON public.gala_registros
    FOR EACH ROW EXECUTE FUNCTION public.proteger_admision_gala();

ALTER TABLE public.gala_registros ENABLE ROW LEVEL SECURITY;

-- El formulario publico solo puede AGREGAR. Lo que llegue en `estado` o
-- `codigo` lo pisa el trigger, asi que un INSERT desde el cliente no se puede
-- colar en la lista de confirmados.
DROP POLICY IF EXISTS "Cualquiera puede registrarse a la Gala" ON public.gala_registros;
CREATE POLICY "Cualquiera puede registrarse a la Gala" ON public.gala_registros
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "gala: solo quien admite o acredita lee los registros" ON public.gala_registros;
CREATE POLICY "gala: solo quien admite o acredita lee los registros" ON public.gala_registros
    FOR SELECT TO authenticated USING (public.puede_ver_gala());

DROP POLICY IF EXISTS "gala: admitir y acreditar" ON public.gala_registros;
CREATE POLICY "gala: admitir y acreditar" ON public.gala_registros
    FOR UPDATE TO authenticated
    USING (public.puede_operar() OR public.tiene_extra('gala:acreditar'))
    WITH CHECK (public.puede_operar() OR public.tiene_extra('gala:acreditar'));

-- Sin policy de DELETE: un registro no se borra, se marca 'rejected'. La lista
-- de quien pidio entrar es justamente lo que hay que poder revisar despues.

COMMENT ON TABLE public.gala_registros IS
    'Registros a la Gala MG. Datos personales de asistentes: lectura restringida a quien ve la seccion (puede_ver_gala).';
COMMENT ON COLUMN public.gala_registros.estado IS
    'pending = registrado a la espera de aprobacion; confirmed = adentro (unico estado con pase); waitlist = llego pasado el aforo; rejected = derecho de admision.';
COMMENT ON COLUMN public.gala_registros.codigo IS
    'Codigo del pase QR. Lo emite gala_emitir_pase() al confirmar; NULL mientras no lo este.';
COMMENT ON COLUMN public.gala_registros.ingreso_at IS
    'Marca de entrada la noche del evento. NULL = todavia no ha llegado.';

-- ---------- las funciones de trigger no son API ----------
-- PostgREST expone en /rest/v1/rpc todo lo que sea ejecutable. Llamar a una
-- funcion de trigger por ahi falla igual ("can only be called as triggers"),
-- pero no tiene por que estar ofrecida: se quita el permiso y se acaba el ruido.
REVOKE EXECUTE ON FUNCTION public.gala_asignar_cupo() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gala_emitir_pase() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.proteger_admision_gala() FROM anon, authenticated;
