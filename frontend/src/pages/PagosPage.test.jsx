import { beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationProvider from '../components/NotificationProvider.jsx';
import { listarSocios } from '../services/sociosService.js';
import { listarPlanesSocio, listarPagos, registrarPago } from '../services/membresiasService.js';
import PagosPage from './PagosPage.jsx';

vi.mock('../services/sociosService.js', () => ({ listarSocios: vi.fn() }));
vi.mock('../services/membresiasService.js', () => ({ listarPlanesSocio: vi.fn(), listarPagos: vi.fn(), registrarPago: vi.fn() }));
const plan = { tipo: 'plan-flexible', nombre: 'Plan flexible', meses: 2, precioCentavos: 1000000, descuentoPorcentaje: 20, condicionesDescuento: 'Pago en mostrador.', metodoDescuento: 'Efectivo', habilitado: false };
beforeEach(() => {
    vi.clearAllMocks();
    listarSocios.mockResolvedValue([{ id: 1, nombre: 'Socio', apellido: 'Prueba', email: 'socio@example.test', estado: 'activo' }]);
    listarPlanesSocio.mockResolvedValue([plan]);
    listarPagos.mockResolvedValue([]);
    registrarPago.mockResolvedValue({ id: 1, montoCentavos: 800000 });
});
async function setup() {
    render(<MemoryRouter initialEntries={['/gestion/pagos?socio=1']}><NotificationProvider><PagosPage /></NotificationProvider></MemoryRouter>);
    await screen.findByRole('option', { name: 'Plan flexible · Solo renovación' });
    fireEvent.change(screen.getByLabelText('Plan'), { target: { value: plan.tipo } });
}
test('requiere confirmar condiciones y reinicia el descuento al cambiar método', async () => {
    await setup();
    expect(screen.getByText('Importe: $ 10.000,00')).toBeVisible();
    const confirmar = screen.getByRole('checkbox', { name: /Confirmo que se cumplen/ });
    expect(confirmar).not.toBeChecked();
    fireEvent.click(confirmar);
    expect(screen.getByText('Importe: $ 8.000,00')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Método de pago'), { target: { value: 'Tarjeta' } });
    expect(confirmar).not.toBeChecked();
    expect(confirmar).toBeDisabled();
    expect(screen.getByText('Importe: $ 10.000,00')).toBeVisible();
});
test('envía aprobación explícita para el cobro manual, nunca un monto del cliente', async () => {
    await setup();
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que se cumplen/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que recibí/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago', exact: true }));
    await waitFor(() => expect(registrarPago).toHaveBeenCalledWith({ socioId: 1, tipoPlan: plan.tipo, metodoPago: 'Efectivo', aplicarDescuento: true, operacionId: expect.any(String) }));
});

test('no registra ni activa la membresía sin confirmar dinero recibido', async () => {
    await setup();
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago', exact: true }));
    expect(registrarPago).not.toHaveBeenCalled();
    expect(screen.getByText(/Confirmá que recibiste/)).toBeVisible();
});

test('la ficha de pago parte del plan y método que solicitó el socio', async () => {
    listarSocios.mockResolvedValue([{ id: 1, nombre: 'Socio', apellido: 'Prueba', email: 'socio@example.test', estado: 'activo', tipoPlan: plan.tipo, metodoPagoSolicitado: 'Transferencia' }]);
    await setup();
    expect(screen.getByLabelText('Método de pago')).toHaveValue('Transferencia');
    expect(screen.getByRole('checkbox', { name: /Confirmo que recibí/ })).not.toBeChecked();
});
