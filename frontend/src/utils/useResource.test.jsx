import { expect, test, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import NotificationProvider from '../components/NotificationProvider.jsx';
import useResource from './useResource.js';
test('no presenta los datos de otro recurso al cambiar el identificador', async () => {
    const first = vi.fn().mockResolvedValue(['anterior']);
    const next = vi.fn(() => new Promise(() => {}));
    const { result, rerender } = renderHook(({ loader }) => useResource(loader), { initialProps: { loader: first }, wrapper: NotificationProvider });
    await waitFor(() => expect(result.current.data).toEqual(['anterior']));
    rerender({ loader: next });
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
});
test('una peticion obsoleta no notifica errores aunque el loader no respete abort', async () => {
    let reject;
    const first = vi.fn(() => new Promise((resolve, failure) => { reject = failure; }));
    const next = vi.fn().mockResolvedValue(['actual']);
    const { result, rerender } = renderHook(({ loader }) => useResource(loader), { initialProps: { loader: first }, wrapper: NotificationProvider });
    rerender({ loader: next });
    await waitFor(() => expect(result.current.data).toEqual(['actual']));
    await act(async () => reject(new Error('Respuesta obsoleta')));
    expect(result.current.error).toBeNull();
});
