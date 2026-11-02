import { afterEach, expect, test, vi } from 'vitest';
import { listarClases } from './clasesService.js';
import { listarInstructores, listarSocios } from './sociosService.js';
import { listarPlanes } from './membresiasService.js';
import { misInscripciones, listarReportes } from './inscripcionesService.js';
afterEach(() => vi.unstubAllGlobals());
test.each([listarClases, listarInstructores, listarSocios, listarPlanes, misInscripciones, listarReportes])('una lista malformada produce error visible, no crash o lista vacia', async service => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [{}] }))));
    await expect(service()).rejects.toThrow(/datos/);
});
test('lista vacia valida se mantiene vacia', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }))));
    expect(await listarClases()).toEqual([]);
});
