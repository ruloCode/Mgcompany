-- ============================================================
-- Nadie entra al panel sin que un admin lo diga
-- ============================================================
-- La 014 resolvia el alta en tres casos y en DOS de ellos la cuenta quedaba
-- activa sola: el primer usuario del sistema, y cualquiera cuyo correo
-- estuviera en mg_accesos_previstos.
--
-- El segundo caso era comodo pero rompia la regla que el equipo cree que rige:
-- "nadie entra hasta que alguien lo autorice". Y la rompia en silencio, porque
-- una fila escrita hace meses en una tabla que no tiene pantalla en el panel
-- activaba a alguien sin que nadie lo revisara ese dia.
--
-- Desde aqui la regla es una sola y se puede decir en una frase: **toda cuenta
-- nueva nace inactiva salvo la primera de todas**, que es la del owner que
-- monta el sistema y no tiene quien lo apruebe.
--
-- mg_accesos_previstos NO desaparece ni pierde su gracia: sigue decidiendo con
-- que ROL nace la cuenta, que es el trabajo aburrido. Lo unico que ya no hace
-- es saltarse al humano.
--
-- Ademas, hasta hoy nadie se enteraba de que alguien habia pedido acceso: el
-- admin tenia que pasar por /admin/equipo de casualidad. Ahora el alta deja un
-- aviso en la bandeja de cada owner y cada admin activos.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
    es_primero   BOOLEAN;
    previsto     public.mg_accesos_previstos%ROWTYPE;
    rol_final    public.rol_app;
    activo_final BOOLEAN;
    nombre_final TEXT;
BEGIN
    SELECT NOT EXISTS (SELECT 1 FROM public.perfiles) INTO es_primero;

    SELECT * INTO previsto
      FROM public.mg_accesos_previstos
     WHERE email = lower(NEW.email);

    nombre_final := COALESCE(
        NULLIF(NEW.raw_user_meta_data->>'nombre', ''),
        NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
        NULLIF(previsto.nombre, ''),
        split_part(NEW.email, '@', 1)
    );

    IF es_primero THEN
        -- El unico que no tiene quien lo apruebe: es quien monta la casa.
        rol_final := 'owner'; activo_final := true;
    ELSIF previsto.email IS NOT NULL THEN
        -- El rol previsto se respeta; la activacion, no. Llegar con el rol
        -- puesto ahorra el trabajo aburrido sin saltarse la decision.
        rol_final := previsto.rol; activo_final := false;
    ELSE
        rol_final := 'viewer'; activo_final := false;
    END IF;

    INSERT INTO public.perfiles (id, email, nombre, rol, activo)
    VALUES (NEW.id, NEW.email, nombre_final, rol_final, activo_final)
    ON CONFLICT (id) DO NOTHING;

    IF previsto.email IS NOT NULL THEN
        UPDATE public.mg_accesos_previstos
           SET usado_at = now()
         WHERE email = previsto.email;
    END IF;

    -- Un aviso por cada persona que puede aprobarla. Si no se activa sola,
    -- alguien tiene que saber que esta esperando.
    IF NOT es_primero THEN
        INSERT INTO public.mg_avisos (perfil_id, tipo, titulo, cuerpo, enlace, de_nombre)
        SELECT a.id,
               'aprobacion',
               nombre_final || ' pidió acceso al panel',
               'Entró como ' || rol_final::text || ' y está inactiva hasta que alguien la active. Correo: ' || NEW.email,
               '/admin/equipo',
               'Sistema'
          FROM public.perfiles a
         WHERE a.activo AND a.rol IN ('owner', 'admin');
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
    'Alta de cuenta: rol del previsto si lo hay, SIEMPRE inactiva salvo la primera del sistema, y aviso a owners y admins.';
