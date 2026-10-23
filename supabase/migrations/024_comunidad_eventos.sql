-- ============================================================
-- Comunidad y eventos: una persona por correo, un pase por fiesta
-- ============================================================
-- La Gala (019) resolvio una fiesta. Esta migracion resuelve la siguiente y
-- todas las que vengan, porque el objetivo ya no es solo llenar una sala: es
-- conocer a la comunidad. Quien repite, quien trae gente, quien de esa gente
-- llega de verdad.
--
-- Primera fiesta que la usa: La Coronacion MG1, viernes 30 de octubre de 2026
-- en Def Jamaica Club (Soacha). Lista privada SIN cupo: quien tiene el enlace
-- se registra y recibe su QR al correo de una vez.
--
-- Cinco decisiones que explican las tres tablas:
--
-- 1. LA PERSONA ES EL CORREO. Una fila en `personas` por buzon, no por
--    registro. Asi "cuantas fiestas ha venido" es un COUNT y no una
--    adivinanza. Nombre y telefono NO sirven de identidad: el nombre se
--    escribe distinto cada vez y el telefono llega con y sin +57. La clave es
--    `email_clave`, el correo normalizado (ver normalizarEmail en
--    lib/contacto.ts, que es quien la calcula).
--
-- 2. EL QR LO EMITE LA BASE. `evento_emitir_codigo` pisa cualquier `codigo`
--    que llegue en el INSERT. Nadie elige su propio pase. Prefijo MGE- para
--    que en la puerta no se confunda con un pase de la Gala (MG-).
--
-- 3. EL ALTA ES UNA SOLA TRANSACCION. `registrar_en_evento` toma un advisory
--    lock por correo, crea o completa la persona, resuelve quien la invito y
--    crea el registro. Dos envios del mismo formulario en el mismo segundo
--    (doble toque en un celular lento) no pueden crear dos personas.
--
-- 4. EL PROMOTOR SE MIDE POR QUIEN ENTRA, NO POR QUIEN SE INSCRIBE. Cada
--    persona tiene un `codigo_ref` estable entre fiestas. Quien se registra con
--    ese enlace queda con `referido_por`. Inscribirse es gratis y no prueba
--    nada; entrar exige el QR que solo llego a un correo real. El panel cuenta
--    las dos cosas, pero la que vale es la segunda.
--
-- 5. LO QUE ESCRIBIO LA PERSONA ES SUYO. Desde el panel solo se toca lo que
--    pone el equipo: el TIPO de persona (publico, influencer, artista...), las
--    notas y el ingreso en la puerta. Los triggers `proteger_*` lo imponen
--    aunque alguien llame a la API con su propia sesion.
--
-- Nada de esto se abre a `anon`. El formulario publico escribe con la
-- service_role desde app/api/eventos/registro, como mg1_inscripciones y la Gala.

-- ---------- utilidades ----------

-- Alfabeto sin 0/O ni 1/I/L: estos codigos se dictan en voz alta en una
-- puerta con musica y se teclean a mano cuando la camara falla.
CREATE OR REPLACE FUNCTION public.codigo_aleatorio(largo INTEGER)
RETURNS TEXT
LANGUAGE sql VOLATILE SET search_path = ''
AS $$
    SELECT string_agg(
        substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 1 + floor(random() * 31)::int, 1),
        ''
    )
    FROM generate_series(1, largo)
$$;

-- ---------- eventos ----------

CREATE TABLE IF NOT EXISTS public.eventos (
    slug TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    fecha DATE NOT NULL,
    hora_puertas TIME NOT NULL,
    lugar TEXT NOT NULL,
    ciudad TEXT NOT NULL,
    -- La direccion exacta solo viaja en el correo de quien ya esta registrado.
    direccion TEXT,
    mapa_url TEXT,
    -- NULL = sin limite. Distinto de la Gala, que tenia 80 sillas.
    cupo INTEGER CHECK (cupo IS NULL OR cupo > 0),
    registro_cierra TIMESTAMP WITH TIME ZONE NOT NULL,
    -- Hasta cuando cuenta la actividad para el premio de la noche.
    concurso_cierra TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.eventos IS
    'Una fiesta. Los textos de la landing viven en lib/eventos.ts; aqui lo que el servidor necesita para decidir.';

INSERT INTO public.eventos (slug, nombre, fecha, hora_puertas, lugar, ciudad, direccion, mapa_url,
                            cupo, registro_cierra, concurso_cierra)
VALUES ('coronacion-mg1', 'La Coronación MG1', '2026-10-30', '18:00', 'Def Jamaica Club', 'Soacha',
        'Cra. 7, zona rosa de Soacha', NULL, NULL,
        '2026-10-30 23:59:59-05', '2026-10-30 20:00:00-05')
ON CONFLICT (slug) DO NOTHING;

-- ---------- personas ----------

CREATE TABLE IF NOT EXISTS public.personas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- A donde se manda el correo: tal cual lo escribio, en minusculas.
    email TEXT NOT NULL,
    -- Quien es: el correo normalizado. Ver punto 1 arriba.
    email_clave TEXT NOT NULL UNIQUE,

    nombre TEXT NOT NULL,
    whatsapp TEXT,
    -- +573001234567. Lo calcula normalizarWhatsapp; es el formato que piden
    -- Meta y TikTok para las audiencias.
    whatsapp_e164 TEXT,
    -- Usuario sin @ ni URL.
    instagram TEXT,
    tiktok TEXT,
    fecha_nacimiento DATE,
    -- Claves del catalogo GENEROS_EN_VIVO (lib/eventos.ts).
    generos TEXT[] NOT NULL DEFAULT '{}',

    -- Permiso para invitarla a proximas fiestas y para incluirla en pauta.
    -- Separado de la autorizacion de datos, que es obligatoria para registrarse.
    acepta_invitaciones BOOLEAN NOT NULL DEFAULT false,
    acepta_invitaciones_at TIMESTAMP WITH TIME ZONE,

    -- Lo marca el EQUIPO, nunca la persona.
    tipo TEXT NOT NULL DEFAULT 'publico'
        CHECK (tipo IN ('publico', 'influencer', 'creador', 'artista', 'marca', 'medio', 'produccion')),
    notas TEXT,

    -- Su enlace de promotor. Estable entre fiestas.
    codigo_ref TEXT NOT NULL UNIQUE,

    -- Cuando quedo demostrado que el buzon es suyo: abrio el pase que solo
    -- llego a ese correo, o entro con el QR. NULL = nunca lo ha demostrado.
    -- Es lo que una votacion futura puede usar para no volver a verificarla.
    email_verificado_at TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_personas_whatsapp ON public.personas (whatsapp_e164);
CREATE INDEX IF NOT EXISTS idx_personas_tipo ON public.personas (tipo);

DROP TRIGGER IF EXISTS set_personas_updated_at ON public.personas;
CREATE TRIGGER set_personas_updated_at
    BEFORE UPDATE ON public.personas
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE FUNCTION public.persona_emitir_ref()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    intento TEXT;
BEGIN
    LOOP
        intento := public.codigo_aleatorio(6);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.personas WHERE codigo_ref = intento);
    END LOOP;
    NEW.codigo_ref := intento;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS persona_emitir_ref_trigger ON public.personas;
CREATE TRIGGER persona_emitir_ref_trigger
    BEFORE INSERT ON public.personas
    FOR EACH ROW EXECUTE FUNCTION public.persona_emitir_ref();

-- ---------- registros ----------

CREATE TABLE IF NOT EXISTS public.evento_registros (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    evento TEXT NOT NULL REFERENCES public.eventos(slug),
    persona_id UUID NOT NULL REFERENCES public.personas(id) ON DELETE CASCADE,

    -- El pase. Lo pone el trigger.
    codigo TEXT NOT NULL UNIQUE,

    -- Quien la invito. Primer toque: si se vuelve a registrar con otro enlace,
    -- no se reescribe.
    referido_por UUID REFERENCES public.personas(id) ON DELETE SET NULL,

    -- Lo que acepto en ESTE registro, con su fecha (Ley 1581).
    acepta_invitaciones BOOLEAN NOT NULL DEFAULT false,

    origen TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,
    user_agent TEXT,

    correo_enviado_at TIMESTAMP WITH TIME ZONE,
    pase_abierto_at TIMESTAMP WITH TIME ZONE,
    ingreso_at TIMESTAMP WITH TIME ZONE,
    notas TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT evento_registro_unico UNIQUE (evento, persona_id),
    CONSTRAINT nadie_se_refiere_a_si_mismo CHECK (referido_por IS DISTINCT FROM persona_id)
);

CREATE INDEX IF NOT EXISTS idx_evento_registros_referido ON public.evento_registros (referido_por);
CREATE INDEX IF NOT EXISTS idx_evento_registros_evento ON public.evento_registros (evento, created_at DESC);

CREATE OR REPLACE FUNCTION public.evento_emitir_codigo()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    intento TEXT;
BEGIN
    LOOP
        intento := 'MGE-' || public.codigo_aleatorio(8);
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.evento_registros WHERE codigo = intento);
    END LOOP;
    NEW.codigo := intento;
    -- Nadie llega con el pase abierto ni con el ingreso marcado.
    NEW.pase_abierto_at := NULL;
    NEW.ingreso_at := NULL;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS evento_emitir_codigo_trigger ON public.evento_registros;
CREATE TRIGGER evento_emitir_codigo_trigger
    BEFORE INSERT ON public.evento_registros
    FOR EACH ROW EXECUTE FUNCTION public.evento_emitir_codigo();

-- Entrar con el QR prueba que el correo es suyo: el QR solo llego ahi.
CREATE OR REPLACE FUNCTION public.evento_ingreso_verifica_correo()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    IF NEW.ingreso_at IS NOT NULL AND OLD.ingreso_at IS NULL THEN
        UPDATE public.personas
           SET email_verificado_at = COALESCE(email_verificado_at, NEW.ingreso_at)
         WHERE id = NEW.persona_id;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS evento_ingreso_verifica_trigger ON public.evento_registros;
CREATE TRIGGER evento_ingreso_verifica_trigger
    AFTER UPDATE ON public.evento_registros
    FOR EACH ROW EXECUTE FUNCTION public.evento_ingreso_verifica_correo();

-- ---------- el alta, en una transaccion ----------

CREATE OR REPLACE FUNCTION public.registrar_en_evento(
    p_evento TEXT,
    p_email TEXT,
    p_email_clave TEXT,
    p_nombre TEXT,
    p_whatsapp TEXT,
    p_whatsapp_e164 TEXT,
    p_instagram TEXT,
    p_tiktok TEXT,
    p_fecha_nacimiento DATE,
    p_generos TEXT[],
    p_acepta_invitaciones BOOLEAN,
    p_ref TEXT,
    p_origen TEXT,
    p_utm_source TEXT,
    p_utm_medium TEXT,
    p_utm_campaign TEXT,
    p_user_agent TEXT
)
RETURNS TABLE (
    registro_id UUID,
    codigo TEXT,
    codigo_ref TEXT,
    nuevo BOOLEAN,
    correo_enviado_at TIMESTAMP WITH TIME ZONE,
    nombre TEXT,
    email TEXT
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    ev public.eventos%ROWTYPE;
    p public.personas%ROWTYPE;
    r public.evento_registros%ROWTYPE;
    invitador UUID;
    es_nuevo BOOLEAN := false;
BEGIN
    SELECT * INTO ev FROM public.eventos WHERE slug = p_evento;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'evento_inexistente' USING ERRCODE = 'no_data_found';
    END IF;
    IF now() > ev.registro_cierra THEN
        RAISE EXCEPTION 'registro_cerrado' USING ERRCODE = 'check_violation';
    END IF;

    -- Serializa todo lo que le pasa a ESTE correo durante la transaccion.
    PERFORM pg_advisory_xact_lock(hashtext('persona:' || p_email_clave));

    SELECT * INTO p FROM public.personas WHERE email_clave = p_email_clave;

    IF NOT FOUND THEN
        INSERT INTO public.personas (email, email_clave, nombre, whatsapp, whatsapp_e164, instagram,
                                     tiktok, fecha_nacimiento, generos, acepta_invitaciones,
                                     acepta_invitaciones_at, codigo_ref)
        VALUES (p_email, p_email_clave, p_nombre, p_whatsapp, p_whatsapp_e164, p_instagram,
                p_tiktok, p_fecha_nacimiento, COALESCE(p_generos, '{}'), p_acepta_invitaciones,
                CASE WHEN p_acepta_invitaciones THEN now() END, '')
        RETURNING * INTO p;
    ELSE
        -- Quien escribe un correo que ya existe todavia no ha demostrado que
        -- sea suyo. Por eso se COMPLETA lo que falta y nunca se reescribe lo
        -- que hay: si no, cualquiera podria cambiarle el WhatsApp o el
        -- Instagram a otra persona escribiendo su correo.
        UPDATE public.personas SET
            whatsapp = COALESCE(personas.whatsapp, p_whatsapp),
            whatsapp_e164 = COALESCE(personas.whatsapp_e164, p_whatsapp_e164),
            instagram = COALESCE(personas.instagram, p_instagram),
            tiktok = COALESCE(personas.tiktok, p_tiktok),
            fecha_nacimiento = COALESCE(personas.fecha_nacimiento, p_fecha_nacimiento),
            generos = (SELECT COALESCE(array_agg(DISTINCT g), '{}')
                         FROM unnest(personas.generos || COALESCE(p_generos, '{}')) AS g),
            acepta_invitaciones = personas.acepta_invitaciones OR p_acepta_invitaciones,
            acepta_invitaciones_at = CASE
                WHEN NOT personas.acepta_invitaciones AND p_acepta_invitaciones THEN now()
                ELSE personas.acepta_invitaciones_at END
        WHERE personas.id = p.id
        RETURNING * INTO p;
    END IF;

    IF p_ref IS NOT NULL AND p_ref <> '' THEN
        SELECT personas.id INTO invitador FROM public.personas WHERE personas.codigo_ref = upper(p_ref);
        IF invitador = p.id THEN
            invitador := NULL;
        END IF;
    END IF;

    SELECT * INTO r FROM public.evento_registros
     WHERE evento_registros.evento = p_evento AND evento_registros.persona_id = p.id;

    IF NOT FOUND THEN
        INSERT INTO public.evento_registros (evento, persona_id, codigo, referido_por, acepta_invitaciones,
                                             origen, utm_source, utm_medium, utm_campaign, user_agent)
        VALUES (p_evento, p.id, '', invitador, p_acepta_invitaciones,
                p_origen, p_utm_source, p_utm_medium, p_utm_campaign, p_user_agent)
        RETURNING * INTO r;
        es_nuevo := true;
    END IF;

    RETURN QUERY SELECT r.id, r.codigo, p.codigo_ref, es_nuevo, r.correo_enviado_at, p.nombre, p.email;
END;
$$;

-- Solo el servidor. El formulario no llama a esto: llama al route handler,
-- que valida y normaliza antes.
REVOKE ALL ON FUNCTION public.registrar_en_evento(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT[], BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.registrar_en_evento(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, TEXT[], BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ---------- quien ve y quien toca ----------

-- Espejo de SECCIONES_POR_ROL para la seccion 'eventos', igual que
-- puede_ver_gala() en la 019. Si la lista blanca cambia, cambian las dos.
CREATE OR REPLACE FUNCTION public.puede_ver_eventos()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
    SELECT public.tiene_rol('owner','admin','manager','viewer')
        OR public.tiene_seccion_extra('eventos')
        OR public.tiene_extra('eventos:acreditar')
$$;

CREATE OR REPLACE FUNCTION public.proteger_persona()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    -- Sin sesion: service_role (el formulario, el pase) o SQL directo.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Con sesion del panel solo cambia lo que pone el equipo.
    NEW.email                  := OLD.email;
    NEW.email_clave            := OLD.email_clave;
    NEW.nombre                 := OLD.nombre;
    NEW.whatsapp               := OLD.whatsapp;
    NEW.whatsapp_e164          := OLD.whatsapp_e164;
    NEW.instagram              := OLD.instagram;
    NEW.tiktok                 := OLD.tiktok;
    NEW.fecha_nacimiento       := OLD.fecha_nacimiento;
    NEW.generos                := OLD.generos;
    NEW.acepta_invitaciones    := OLD.acepta_invitaciones;
    NEW.acepta_invitaciones_at := OLD.acepta_invitaciones_at;
    NEW.codigo_ref             := OLD.codigo_ref;
    NEW.created_at             := OLD.created_at;
    -- La verificacion solo se puede PONER (al entrar con el QR), nunca quitar
    -- ni mover.
    IF OLD.email_verificado_at IS NOT NULL THEN
        NEW.email_verificado_at := OLD.email_verificado_at;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteger_persona_trigger ON public.personas;
CREATE TRIGGER proteger_persona_trigger
    BEFORE UPDATE ON public.personas
    FOR EACH ROW EXECUTE FUNCTION public.proteger_persona();

CREATE OR REPLACE FUNCTION public.proteger_registro_evento()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    NEW.evento              := OLD.evento;
    NEW.persona_id          := OLD.persona_id;
    NEW.codigo              := OLD.codigo;
    NEW.referido_por        := OLD.referido_por;
    NEW.acepta_invitaciones := OLD.acepta_invitaciones;
    NEW.origen              := OLD.origen;
    NEW.utm_source          := OLD.utm_source;
    NEW.utm_medium          := OLD.utm_medium;
    NEW.utm_campaign        := OLD.utm_campaign;
    NEW.user_agent          := OLD.user_agent;
    NEW.correo_enviado_at   := OLD.correo_enviado_at;
    NEW.pase_abierto_at     := OLD.pase_abierto_at;
    NEW.created_at          := OLD.created_at;

    -- Quien solo acredita en la puerta marca el ingreso y nada mas. Ni las
    -- notas: esas son de quien opera.
    IF NOT public.puede_operar() THEN
        NEW.notas := OLD.notas;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS proteger_registro_evento_trigger ON public.evento_registros;
CREATE TRIGGER proteger_registro_evento_trigger
    BEFORE UPDATE ON public.evento_registros
    FOR EACH ROW EXECUTE FUNCTION public.proteger_registro_evento();

ALTER TABLE public.eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_registros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "eventos: lo ve quien ve la seccion" ON public.eventos;
CREATE POLICY "eventos: lo ve quien ve la seccion" ON public.eventos
    FOR SELECT TO authenticated USING (public.puede_ver_eventos());

DROP POLICY IF EXISTS "personas: las ve quien ve la seccion" ON public.personas;
CREATE POLICY "personas: las ve quien ve la seccion" ON public.personas
    FOR SELECT TO authenticated USING (public.puede_ver_eventos());

DROP POLICY IF EXISTS "personas: el equipo las clasifica" ON public.personas;
CREATE POLICY "personas: el equipo las clasifica" ON public.personas
    FOR UPDATE TO authenticated
    USING (public.puede_operar()) WITH CHECK (public.puede_operar());

DROP POLICY IF EXISTS "registros de evento: los ve quien ve la seccion" ON public.evento_registros;
CREATE POLICY "registros de evento: los ve quien ve la seccion" ON public.evento_registros
    FOR SELECT TO authenticated USING (public.puede_ver_eventos());

DROP POLICY IF EXISTS "registros de evento: acreditar y anotar" ON public.evento_registros;
CREATE POLICY "registros de evento: acreditar y anotar" ON public.evento_registros
    FOR UPDATE TO authenticated
    USING (public.puede_operar() OR public.tiene_extra('eventos:acreditar'))
    WITH CHECK (public.puede_operar() OR public.tiene_extra('eventos:acreditar'));

-- Sin policy de INSERT ni DELETE para nadie con sesion: las altas entran por
-- el formulario (service_role) y un registro no se borra.

COMMENT ON TABLE public.personas IS
    'Una persona de la comunidad por correo. Su historial de fiestas esta en evento_registros.';
COMMENT ON TABLE public.evento_registros IS
    'Un pase por persona y fiesta. ingreso_at lo marca la puerta al leer el QR.';
COMMENT ON COLUMN public.personas.email_clave IS
    'Identidad: correo normalizado por lib/contacto.ts. Minusculas, sin +etiqueta y, en Gmail, sin puntos.';
