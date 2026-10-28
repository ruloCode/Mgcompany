-- ============================================================
-- MG1 — la votacion del publico: un correo, un voto, y nadie ve el conteo
-- ============================================================
-- La pagina /mg1/votacion corona al campeon de MG1. Cierra el viernes 30 de
-- octubre a las 8:00 p.m. (hora Colombia), la misma noche de La Coronacion.
--
-- Cinco decisiones que explican la tabla y las dos funciones:
--
-- 1. UN VOTO ES UN CORREO CONFIRMADO. Votar deja la eleccion PENDIENTE y manda
--    un enlace al correo; solo al abrirlo y confirmar pasa a `finalista`. Lo
--    que no se confirma no cuenta, en ningun conteo. La identidad es
--    `email_clave` (normalizarEmail en lib/contacto.ts, la misma de `personas`
--    en la 024): `rulo+mg1@gmail.com` y `r.u.l.o@gmail.com` son un solo voto.
--
-- 2. LA VENTANA LA IMPONE LA BASE. `mg1_votacion_abre()` y
--    `mg1_votacion_cierra()` son la unica fuente de verdad del horario; el
--    route handler tambien mira la hora, pero una pestaña abierta desde antes
--    del cierre, o alguien llamando a la API a mano, choca aqui. Un voto
--    pedido ANTES del cierre puede confirmarse hasta 15 minutos despues: el
--    correo puede tardar, y perder el voto de quien voto a las 7:59 por culpa
--    de un servidor de correo seria injusto. Pedido despues, no entra.
--
-- 3. CAMBIAR DE VOTO SE PUEDE, PERO TAMBIEN SE CONFIRMA. Mientras la votacion
--    esta abierta, quien ya voto puede pedir otro finalista; el voto anterior
--    sigue contando hasta que confirme el nuevo desde su correo. Asi nadie le
--    cambia el voto a otro escribiendo su correo en el formulario.
--
-- 4. EL ENLACE NO SE GUARDA, SE GUARDA SU HUELLA. `token_hash` es el sha256
--    del token que viaja en el correo. Quien lea la tabla no puede confirmar
--    votos ajenos con lo que encuentra en ella.
--
-- 5. NADIE FUERA DE DIRECCION VE NADA. La tabla no se abre a `anon` ni para
--    escribir: el formulario llama a `mg1_solicitar_voto` con la service_role
--    desde app/api/mg1/votacion. Leer es solo de owner y admin (`es_admin()`),
--    mas estricto que la 018: ni `viewer` ni `manager` ven el resultado antes
--    de la coronacion. La pagina publica no recibe un solo conteo, nunca.
--    Tampoco el voto de una persona: la respuesta al formulario es la misma
--    sea un voto nuevo, un cambio o el voto que ya tenia. Lo que distingue un
--    caso de otro va en el correo, que solo lee el dueño del buzon.
--
-- Frenos contra bots, ademas de la confirmacion: honeypot en el formulario
-- (lo descarta el route handler), un minuto entre correos al mismo buzon, un
-- tope de correos por buzon y un tope de solicitudes por IP. La IP no se
-- guarda: se guarda su huella con sal (ip_hash).

-- ---------- la ventana ----------
-- En funciones y no como literales sueltos, igual que mg1_tope_jurado() en la
-- 022: las dos funciones de abajo y cualquier consulta futura leen lo mismo.
-- Espejo de MG1_VOTACION_ABRE / MG1_VOTACION_CIERRA en lib/mg1-votacion.ts:
-- cambiar la hora es cambiarla en los dos sitios.
CREATE OR REPLACE FUNCTION public.mg1_votacion_abre()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT '2026-10-23 19:00:00-05'::timestamptz $$;

CREATE OR REPLACE FUNCTION public.mg1_votacion_cierra()
RETURNS TIMESTAMP WITH TIME ZONE
LANGUAGE sql STABLE SET search_path = ''
AS $$ SELECT '2026-10-30 20:00:00-05'::timestamptz $$;

-- Cuanto despues del cierre se puede confirmar un voto pedido antes.
CREATE OR REPLACE FUNCTION public.mg1_votacion_gracia()
RETURNS INTERVAL
LANGUAGE sql IMMUTABLE SET search_path = ''
AS $$ SELECT interval '15 minutes' $$;

-- ---------- los votos ----------
CREATE TABLE IF NOT EXISTS public.mg1_votos_publico (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    edicion TEXT NOT NULL DEFAULT 'mg1-2026',

    -- A donde se manda el correo: tal cual lo escribio, en minusculas.
    email TEXT NOT NULL,
    -- Quien es: el buzon normalizado. Ver punto 1 arriba.
    email_clave TEXT NOT NULL,

    nombre TEXT NOT NULL CHECK (length(btrim(nombre)) BETWEEN 2 AND 80),
    ciudad TEXT NOT NULL CHECK (length(btrim(ciudad)) BETWEEN 2 AND 60),
    es_artista BOOLEAN NOT NULL,

    -- EL VOTO QUE CUENTA. NULL hasta que el correo se confirma.
    finalista TEXT,
    confirmado_at TIMESTAMP WITH TIME ZONE,

    -- Lo pedido y todavia no confirmado.
    finalista_pendiente TEXT,
    token_hash TEXT,
    token_expira TIMESTAMP WITH TIME ZONE,
    -- La huella del ultimo enlace usado: un segundo clic sobre el mismo
    -- correo dice "ya cuenta" en vez de "enlace invalido".
    token_usado_hash TEXT,

    solicitado_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    envios INTEGER NOT NULL DEFAULT 0,
    ultimo_envio_at TIMESTAMP WITH TIME ZONE,
    -- Cuantas veces confirmo un finalista distinto al que ya tenia.
    cambios INTEGER NOT NULL DEFAULT 0,

    ip_hash TEXT,
    user_agent TEXT,
    utm_source TEXT,
    utm_medium TEXT,
    utm_campaign TEXT,

    acepta_datos_at TIMESTAMP WITH TIME ZONE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT mg1_voto_publico_unico UNIQUE (edicion, email_clave),
    -- Un voto confirmado tiene las dos cosas o ninguna.
    CONSTRAINT mg1_voto_confirmado_coherente CHECK ((finalista IS NULL) = (confirmado_at IS NULL)),
    -- Un pendiente siempre viaja con su enlace, y un enlace con su pendiente.
    CONSTRAINT mg1_voto_pendiente_coherente CHECK (
        (finalista_pendiente IS NULL) = (token_hash IS NULL)
        AND (token_hash IS NULL) = (token_expira IS NULL)
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mg1_votos_publico_token
    ON public.mg1_votos_publico (token_hash) WHERE token_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mg1_votos_publico_token_usado
    ON public.mg1_votos_publico (token_usado_hash) WHERE token_usado_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mg1_votos_publico_finalista
    ON public.mg1_votos_publico (edicion, finalista) WHERE finalista IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_mg1_votos_publico_ip
    ON public.mg1_votos_publico (ip_hash, solicitado_at);

DROP TRIGGER IF EXISTS set_mg1_votos_publico_updated_at ON public.mg1_votos_publico;
CREATE TRIGGER set_mg1_votos_publico_updated_at
    BEFORE UPDATE ON public.mg1_votos_publico
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ---------- votar (deja el voto pendiente) ----------
-- Devuelve que debe hacer el route handler (y que NUNCA le repite a la
-- pagina: alli todo es "revisa tu correo", ver el punto 5):
--   'nuevo'     -> mandar el correo de confirmacion
--   'cambio'    -> mandar el correo de cambio de voto
--   'reciente'  -> NO mandar nada: ya salio un correo hace menos de un minuto
--   'ya_cuenta' -> mandar el aviso "tu voto ya cuenta", sin enlace
-- Lo que no se puede, se rechaza con excepcion: votacion_no_abierta,
-- votacion_cerrada, demasiados_intentos, tope_de_correos.
CREATE OR REPLACE FUNCTION public.mg1_solicitar_voto(
    p_email TEXT,
    p_email_clave TEXT,
    p_nombre TEXT,
    p_ciudad TEXT,
    p_es_artista BOOLEAN,
    p_finalista TEXT,
    p_token_hash TEXT,
    p_ip_hash TEXT,
    p_user_agent TEXT,
    p_utm_source TEXT,
    p_utm_medium TEXT,
    p_utm_campaign TEXT
)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    v_edicion CONSTANT TEXT := 'mg1-2026';
    v_fila public.mg1_votos_publico%ROWTYPE;
    v_por_ip INTEGER;
    v_expira TIMESTAMP WITH TIME ZONE;
BEGIN
    IF now() < public.mg1_votacion_abre() THEN
        RAISE EXCEPTION 'votacion_no_abierta';
    END IF;
    IF now() > public.mg1_votacion_cierra() THEN
        RAISE EXCEPTION 'votacion_cerrada';
    END IF;

    -- Serializa todo lo que pasa sobre ESTE buzon: un doble toque en un
    -- celular lento no manda dos correos ni crea dos filas.
    PERFORM pg_advisory_xact_lock(hashtext('mg1voto:' || v_edicion || ':' || p_email_clave));

    -- Tope por IP: 20 solicitudes en 10 minutos. Generoso a proposito: en
    -- Colombia los datos moviles salen por pocas IP compartidas (CGNAT), y una
    -- fiesta entera puede votar desde el mismo wifi. Esto no frena a la gente;
    -- frena a quien quiera usar el formulario para inundar buzones ajenos.
    IF p_ip_hash IS NOT NULL THEN
        SELECT count(*) INTO v_por_ip
          FROM public.mg1_votos_publico
         WHERE ip_hash = p_ip_hash AND solicitado_at > now() - interval '10 minutes';
        IF v_por_ip >= 20 THEN
            RAISE EXCEPTION 'demasiados_intentos';
        END IF;
    END IF;

    -- El enlace vence en 24 horas, o al terminar la gracia del cierre si eso
    -- llega antes.
    v_expira := least(now() + interval '24 hours', public.mg1_votacion_cierra() + public.mg1_votacion_gracia());

    SELECT * INTO v_fila
      FROM public.mg1_votos_publico
     WHERE edicion = v_edicion AND email_clave = p_email_clave
       FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO public.mg1_votos_publico (
            edicion, email, email_clave, nombre, ciudad, es_artista,
            finalista_pendiente, token_hash, token_expira,
            solicitado_at, envios, ultimo_envio_at,
            ip_hash, user_agent, utm_source, utm_medium, utm_campaign, acepta_datos_at
        ) VALUES (
            v_edicion, p_email, p_email_clave, p_nombre, p_ciudad, p_es_artista,
            p_finalista, p_token_hash, v_expira,
            now(), 1, now(),
            p_ip_hash, p_user_agent, p_utm_source, p_utm_medium, p_utm_campaign, now()
        );
        RETURN 'nuevo';
    END IF;

    -- Un correo por minuto al mismo buzon. Se responde sin error: la persona
    -- ya tiene un enlace en camino, solo tiene que esperarlo.
    IF v_fila.ultimo_envio_at IS NOT NULL AND v_fila.ultimo_envio_at > now() - interval '1 minute' THEN
        RETURN 'reciente';
    END IF;

    -- Nadie necesita mas de 10 correos para confirmar un voto. Pasado eso es
    -- alguien llenandole la bandeja a otra persona.
    IF v_fila.envios >= 10 THEN
        RAISE EXCEPTION 'tope_de_correos';
    END IF;

    -- Ya es su voto confirmado. Va DESPUES de los frenos porque tambien manda
    -- un correo (el que le dice "ya cuenta"): el route handler le responde a
    -- la pagina lo mismo que en cualquier otro caso, para que escribir el
    -- correo de otro y probar finalista por finalista no revele por quien
    -- voto. Y no toca nada mas: un cambio pendiente solo lo resuelve quien
    -- abre el buzon, no quien escribe el correo en el formulario.
    IF v_fila.finalista = p_finalista THEN
        UPDATE public.mg1_votos_publico
           SET envios = envios + 1,
               ultimo_envio_at = now()
         WHERE id = v_fila.id;
        RETURN 'ya_cuenta';
    END IF;

    -- El sello de envio va AQUI y no despues de mandar el correo: asi dos
    -- solicitudes simultaneas no mandan dos. Si el correo falla, la persona
    -- espera un minuto y lo vuelve a pedir.
    UPDATE public.mg1_votos_publico
       SET email = p_email,
           nombre = p_nombre,
           ciudad = p_ciudad,
           es_artista = p_es_artista,
           finalista_pendiente = p_finalista,
           token_hash = p_token_hash,
           token_expira = v_expira,
           solicitado_at = now(),
           envios = envios + 1,
           ultimo_envio_at = now(),
           ip_hash = p_ip_hash,
           user_agent = p_user_agent
     WHERE id = v_fila.id;

    RETURN CASE WHEN v_fila.finalista IS NULL THEN 'nuevo' ELSE 'cambio' END;
END;
$$;

-- ---------- confirmar (el voto pasa a contar) ----------
-- Devuelve el resultado y, si aplica, el finalista que quedo como voto:
--   'confirmado' | 'ya_confirmado' | 'vencido' | 'cerrada' | 'invalido'
CREATE OR REPLACE FUNCTION public.mg1_confirmar_voto(p_token_hash TEXT)
RETURNS TABLE (resultado TEXT, finalista TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
#variable_conflict use_column
-- (`finalista` es a la vez columna de salida y columna de la tabla.)
DECLARE
    v_fila public.mg1_votos_publico%ROWTYPE;
BEGIN
    SELECT * INTO v_fila
      FROM public.mg1_votos_publico
     WHERE token_hash = p_token_hash
       FOR UPDATE;

    IF NOT FOUND THEN
        -- ¿Un segundo clic sobre un enlace que ya sirvio?
        SELECT * INTO v_fila FROM public.mg1_votos_publico WHERE token_usado_hash = p_token_hash;
        IF FOUND AND v_fila.finalista IS NOT NULL THEN
            RETURN QUERY SELECT 'ya_confirmado'::TEXT, v_fila.finalista;
        ELSE
            RETURN QUERY SELECT 'invalido'::TEXT, NULL::TEXT;
        END IF;
        RETURN;
    END IF;

    -- Pedido despues del cierre (no deberia existir: solicitar ya lo impide),
    -- o confirmado pasada la gracia.
    IF v_fila.solicitado_at > public.mg1_votacion_cierra()
       OR now() > public.mg1_votacion_cierra() + public.mg1_votacion_gracia() THEN
        RETURN QUERY SELECT 'cerrada'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    IF v_fila.token_expira < now() THEN
        RETURN QUERY SELECT 'vencido'::TEXT, NULL::TEXT;
        RETURN;
    END IF;

    UPDATE public.mg1_votos_publico
       SET finalista = v_fila.finalista_pendiente,
           confirmado_at = now(),
           cambios = cambios + CASE
               WHEN v_fila.finalista IS NOT NULL AND v_fila.finalista <> v_fila.finalista_pendiente THEN 1
               ELSE 0 END,
           finalista_pendiente = NULL,
           token_hash = NULL,
           token_expira = NULL,
           token_usado_hash = p_token_hash
     WHERE id = v_fila.id;

    RETURN QUERY SELECT 'confirmado'::TEXT, v_fila.finalista_pendiente;
END;
$$;

-- Solo la service_role las llama. Sin esto, cualquiera con la publishable key
-- podria votar por RPC saltandose el honeypot y el correo de confirmacion.
REVOKE ALL ON FUNCTION public.mg1_solicitar_voto(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mg1_solicitar_voto(TEXT, TEXT, TEXT, TEXT, BOOLEAN, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.mg1_confirmar_voto(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mg1_confirmar_voto(TEXT) TO service_role;

-- ---------- RLS ----------
ALTER TABLE public.mg1_votos_publico ENABLE ROW LEVEL SECURITY;

-- Solo owner y admin. Sin policy de INSERT/UPDATE/DELETE: el panel mira, no
-- vota ni corrige votos. Un voto sospechoso se discute, no se borra en
-- silencio.
DROP POLICY IF EXISTS "mg1: direccion lee la votacion del publico" ON public.mg1_votos_publico;
CREATE POLICY "mg1: direccion lee la votacion del publico" ON public.mg1_votos_publico
    FOR SELECT TO authenticated USING (public.es_admin());

COMMENT ON TABLE public.mg1_votos_publico IS
    'Votacion del publico MG1. Una fila por correo; solo cuenta `finalista` (confirmado). Lectura: es_admin().';
COMMENT ON COLUMN public.mg1_votos_publico.finalista IS
    'Slug del finalista confirmado. El catalogo valido vive en lib/mg1-votacion.ts y lo valida el servidor.';
COMMENT ON COLUMN public.mg1_votos_publico.token_hash IS
    'sha256 del enlace de confirmacion pendiente. El enlace en claro solo existe en el correo.';
