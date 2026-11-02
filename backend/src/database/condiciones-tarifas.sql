DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version=8) THEN
        ALTER TABLE usuarios DROP CONSTRAINT usuarios_metodo_pago_solicitado_check;
        ALTER TABLE usuarios ADD CONSTRAINT usuarios_metodo_pago_solicitado_check CHECK (metodo_pago_solicitado IN ('Efectivo','Transferencia','Tarjeta'));
        ALTER TABLE planes DROP CONSTRAINT planes_duracion_check;
        ALTER TABLE planes ADD CONSTRAINT planes_duracion_check CHECK (
            (meses IS NOT NULL AND dias IS NULL) OR (meses IS NULL AND dias IS NOT NULL AND dias BETWEEN 1 AND 3660)
        );
        ALTER TABLE pagos DROP CONSTRAINT pagos_duracion_check;
        ALTER TABLE pagos ADD CONSTRAINT pagos_duracion_check CHECK (
            (meses_contratados IS NOT NULL AND dias_contratados IS NULL) OR
            (meses_contratados IS NULL AND dias_contratados IS NOT NULL AND dias_contratados BETWEEN 1 AND 3660)
        );
        ALTER TABLE planes ADD COLUMN permite_tarjeta BOOLEAN NOT NULL DEFAULT TRUE;
        UPDATE planes SET permite_tarjeta=FALSE WHERE tipo IN ('pase-dia','pase-semanal','pase-quincena','jubilados');
        INSERT INTO schema_migrations VALUES (8);
    END IF;
END $$;
