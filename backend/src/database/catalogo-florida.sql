DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM schema_migrations WHERE version=7) THEN
        UPDATE planes SET habilitado=FALSE;
        INSERT INTO planes(tipo,nombre,meses,dias,precio_centavos,precio_descuento_centavos,metodo_descuento,metodo_exclusivo,requisitos_acceso,descripcion)
        VALUES
        ('mensual','Plan Mensual Libre',1,NULL,8800000,7800000,'Efectivo',NULL,'','Pase libre y clases incluidas en Florida.'),
        ('pase-semanal','Pase semanal',NULL,7,5000000,4600000,'Efectivo',NULL,'','Pase libre y clases incluidas en Florida.'),
        ('pase-quincena','Pase quincena',NULL,15,5900000,5300000,'Efectivo',NULL,'','Pase libre y clases incluidas en Florida.'),
        ('pase-dia','Pase por un día',NULL,1,3000000,2500000,'Efectivo',NULL,'','Pase libre y clases incluidas en Florida.'),
        ('jubilados','Promo jubilados',1,NULL,6200000,NULL,NULL,'Efectivo','Exclusivo para jubilados. Recepción debe verificar esta condición.','Pase libre y clases incluidas en Florida.'),
        ('full-target','Plan FULL Target',1,NULL,9800000,NULL,NULL,NULL,'','Pase libre mensual y clases incluidas. Acceso a todas las sedes: Florida, San Fernando y Tigre.')
        ON CONFLICT(tipo) DO UPDATE SET nombre=EXCLUDED.nombre,meses=EXCLUDED.meses,dias=EXCLUDED.dias,
        precio_centavos=EXCLUDED.precio_centavos,precio_descuento_centavos=EXCLUDED.precio_descuento_centavos,
        descuento_porcentaje=0,condiciones_descuento='',metodo_descuento=EXCLUDED.metodo_descuento,
        metodo_exclusivo=EXCLUDED.metodo_exclusivo,requisitos_acceso=EXCLUDED.requisitos_acceso,descripcion=EXCLUDED.descripcion,
        habilitado=TRUE,eliminado=FALSE;
        UPDATE metodos_pago SET permite_socio=TRUE,habilitado=TRUE WHERE codigo='Tarjeta';
        INSERT INTO schema_migrations VALUES (7);
    END IF;
END $$;
