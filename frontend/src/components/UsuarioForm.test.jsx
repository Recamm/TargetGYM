import { expect, test, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UsuarioForm from './UsuarioForm.jsx';
import NotificationProvider from './NotificationProvider.jsx';

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
