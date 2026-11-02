export async function catalogoMensualDePrueba(db) {
    await db.query(`UPDATE planes SET nombre='Plan ' || tipo,precio_centavos=NULL,precio_descuento_centavos=NULL,
        descuento_porcentaje=0,condiciones_descuento='',metodo_descuento=NULL,habilitado=TRUE
        WHERE tipo IN ('mensual','trimestral','anual')`);
}
