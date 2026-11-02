import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import NotificationProvider from '../components/NotificationProvider.jsx';
import { listarMetodosPagoGestion, configurarMetodoPago } from '../services/membresiasService.js';
import MetodosPagoPage from './MetodosPagoPage.jsx';

vi.mock('../services/membresiasService.js', () => ({ listarMetodosPagoGestion: vi.fn(), configurarMetodoPago: vi.fn() }));
const metodos = ['Efectivo','Transferencia','Tarjeta'].map(codigo => ({ codigo, habilitado: true, permiteSocio: codigo !== 'Tarjeta' }));
beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
    vi.clearAllMocks();
    listarMetodosPagoGestion.mockResolvedValue(metodos);
    configurarMetodoPago.mockResolvedValue({ ...metodos[1], habilitado: false });
});
afterEach(() => {
    delete HTMLDialogElement.prototype.showModal;
    delete HTMLDialogElement.prototype.close;
});
function setup() { render(<NotificationProvider><MetodosPagoPage /></NotificationProvider>); }

test('explica consecuencias, confirma el cambio y recarga el estado persistido', async () => {
    listarMetodosPagoGestion.mockResolvedValueOnce(metodos).mockResolvedValue(metodos.map(metodo => ({ ...metodo, habilitado: metodo.codigo !== 'Transferencia' })));
    setup();
    const transferencia = await screen.findByRole('article', { name: 'Transferencia', exact: true });
    fireEvent.click(within(transferencia).getByRole('button', { name: 'Deshabilitar' }));
    expect(screen.getByRole('dialog')).toHaveTextContent(/administrador podrá seguir usándolo/);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    await waitFor(() => expect(configurarMetodoPago).toHaveBeenCalledWith('Transferencia', { habilitado: false }));
    expect(await within(transferencia).findByRole('button', { name: 'Habilitar' })).toBeVisible();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(within(transferencia).getByText('Deshabilitado para socios')).toBeVisible();
});

test('un fallo mantiene el estado anterior y el error persistente en el diálogo', async () => {
    configurarMetodoPago.mockRejectedValue(new Error('No se pudo guardar el método.'));
    setup();
    const transferencia = await screen.findByRole('article', { name: 'Transferencia', exact: true });
    fireEvent.click(within(transferencia).getByRole('button', { name: 'Deshabilitar' }));
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Confirmar' }));
    expect(await within(screen.getByRole('dialog')).findByText('No se pudo guardar el método.')).toBeVisible();
    expect(within(transferencia).getByRole('button', { name: 'Deshabilitar' })).toBeInTheDocument();
    expect(listarMetodosPagoGestion).toHaveBeenCalledTimes(1);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Volver' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
