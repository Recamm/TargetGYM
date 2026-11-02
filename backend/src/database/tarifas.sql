DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version=6) THEN
        ALTER TABLE planes ALTER COLUMN meses DROP NOT NULL;
        ALTER TABLE planes ADD COLUMN dias INTEGER;
        ALTER TABLE planes ADD CONSTRAINT planes_duracion_check CHECK (
            (meses IS NOT NULL AND dias IS NULL) OR (meses IS NULL AND dias IS NOT NULL AND dias BETWEEN 1 AND 3660)
        );
        ALTER TABLE planes ADD COLUMN precio_descuento_centavos INTEGER;
        ALTER TABLE planes ADD CONSTRAINT planes_precio_descuento_check CHECK (
            precio_descuento_centavos IS NULL OR (precio_centavos IS NOT NULL AND precio_descuento_centavos>0
            AND precio_descuento_centavos<precio_centavos AND descuento_porcentaje=0)
        );
        ALTER TABLE planes ADD COLUMN descripcion TEXT NOT NULL DEFAULT '' CHECK (length(descripcion)<=500);
        ALTER TABLE planes ADD COLUMN requisitos_acceso TEXT NOT NULL DEFAULT '' CHECK (length(requisitos_acceso)<=500);
        ALTER TABLE planes ADD COLUMN metodo_exclusivo TEXT CHECK (metodo_exclusivo IN ('Efectivo','Transferencia','Tarjeta'));
        ALTER TABLE pagos ALTER COLUMN meses_contratados DROP NOT NULL;
        ALTER TABLE pagos ADD COLUMN dias_contratados INTEGER;
        ALTER TABLE pagos ADD CONSTRAINT pagos_duracion_check CHECK (
            (meses_contratados IS NOT NULL AND dias_contratados IS NULL) OR
            (meses_contratados IS NULL AND dias_contratados IS NOT NULL AND dias_contratados BETWEEN 1 AND 3660)
        );
        ALTER TABLE pagos ADD COLUMN descuento_centavos INTEGER NOT NULL DEFAULT 0 CHECK (descuento_centavos>=0);
        UPDATE pagos SET descuento_centavos=GREATEST(0,precio_base_centavos-monto_centavos);
        ALTER TABLE pagos ADD COLUMN confirmacion_requisitos BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE pagos ADD COLUMN requisitos_acceso TEXT NOT NULL DEFAULT '';
        ALTER TABLE cambios_plan ADD COLUMN requisitos_verificados TEXT NOT NULL DEFAULT '';
        INSERT INTO schema_migrations VALUES (6);
    END IF;
END $$;
