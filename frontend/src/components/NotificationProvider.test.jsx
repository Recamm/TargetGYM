import { StrictMode } from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import NotificationProvider from './NotificationProvider.jsx';
import { useNotifications } from './NotificationContext.js';

function Triggers() {
    const notices = useNotifications();
    return <><button onClick={() => notices.notify('Guardado.')}>Notificar</button><button onClick={() => notices.error(new Error('No se pudo guardar.'))}>Error</button></>;
}
function setup() {
    vi.useFakeTimers();
    return render(<StrictMode><NotificationProvider><Triggers /></NotificationProvider></StrictMode>);
}
const advance = milliseconds => act(() => vi.advanceTimersByTime(milliseconds));
afterEach(() => vi.useRealTimers());

test('cierra confirmaciones en 4 segundos y errores en 8, sin reiniciar otros avisos', () => {
    setup();
    fireEvent.click(screen.getByText('Notificar'));
    advance(3000);
    fireEvent.click(screen.getByText('Error', { exact: true }));
    advance(999);
    expect(screen.getByRole('status')).toBeVisible();
    advance(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeVisible();
    advance(7000);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Notificaciones' })).not.toBeInTheDocument();
});

test('vence aun con puntero y foco sostenidos, devuelve el foco y permite cierre manual', () => {
    setup();
    const trigger = screen.getByText('Notificar');
    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.mouseEnter(screen.getByRole('status'));
    act(() => screen.getByRole('button', { name: 'Cerrar notificación' }).focus());
    advance(3999);
    expect(screen.getByRole('status')).toBeVisible();
    advance(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    fireEvent.click(screen.getByText('Error', { exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    advance(1);
    expect(vi.getTimerCount()).toBe(0);
});

test('limpia el temporizador al desmontar el proveedor', () => {
    const { unmount } = setup();
    fireEvent.click(screen.getByText('Notificar'));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
});
