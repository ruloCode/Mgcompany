-- ============================================================
-- Rastro de los correos del pase
-- ============================================================
-- El pase se emite al confirmar, pero emitirlo y ENTREGARLO son dos cosas
-- distintas: alguien puede estar confirmado y no haber recibido nada. Sin esta
-- columna, la unica forma de saber a quien ya le llego seria la memoria de
-- quien apreto el boton — y con 80 personas, dos dias antes, eso termina en
-- gente en la puerta sin QR o en tres correos al mismo.
--
-- Guarda CUANDO se envio, no un booleano: si el pase se reemite (alguien lo
-- perdio), la fecha dice cual es el correo que esa persona tiene en la mano.

ALTER TABLE public.gala_registros
    ADD COLUMN IF NOT EXISTS correo_enviado_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.gala_registros.correo_enviado_at IS
    'Ultimo envio del correo con el pase. NULL = confirmado pero todavia no lo sabe.';
