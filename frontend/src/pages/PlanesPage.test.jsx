import { beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotificationProvider from '../components/NotificationProvider.jsx';
import { crearPlan, configurarPlan, listarPlanesGestion } from '../services/membresiasService.js';
import PlanesPage from './PlanesPage.jsx';

vi.mock('../services/membresiasService.js', () => ({ crearPlan: vi.fn(), configurarPlan: vi.fn(), listarPlanesGestion: vi.fn(), eliminarPlan: vi.fn() }));
const plan = { tipo: 'mensual', nombre: 'Plan mensual', meses: 1, precioCentavos: 1000000, descuentoPorcentaje: 0, habilitado: true, condicionesDescuento: '', metodoDescuento: null };
beforeEach(() => {
    vi.clearAllMocks();
    listarPlanesGestion.mockResolvedValue([plan]);
    crearPlan.mockResolvedValue(plan);
    configurarPlan.mockResolvedValue(plan);
});
function setup() { render(<MemoryRouter><NotificationProvider><PlanesPage /></NotificationProvider></MemoryRouter>); }

test('crea un plan personalizado con porcentaje, método y condiciones', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Plan mensual' });
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo plan' }));
    for (const [label, value] of [['Nombre del plan','Plan flexible'],['Duración (meses calendario)','2'],['Precio base (ARS)','12500,50'],['Descuento (%)','15'],['Condiciones del descuento (opcional)','Solo en mostrador.']]) fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.change(screen.getByLabelText('Método para el descuento'), { target: { value: 'Efectivo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Crear plan' }));
    await waitFor(() => expect(crearPlan).toHaveBeenCalledWith({ nombre: 'Plan flexible', meses: 2, precioCentavos: 1250050, descuentoPorcentaje: 15, condicionesDescuento: 'Solo en mostrador.', metodoDescuento: 'Efectivo', habilitado: true }));
    expect(await screen.findByText('Listo: Plan creado.')).toBeVisible();
});

test('valida datos antes de crear y conserva el formulario ante error', async () => {
    setup();
    await screen.findByRole('heading', { name: 'Plan mensual' });
    fireEvent.click(screen.getByRole('button', { name: 'Nuevo plan' }));
    fireEvent.click(screen.getByRole('button', { name: 'Crear plan' }));
    expect(crearPlan).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Nombre del plan')).toHaveFocus();
    fireEvent.change(screen.getByLabelText('Nombre del plan'), { target: { value: 'Plan válido' } });
    crearPlan.mockRejectedValueOnce(new Error('No se pudo guardar.'));
    fireEvent.click(screen.getByRole('button', { name: 'Crear plan' }));
    expect(await screen.findByText(/No se pudo guardar/)).toBeVisible();
    expect(screen.getByLabelText('Nombre del plan')).toHaveValue('Plan válido');
});

test('edita descuento también en un plan mensual', async () => {
    setup();
    const card = await screen.findByRole('article', { name: 'Plan mensual' });
    fireEvent.click(within(card).getByRole('button', { name: 'Editar' }));
    fireEvent.change(screen.getByLabelText('Descuento (%)'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
    await waitFor(() => expect(configurarPlan).toHaveBeenCalledWith('mensual', expect.objectContaining({ descuentoPorcentaje: 10 })));
});
