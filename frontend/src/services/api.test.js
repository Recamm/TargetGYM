import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { request, resetSession, onSessionExpired } from './api.js';

beforeEach(() => resetSession());
afterEach(() => vi.unstubAllGlobals());
const respuesta = (body, status = 200) => new Response(JSON.stringify(body), { status });

test('desenvuelve datos reales y DELETE con null', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta({ success: true, data: [] })));
    expect(await request('/clases')).toEqual([]);
    fetch.mockResolvedValueOnce(respuesta({ success: true, data: { csrfToken: 'csrf-sintetico', usuario: null } }));
    fetch.mockResolvedValueOnce(respuesta({ success: true, data: null }));
    expect(await request('/clases/1', { method: 'DELETE' })).toBeNull();
    expect(fetch.mock.calls.at(-1)[1].headers['X-CSRF-Token']).toBe('csrf-sintetico');
});
test.each([400, 404, 500])('preserva error HTTP %i', async status => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta({ success: false, message: 'Mensaje del servidor' }, status)));
    await expect(request('/clases')).rejects.toMatchObject({ status, message: 'Mensaje del servidor' });
});
test('JSON incorrecto no oculta el estado HTTP', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>Error</html>', { status: 502 })));
    await expect(request('/clases')).rejects.toMatchObject({ status: 502 });
});
test('no convierte envoltorios malformados ni errores de red en listas vacias', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respuesta({ productos: [] })));
    await expect(request('/clases')).rejects.toThrow();
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(request('/clases')).rejects.toMatchObject({ status: 0 });
});
test('un aborto de navegacion sigue siendo un aborto', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Cancelado', 'AbortError')));
    await expect(request('/clases')).rejects.toMatchObject({ name: 'AbortError' });
});
test('credenciales incorrectas no se presentan como una sesion vencida', async () => {
    const expired = vi.fn();
    onSessionExpired(expired);
    vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(respuesta({ success: true, data: { usuario: null, csrfToken: 'csrf-sintetico' } }))
        .mockResolvedValueOnce(respuesta({ success: false, message: 'Email o contraseña incorrectos.' }, 401)));
    try {
        await expect(request('/auth/login', { method: 'POST', body: {} })).rejects.toMatchObject({ status: 401 });
        expect(expired).not.toHaveBeenCalled();
    } finally { onSessionExpired(null); }
});
test('una respuesta 401 antigua no invalida una nueva sesion', async () => {
    const expired = vi.fn();
    onSessionExpired(expired);
    let finish;
    vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce(respuesta({ success: true, data: { usuario: null, csrfToken: 'anterior' } }))
        .mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
        .mockResolvedValueOnce(respuesta({ success: true, data: { usuario: {}, csrfToken: 'nuevo' } })));
    try {
        await request('/auth/sesion');
        const old = request('/socios');
        const failed = expect(old).rejects.toMatchObject({ status: 401 });
        await request('/auth/login', { method: 'POST', body: {} });
        finish(respuesta({ success: false, message: 'Sesión anterior vencida' }, 401));
        await failed;
        expect(expired).not.toHaveBeenCalled();
    } finally { onSessionExpired(null); }
});
