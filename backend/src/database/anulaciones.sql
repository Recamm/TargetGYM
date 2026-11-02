DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version=5) THEN
        ALTER TABLE membresias ADD COLUMN anulada BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE membresias ADD COLUMN fecha_inicio_original TIMESTAMPTZ;
        ALTER TABLE membresias ADD COLUMN fecha_vencimiento_original TIMESTAMPTZ;
        UPDATE membresias SET fecha_inicio_original=fecha_inicio,fecha_vencimiento_original=fecha_vencimiento;
        ALTER TABLE membresias ALTER COLUMN fecha_inicio_original SET NOT NULL;
        ALTER TABLE membresias ALTER COLUMN fecha_vencimiento_original SET NOT NULL;
        ALTER TABLE pagos ADD COLUMN meses_contratados INTEGER;
        UPDATE pagos p SET meses_contratados=(
            SELECT (
                (EXTRACT(YEAR FROM (m.fecha_vencimiento_original AT TIME ZONE 'America/Argentina/Buenos_Aires')) -
                 EXTRACT(YEAR FROM (GREATEST(p.fecha,anterior.fecha_vencimiento_original) AT TIME ZONE 'America/Argentina/Buenos_Aires'))) * 12 +
                EXTRACT(MONTH FROM (m.fecha_vencimiento_original AT TIME ZONE 'America/Argentina/Buenos_Aires')) -
                EXTRACT(MONTH FROM (GREATEST(p.fecha,anterior.fecha_vencimiento_original) AT TIME ZONE 'America/Argentina/Buenos_Aires'))
            )::INTEGER FROM membresias m LEFT JOIN LATERAL (
                SELECT fecha_vencimiento_original FROM membresias WHERE socio_id=m.socio_id AND id<m.id ORDER BY id DESC LIMIT 1
            ) anterior ON TRUE WHERE m.id=p.membresia_id
        );
        ALTER TABLE pagos ALTER COLUMN meses_contratados SET NOT NULL;
        ALTER TABLE pagos ADD CONSTRAINT pagos_meses_contratados_check CHECK (meses_contratados BETWEEN 1 AND 120);
        ALTER TABLE pagos ADD COLUMN anulado_en TIMESTAMPTZ;
        ALTER TABLE pagos ADD COLUMN anulado_por INTEGER REFERENCES usuarios(id);
        ALTER TABLE pagos ADD COLUMN motivo_anulacion TEXT NOT NULL DEFAULT '' CHECK (length(motivo_anulacion)<=500);
        ALTER TABLE pagos ADD CONSTRAINT pagos_anulacion_completa CHECK ((anulado_en IS NULL)=(anulado_por IS NULL));
        INSERT INTO schema_migrations VALUES (5);
    END IF;
END $$;
