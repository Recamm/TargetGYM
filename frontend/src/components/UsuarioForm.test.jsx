import { expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsuarioForm from './UsuarioForm.jsx';
import NotificationProvider from './NotificationProvider.jsx';
import { listarPlanes } from '../services/membresiasService.js';

vi.mock('../services/membresiasService.js', () => ({ listarPlanes: vi.fn() }));

test('no envia registro invalido y conserva datos tras error del servidor', async () => {
    const submit = vi.fn().mockRejectedValue(new Error('Email ya registrado'));
    const initial = { nombre: 'Prueba', apellido: 'Sintetica', email: 'test@example.test', dni: '90000001', telefono: '1100000000', fechaNacimiento: '2000-01-01', password: 'Segura123!' };
    render(<NotificationProvider><UsuarioForm initial={initial} onSubmit={submit} /></NotificationProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText(/Email ya registrado/)).toBeVisible();
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.test');
    expect(submit).toHaveBeenCalledTimes(1);
});

test('formulario vacio muestra validaciones sin llamar a la API', async () => {
    const submit = vi.fn();
    render(<NotificationProvider><UsuarioForm onSubmit={submit} /></NotificationProvider>);
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nombre')).toHaveFocus();
    expect(screen.getByLabelText('Nombre')).toHaveAttribute('aria-invalid', 'true');
});

test('el registro usa el catálogo real y requiere elegir un plan habilitado', async () => {
    listarPlanes.mockResolvedValue([{ tipo: 'plan-personalizado', nombre: 'Plan flexible' }]);
    const submit = vi.fn().mockResolvedValue({});
    const initial = { nombre: 'Prueba', apellido: 'Sintetica', email: 'test@example.test', dni: '90000001', telefono: '1100000000', fechaNacimiento: '2000-01-01', password: 'Segura123!' };
    render(<NotificationProvider><UsuarioForm elegirPlan initial={initial} onSubmit={submit} /></NotificationProvider>);
    await screen.findByRole('option', { name: 'Plan flexible' });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Plan que querés contratar')).toHaveAttribute('aria-invalid', 'true');
    fireEvent.change(screen.getByLabelText('Plan que querés contratar'), { target: { value: 'plan-personalizado' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ tipoPlan: 'plan-personalizado' })));
});

test('asociación requiere método manual y muestra precio antes de enviar', async () => {
    listarPlanes.mockResolvedValue([{ tipo: 'mensual', nombre: 'Plan mensual', meses: 1, precioCentavos: 1500000, descuentoPorcentaje: 0, condicionesDescuento: '', metodoDescuento: null }]);
    const submit = vi.fn();
    const initial = { nombre: 'Prueba', apellido: 'Sintetica', email: 'test@example.test', dni: '90000001', telefono: '1100000000', fechaNacimiento: '2000-01-01', password: 'Segura123!', tipoPlan: 'mensual' };
    render(<NotificationProvider><UsuarioForm elegirPlan asociacion initial={initial} onSubmit={submit} /></NotificationProvider>);
    await screen.findByRole('option', { name: /Plan mensual/ });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Cómo vas a pagar')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.queryByRole('option', { name: 'Tarjeta' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Cómo vas a pagar'), { target: { value: 'Transferencia' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(submit).toHaveBeenCalledWith(expect.objectContaining({ tipoPlan: 'mensual', metodoPago: 'Transferencia' })));
    expect(screen.getByText(/15\.000/)).toBeVisible();
});

test('alta administrativa por invitación no pide ni envía una contraseña', async () => {
    const submit = vi.fn();
    const initial = { nombre: 'Prueba', apellido: 'Sintetica', email: 'test@example.test', dni: '90000001', telefono: '1100000000', fechaNacimiento: '2000-01-01' };
    render(<NotificationProvider><UsuarioForm invitacion initial={initial} onSubmit={submit} /></NotificationProvider>);
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(submit).toHaveBeenCalledTimes(1));
    expect(submit.mock.calls[0][0]).not.toHaveProperty('password');
});

test('no permite enviar la asociación con un plan fuera del catálogo cargado', async () => {
    listarPlanes.mockResolvedValue([]);
    const submit = vi.fn();
    const initial = { nombre: 'Prueba', apellido: 'Sintetica', email: 'test@example.test', dni: '90000001', telefono: '1100000000', fechaNacimiento: '2000-01-01', password: 'Segura123!', tipoPlan: 'no-disponible', metodoPago: 'Efectivo' };
    render(<NotificationProvider><UsuarioForm elegirPlan asociacion initial={initial} onSubmit={submit} /></NotificationProvider>);
    await screen.findByText(/No hay planes/);
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(submit).not.toHaveBeenCalled();
});
