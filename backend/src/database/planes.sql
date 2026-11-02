DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version=2) THEN
        ALTER TABLE planes DROP CONSTRAINT planes_tipo_check;
        ALTER TABLE planes DROP CONSTRAINT planes_meses_check;
        ALTER TABLE planes ADD CONSTRAINT planes_meses_check CHECK (meses BETWEEN 1 AND 120);
        ALTER TABLE planes ADD COLUMN nombre TEXT;
        UPDATE planes SET nombre='Plan ' || tipo;
        ALTER TABLE planes ALTER COLUMN nombre SET NOT NULL;
        ALTER TABLE planes ADD COLUMN habilitado BOOLEAN NOT NULL DEFAULT TRUE;
        ALTER TABLE planes ADD COLUMN eliminado BOOLEAN NOT NULL DEFAULT FALSE;
        ALTER TABLE planes ADD COLUMN condiciones_descuento TEXT NOT NULL DEFAULT '';
        ALTER TABLE planes ADD COLUMN metodo_descuento TEXT CHECK (metodo_descuento IN ('Efectivo','Transferencia','Tarjeta'));
        ALTER TABLE membresias ADD COLUMN nombre_plan TEXT;
        UPDATE membresias m SET nombre_plan=p.nombre FROM planes p WHERE p.tipo=m.tipo_plan;
        ALTER TABLE membresias ALTER COLUMN nombre_plan SET NOT NULL;
        ALTER TABLE pagos ADD COLUMN nombre_plan TEXT;
        UPDATE pagos p SET nombre_plan=pl.nombre FROM planes pl WHERE pl.tipo=p.tipo_plan;
        ALTER TABLE pagos ALTER COLUMN nombre_plan SET NOT NULL;
        ALTER TABLE pagos ADD COLUMN precio_base_centavos INTEGER;
        -- No reconstruir descuentos antiguos con precios o reglas actuales.
        UPDATE pagos SET precio_base_centavos=monto_centavos;
        ALTER TABLE pagos ALTER COLUMN precio_base_centavos SET NOT NULL;
        ALTER TABLE pagos ADD COLUMN descuento_porcentaje INTEGER NOT NULL DEFAULT 0;
        ALTER TABLE pagos ADD COLUMN condiciones_descuento TEXT NOT NULL DEFAULT '';
        ALTER TABLE pagos ADD COLUMN confirmacion_descuento BOOLEAN NOT NULL DEFAULT FALSE;
        CREATE TABLE cambios_plan (
            id SERIAL PRIMARY KEY,
            socio_id INTEGER NOT NULL REFERENCES usuarios(id),
            membresia_anterior_id INTEGER NOT NULL REFERENCES membresias(id),
            membresia_nueva_id INTEGER NOT NULL REFERENCES membresias(id),
            administrador_id INTEGER NOT NULL REFERENCES usuarios(id),
            fecha TIMESTAMPTZ NOT NULL
        );
        INSERT INTO schema_migrations VALUES (2);
    END IF;
END $$;
