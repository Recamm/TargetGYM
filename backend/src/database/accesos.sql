DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version=3) THEN
        ALTER TABLE usuarios ADD COLUMN metodo_pago_solicitado TEXT
            CHECK (metodo_pago_solicitado IN ('Efectivo','Transferencia'));
        ALTER TABLE usuarios ADD COLUMN fecha_solicitud_plan TIMESTAMPTZ;
        ALTER TABLE usuarios ADD COLUMN pago_reportado_en TIMESTAMPTZ;
        ALTER TABLE usuarios ADD COLUMN acceso_pendiente BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE TABLE invitaciones_acceso (
            usuario_id INTEGER PRIMARY KEY REFERENCES usuarios(id),
            token_hash TEXT NOT NULL UNIQUE,
            expira TIMESTAMPTZ NOT NULL,
            usada_en TIMESTAMPTZ,
            administrador_id INTEGER NOT NULL REFERENCES usuarios(id)
        );
        INSERT INTO schema_migrations VALUES (3);
    END IF;
END $$;
