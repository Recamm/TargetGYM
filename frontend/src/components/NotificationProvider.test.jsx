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

test('cierra cada confirmación a los 6 segundos sin reiniciar otras notificaciones', () => {
    setup();
    fireEvent.click(screen.getByText('Notificar'));
    advance(3000);
    fireEvent.click(screen.getByText('Error', { exact: true }));
    advance(2999);
    expect(screen.getByRole('status')).toBeVisible();
    advance(1);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeVisible();
    advance(7000);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary', { name: 'Notificaciones' })).not.toBeInTheDocument();
});

test('no desaparece mientras se lee con puntero o foco, y permite cierre manual', () => {
    setup();
    fireEvent.click(screen.getByText('Notificar'));
    fireEvent.mouseEnter(screen.getByRole('status'));
    advance(10000);
    expect(screen.getByRole('status')).toBeVisible();
    fireEvent.focus(screen.getByRole('button', { name: 'Cerrar notificación' }));
    fireEvent.mouseLeave(screen.getByRole('status'));
    advance(10000);
    expect(screen.getByRole('status')).toBeVisible();
    fireEvent.blur(screen.getByRole('button', { name: 'Cerrar notificación' }));
    advance(6000);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(screen.getByText('Error', { exact: true }));
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar notificación' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
});

test('limpia el temporizador al desmontar el proveedor', () => {
    const { unmount } = setup();
    fireEvent.click(screen.getByText('Notificar'));
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
});
