import { afterEach, expect, test, vi } from 'vitest';
import { listarClases } from './clasesService.js';
import { listarInstructores, listarSocios } from './sociosService.js';
import { listarPlanes, listarMetodosPago, listarMetodosPagoGestion } from './membresiasService.js';
import { misInscripciones, listarReportes } from './inscripcionesService.js';
import { membresia, pago, pagoAnulado } from './contratos.js';
afterEach(() => vi.unstubAllGlobals());
test.each([listarClases, listarInstructores, listarSocios, listarPlanes, listarMetodosPago, listarMetodosPagoGestion, misInscripciones, listarReportes])('una lista malformada produce error visible, no crash o lista vacia', async service => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [{}] }))));
    await expect(service()).rejects.toThrow(/datos/);
});
test('lista vacia valida se mantiene vacia', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }))));
    expect(await listarClases()).toEqual([]);
});
test('pagos y membresías requieren auditoría coherente y fechas originales', () => {
    const fecha = '2030-01-01T15:00:00.000Z';
    const valido = { id: 1, socioId: 2, tipoPlan: 'mensual', nombrePlan: 'Mensual', montoCentavos: 1500000,
        precioBaseCentavos: 1500000, descuentoPorcentaje: 0, condicionesDescuento: '', metodoPago: 'Efectivo', fecha,
        anuladoEn: null, anuladoPor: null, motivoAnulacion: '', descuentoCentavos: 0, requisitosAcceso: '', confirmacionRequisitos: false };
    expect(pago(valido)).toBe(true);
    expect(pago({ ...valido, anuladoEn: fecha, anuladoPor: 'Administración Prueba', motivoAnulacion: 'Duplicado' })).toBe(true);
    expect(pago({ ...valido, anuladoEn: fecha })).toBe(false);
    expect(pago({ ...valido, anuladoPor: 'Administración Prueba' })).toBe(false);
    expect(pago({ ...valido, anuladoEn: 'inválida', anuladoPor: 'Administración Prueba' })).toBe(false);
    expect(pago({ ...valido, motivoAnulacion: 'x'.repeat(501) })).toBe(false);
    expect(pagoAnulado({ anulado: true })).toBe(true);
    expect(pagoAnulado({ anulado: false })).toBe(false);
    const periodo = { id: 1, socioId: 2, tipoPlan: 'mensual', nombrePlan: 'Mensual', fechaInicio: fecha,
        fechaVencimiento: '2030-02-01T15:00:00.000Z', estado: 'activa', anulada: false,
        fechaInicioOriginal: fecha, fechaVencimientoOriginal: '2030-03-01T15:00:00.000Z' };
    expect(membresia(periodo)).toBe(true);
    expect(membresia({ ...periodo, anulada: true, estado: 'reemplazada' })).toBe(true);
    expect(membresia({ ...periodo, anulada: undefined })).toBe(false);
    expect(membresia({ ...periodo, fechaInicioOriginal: undefined })).toBe(false);
});
