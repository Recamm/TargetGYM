DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version=4) THEN
        CREATE TABLE metodos_pago (
            codigo TEXT PRIMARY KEY CHECK (codigo IN ('Efectivo','Transferencia','Tarjeta')),
            habilitado BOOLEAN NOT NULL DEFAULT TRUE,
            permite_socio BOOLEAN NOT NULL
        );
        INSERT INTO metodos_pago(codigo,permite_socio) VALUES
            ('Efectivo',TRUE),('Transferencia',TRUE),('Tarjeta',FALSE);
        INSERT INTO schema_migrations VALUES (4);
    END IF;
END $$;
