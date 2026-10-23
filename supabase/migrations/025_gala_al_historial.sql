-- ============================================================
-- La Gala entra al historial de la comunidad
-- ============================================================
-- La comunidad (024) nace para saber quien REPITE. Si arranca vacia, la
-- Coronacion seria la "primera fiesta" de todos y nadie repetiria hasta la
-- siguiente. Pero la Gala MG del 11 de septiembre ya paso, con 64 confirmados
-- y 32 que entraron por la puerta: esa es la primera fiesta de verdad.
--
-- Esta migracion la copia a `personas` + `evento_registros` sin tocar
-- `gala_registros`, que se queda como estaba (su panel, su puerta y sus
-- triggers siguen funcionando igual).
--
-- Decisiones del traspaso:
--
-- - La identidad se calcula igual que normalizarEmail() en lib/contacto.ts:
--   minusculas, sin +etiqueta y, en Gmail, sin puntos. Si las dos versiones
--   dejaran de coincidir, la misma persona apareceria dos veces. Por eso solo
--   se usa aqui, una vez: de ahora en adelante la clave la calcula siempre la
--   aplicacion.
-- - acepta_invitaciones = false para todos. En la Gala aceptaron que se
--   trataran sus datos para ESE evento, no que se les invitara a otros ni que
--   se subieran a pauta. Ese permiso lo dan, si quieren, al registrarse en la
--   proxima fiesta.
-- - El tipo de asistente que ELLOS declararon en la Gala se usa como punto de
--   partida (artista e influencer se respetan; el resto queda como publico).
--   El tipo es del equipo: se corrige desde el panel.
-- - Quien entro a la Gala queda con el correo verificado: su QR solo llego a
--   ese buzon.
-- - Los registros copiados reciben un codigo MGE- que nunca se envio a nadie.
--   Es inofensivo: la puerta de otra fiesta lo reconoce y dice "es de otra
--   fiesta".

INSERT INTO public.eventos (slug, nombre, fecha, hora_puertas, lugar, ciudad, direccion, cupo,
                            registro_cierra, concurso_cierra)
VALUES ('gala-2026-09-11', 'Gala MG', '2026-09-11', '18:00', 'Puente Aranda', 'Bogotá',
        'Cl. 4 # 31-24', 80, '2026-09-11 18:00:00-05', NULL)
ON CONFLICT (slug) DO NOTHING;

WITH base AS (
    SELECT g.*,
           split_part(split_part(lower(btrim(g.email)), '@', 1), '+', 1) AS local0,
           split_part(lower(btrim(g.email)), '@', 2) AS dominio0,
           regexp_replace(g.celular, '\D', '', 'g') AS digitos0
      FROM public.gala_registros g
     WHERE g.edicion = 'gala-2026-09-11'
),
normal AS (
    SELECT b.*,
           CASE WHEN b.dominio0 IN ('gmail.com', 'googlemail.com')
                THEN replace(b.local0, '.', '') || '@gmail.com'
                ELSE b.local0 || '@' || b.dominio0 END AS email_clave,
           CASE WHEN b.digitos0 LIKE '00%' THEN substr(b.digitos0, 3) ELSE b.digitos0 END AS digitos
      FROM base b
),
listo AS (
    SELECT DISTINCT ON (n.email_clave)
           n.*,
           CASE
               WHEN length(n.digitos) = 10 AND (n.digitos LIKE '3%' OR n.digitos LIKE '60%') THEN '+57' || n.digitos
               WHEN length(n.digitos) = 12 AND n.digitos LIKE '57%' THEN '+' || n.digitos
               WHEN btrim(n.celular) LIKE '+%' AND length(n.digitos) BETWEEN 8 AND 15 THEN '+' || n.digitos
           END AS whatsapp_e164,
           NULLIF(regexp_replace(split_part(split_part(regexp_replace(lower(btrim(coalesce(n.instagram, ''))),
                  '^(https?://)?(www\.)?instagram\.com/', ''), '/', 1), '?', 1), '^@+', ''), '') AS ig,
           NULLIF(regexp_replace(split_part(split_part(regexp_replace(lower(btrim(coalesce(n.tiktok, ''))),
                  '^(https?://)?(www\.)?tiktok\.com/', ''), '/', 1), '?', 1), '^@+', ''), '') AS tt
      FROM normal n
     -- Si alguien se registro dos veces, gana el registro que entro; si
     -- ninguno entro, el mas antiguo.
     ORDER BY n.email_clave, (n.ingreso_at IS NULL), n.created_at
)
INSERT INTO public.personas (email, email_clave, nombre, whatsapp, whatsapp_e164, instagram, tiktok,
                             tipo, acepta_invitaciones, email_verificado_at, codigo_ref, created_at)
SELECT lower(btrim(l.email)), l.email_clave, btrim(l.nombre_completo), l.celular, l.whatsapp_e164,
       CASE WHEN l.ig ~ '^[a-z0-9._]{1,30}$' THEN l.ig END,
       CASE WHEN l.tt ~ '^[a-z0-9._]{2,24}$' THEN l.tt END,
       CASE l.tipo_asistente WHEN 'artista' THEN 'artista' WHEN 'influencer' THEN 'influencer' ELSE 'publico' END,
       false,
       l.ingreso_at,
       '',
       l.created_at
  FROM listo l
ON CONFLICT (email_clave) DO NOTHING;

-- Un registro por persona en la Gala. El codigo lo pone el trigger; el
-- ingreso se copia DESPUES porque el trigger de alta lo borra (nadie llega
-- con el ingreso marcado), y la copia corre sin sesion, que es la unica via
-- que proteger_registro_evento deja escribir.
INSERT INTO public.evento_registros (evento, persona_id, codigo, correo_enviado_at, origen, created_at)
SELECT 'gala-2026-09-11', p.id, '', g.correo_enviado_at, 'traspaso-gala', g.created_at
  FROM public.personas p
  JOIN LATERAL (
        SELECT gr.*
          FROM public.gala_registros gr
         WHERE gr.edicion = 'gala-2026-09-11'
           AND (CASE WHEN split_part(lower(btrim(gr.email)), '@', 2) IN ('gmail.com', 'googlemail.com')
                     THEN replace(split_part(split_part(lower(btrim(gr.email)), '@', 1), '+', 1), '.', '') || '@gmail.com'
                     ELSE split_part(split_part(lower(btrim(gr.email)), '@', 1), '+', 1) || '@' || split_part(lower(btrim(gr.email)), '@', 2)
                END) = p.email_clave
         ORDER BY (gr.ingreso_at IS NULL), gr.created_at
         LIMIT 1
       ) g ON true
ON CONFLICT (evento, persona_id) DO NOTHING;

UPDATE public.evento_registros r
   SET ingreso_at = g.ingreso_at
  FROM public.personas p, public.gala_registros g
 WHERE r.evento = 'gala-2026-09-11'
   AND r.persona_id = p.id
   AND r.ingreso_at IS NULL
   AND g.edicion = 'gala-2026-09-11'
   AND g.ingreso_at IS NOT NULL
   AND lower(btrim(g.email)) = p.email;
