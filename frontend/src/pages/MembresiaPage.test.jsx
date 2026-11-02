import { beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationProvider from '../components/NotificationProvider.jsx';
import { miMembresia, listarPlanesRenovacion, misPagos, solicitarPlan, listarMetodosPago } from '../services/membresiasService.js';
import MembresiaPage from './MembresiaPage.jsx';

vi.mock('../services/membresiasService.js', () => ({
    miMembresia: vi.fn(), listarPlanesRenovacion: vi.fn(), misPagos: vi.fn(), solicitarPlan: vi.fn(), listarMetodosPago: vi.fn(),
}));
vi.mock('../components/AuthContext.js', () => ({ useAuth: () => ({ usuario: { estado: 'activo', tipoPlan: null }, refresh: vi.fn() }) }));
const plan = { tipo: 'mensual', nombre: 'Mensual', meses: 1, precioCentavos: 1500000, descuentoPorcentaje: 0, condicionesDescuento: '', metodoDescuento: null, habilitado: true };
beforeEach(() => {
    vi.clearAllMocks();
    miMembresia.mockResolvedValue(null);
    listarPlanesRenovacion.mockResolvedValue([plan]);
    misPagos.mockResolvedValue([]);
    listarMetodosPago.mockResolvedValue([{ codigo: 'Efectivo', habilitado: true, permiteSocio: true }]);
    solicitarPlan.mockResolvedValue({});
});
function setup() { render(<MemoryRouter><NotificationProvider><MembresiaPage /></NotificationProvider></MemoryRouter>); }

test('renovar ofrece solo métodos disponibles y requiere seleccionarlos', async () => {
    setup();
    await screen.findByRole('option', { name: /Mensual:/ });
    expect(screen.queryByRole('option', { name: 'Transferencia' })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Elegí tu plan'), { target: { value: 'mensual' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
    expect(solicitarPlan).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Cómo vas a pagar')).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Cómo vas a pagar'), { target: { value: 'Efectivo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar solicitud' }));
    await waitFor(() => expect(solicitarPlan).toHaveBeenCalledWith({ tipoPlan: 'mensual', metodoPago: 'Efectivo' }));
});

test('sin métodos disponibles bloquea renovación pero mantiene el historial', async () => {
    listarMetodosPago.mockResolvedValue([]);
    misPagos.mockResolvedValue([{ id: 1, nombrePlan: 'Mensual anterior', montoCentavos: 1500000, metodoPago: 'Transferencia', fecha: '2030-01-01T12:00:00Z', descuentoPorcentaje: 0 }]);
    setup();
    expect(await screen.findByText(/No hay métodos de pago habilitados/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Enviar solicitud' })).toBeDisabled();
    expect(screen.getByLabelText('Cómo vas a pagar')).toBeDisabled();
    expect(screen.getByText(/Mensual anterior/)).toBeVisible();
    expect(solicitarPlan).not.toHaveBeenCalled();
});

test('el historial conserva el porcentaje contratado y distingue una rebaja de importe fijo', async () => {
    const pago = { nombrePlan: 'Mensual', montoCentavos: 1700000, metodoPago: 'Efectivo', fecha: '2030-01-01T12:00:00Z' };
    misPagos.mockResolvedValue([
        { ...pago, id: 1, descuentoPorcentaje: 15, descuentoCentavos: 300000, condicionesDescuento: 'Pago en mostrador.' },
        { ...pago, id: 2, descuentoPorcentaje: 0, descuentoCentavos: 500000, condicionesDescuento: 'Solo efectivo.' },
    ]);
    setup();
    expect(await screen.findByText('15% de descuento aplicado. Pago en mostrador.')).toBeVisible();
    expect(screen.getByText('Descuento aplicado: $ 5.000,00. Solo efectivo.')).toBeVisible();
});
