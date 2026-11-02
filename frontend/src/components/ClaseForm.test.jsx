import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ClaseForm from './ClaseForm.jsx';
import NotificationProvider from './NotificationProvider.jsx';
test('rechaza cupos fraccionarios y conserva datos ante 409', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('El instructor ya tiene otra clase'));
    render(<NotificationProvider><ClaseForm instructores={[{ id: 1, nombre: 'Instructor', apellido: 'Sintetico', estado: 'activo' }]} initial={{ nombre: 'Funcional', tipo: 'Grupal', fecha: '2099-01-01', horaInicio: '18:00', duracionMinutos: '60', cupoMaximo: '1.5', instructorId: '1' }} onSubmit={submit} /></NotificationProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar clase' }));
    expect(submit).not.toHaveBeenCalled();
    await userEvent.clear(screen.getByLabelText('Cupo máximo'));
    await userEvent.type(screen.getByLabelText('Cupo máximo'), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Guardar clase' }));
    expect(await screen.findByText(/El instructor ya tiene otra clase/)).toBeVisible();
    expect(screen.getByLabelText('Nombre de la clase')).toHaveValue('Funcional');
    expect(submit).toHaveBeenCalledWith(expect.objectContaining({ cupoMaximo: 2, instructorId: 1, duracionMinutos: 60 }));
});
test('doble click no duplica un envio en curso', async () => {
    let resolve;
    const submit = vi.fn(() => new Promise(done => { resolve = done; }));
    render(<NotificationProvider><ClaseForm instructores={[{ id: 1, nombre: 'Instructor', estado: 'activo' }]} initial={{ nombre: 'Funcional', tipo: 'Grupal', fecha: '2099-01-01', horaInicio: '18:00', duracionMinutos: 60, cupoMaximo: 2, instructorId: 1 }} onSubmit={submit} /></NotificationProvider>);
    await userEvent.dblClick(screen.getByRole('button', { name: 'Guardar clase' }));
    expect(submit).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Procesando…' })).toBeDisabled();
    resolve();
});
