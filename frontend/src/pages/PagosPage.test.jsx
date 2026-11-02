import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationProvider from '../components/NotificationProvider.jsx';
import { listarSocios } from '../services/sociosService.js';
import { listarPlanesSocio, listarPagos, registrarPago, listarMetodosPagoGestion, eliminarPago } from '../services/membresiasService.js';
import PagosPage from './PagosPage.jsx';

vi.mock('../services/sociosService.js', () => ({ listarSocios: vi.fn() }));
vi.mock('../services/membresiasService.js', () => ({ listarPlanesSocio: vi.fn(), listarPagos: vi.fn(), registrarPago: vi.fn(), listarMetodosPagoGestion: vi.fn(), eliminarPago: vi.fn() }));
const plan = { tipo: 'plan-flexible', nombre: 'Plan flexible', meses: 2, precioCentavos: 1000000, descuentoPorcentaje: 20, condicionesDescuento: 'Pago en mostrador.', metodoDescuento: 'Efectivo', habilitado: false };
beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
    vi.clearAllMocks();
    listarSocios.mockResolvedValue([{ id: 1, nombre: 'Socio', apellido: 'Prueba', email: 'socio@example.test', estado: 'activo' }]);
    listarPlanesSocio.mockResolvedValue([plan]);
    listarPagos.mockResolvedValue([]);
    registrarPago.mockResolvedValue({ id: 1, montoCentavos: 800000 });
    listarMetodosPagoGestion.mockResolvedValue(['Efectivo','Transferencia','Tarjeta'].map(codigo => ({ codigo, habilitado: true, permiteSocio: codigo !== 'Tarjeta' })));
    eliminarPago.mockResolvedValue({ anulado: true });
});
afterEach(() => {
    delete HTMLDialogElement.prototype.showModal;
    delete HTMLDialogElement.prototype.close;
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
    await waitFor(() => expect(registrarPago).toHaveBeenCalledWith({ socioId: 1, tipoPlan: plan.tipo, metodoPago: 'Efectivo', aplicarDescuento: true, confirmarRequisitos: false, operacionId: expect.any(String) }));
});

test('la tarifa exacta en efectivo se aplica por método sin aproximar porcentajes', async () => {
    listarPlanesSocio.mockResolvedValue([{ ...plan, precioCentavos: 8800000, descuentoPorcentaje: 0,
        precioDescuentoCentavos: 7800000, condicionesDescuento: '' }]);
    await setup();
    expect(screen.getByText('Importe: $ 78.000,00')).toBeVisible();
    expect(screen.queryByRole('checkbox', { name: /Confirmo que se cumplen/ })).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Método de pago'), { target: { value: 'Transferencia' } });
    expect(screen.getByText('Importe: $ 88.000,00')).toBeVisible();
});

test('no cobra una promoción de jubilados sin verificar sus requisitos', async () => {
    listarPlanesSocio.mockResolvedValue([{ ...plan, precioCentavos: 6200000, descuentoPorcentaje: 0,
        condicionesDescuento: '', metodoDescuento: null, metodoExclusivo: 'Efectivo', requisitosAcceso: 'Ser jubilado.' }]);
    await setup();
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que recibí/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago', exact: true }));
    expect(registrarPago).not.toHaveBeenCalled();
    expect(screen.getByText(/Verificá los requisitos de acceso antes/)).toBeVisible();
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que verifiqué/ }));
    expect(screen.getByRole('checkbox', { name: /Confirmo que recibí/ })).not.toBeChecked();
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que recibí/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago', exact: true }));
    await waitFor(() => expect(registrarPago).toHaveBeenCalledWith(expect.objectContaining({ confirmarRequisitos: true })));
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

test('caja permite un método deshabilitado con aviso y conserva la confirmación obligatoria', async () => {
    listarMetodosPagoGestion.mockResolvedValue(['Efectivo','Transferencia','Tarjeta'].map(codigo => ({ codigo, habilitado: false, permiteSocio: codigo !== 'Tarjeta' })));
    await setup();
    fireEvent.change(screen.getByLabelText('Método de pago'), { target: { value: 'Transferencia' } });
    expect(screen.getByText(/Método deshabilitado para socios/)).toBeVisible();
    fireEvent.click(screen.getByRole('checkbox', { name: /Confirmo que recibí/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Registrar pago', exact: true }));
    await waitFor(() => expect(registrarPago).toHaveBeenCalledWith(expect.objectContaining({ metodoPago: 'Transferencia' })));
});

const pagosDuplicados = [1, 2].map(id => ({
    id, socioId: 1, socio: 'Socio Prueba', nombrePlan: 'Plan flexible', montoCentavos: 1000000,
    metodoPago: 'Efectivo', fecha: '2030-01-01T12:00:00Z', descuentoPorcentaje: 0, anuladoEn: null,
}));
test('confirma antes de eliminar, conserva el otro pago y permite consultar la anulación', async () => {
    listarPagos.mockResolvedValueOnce(pagosDuplicados).mockResolvedValue([
        pagosDuplicados[0], { ...pagosDuplicados[1], anuladoEn: '2030-01-02T12:00:00Z', anuladoPor: 'Admin Prueba', motivoAnulacion: 'Duplicado' },
    ]);
    await setup();
    const duplicado = screen.getByText('Pago #2').closest('li');
    fireEvent.click(within(duplicado).getByRole('button', { name: 'Eliminar pago' }));
    expect(eliminarPago).not.toHaveBeenCalled();
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent(/recalculará la membresía/);
    fireEvent.change(within(dialog).getByLabelText('Motivo (opcional)'), { target: { value: 'Duplicado' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar pago' }));
    await waitFor(() => expect(eliminarPago).toHaveBeenCalledWith(2, { motivo: 'Duplicado' }));
    await waitFor(() => expect(screen.queryByText('Pago #2')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Pagos registrados' })).toHaveFocus();
    expect(screen.getByText('Pago #1')).toBeVisible();
    fireEvent.click(screen.getByLabelText('Mostrar pagos anulados'));
    const anulado = screen.getByText('Pago #2').closest('li');
    expect(within(anulado).getByText('Anulado', { exact: true })).toBeVisible();
    expect(within(anulado).getByText(/Admin Prueba/)).toBeVisible();
    expect(within(anulado).queryByRole('button', { name: 'Eliminar pago' })).not.toBeInTheDocument();
});

test('un fallo de anulación conserva el pago y muestra un error persistente antes de reintentar', async () => {
    listarPagos.mockResolvedValue(pagosDuplicados);
    eliminarPago.mockRejectedValueOnce(new Error('No se pudo anular el pago.'));
    await setup();
    fireEvent.click(within(screen.getByText('Pago #2').closest('li')).getByRole('button', { name: 'Eliminar pago' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Eliminar pago' }));
    expect(await within(dialog).findByText('No se pudo anular el pago.')).toBeVisible();
    expect(listarPagos).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole('button', { name: 'Volver' }));
    expect(screen.getByText('Pago #2')).toBeVisible();
});
