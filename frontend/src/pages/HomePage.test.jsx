import { beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext.js';
import NotificationProvider from '../components/NotificationProvider.jsx';
import { listarPlanes } from '../services/membresiasService.js';
import { dinero } from '../utils/validation.js';
import HomePage from './HomePage.jsx';

vi.mock('../services/membresiasService.js', () => ({ listarPlanes: vi.fn() }));
const planes = [
    { tipo: 'mensual', meses: 1, precioCentavos: 1000000, descuentoPorcentaje: 0 },
    { tipo: 'trimestral', meses: 3, precioCentavos: 2500000, descuentoPorcentaje: 0 },
    { tipo: 'anual', meses: 12, precioCentavos: 11000000, descuentoPorcentaje: 10 },
].map(plan => ({ ...plan, nombre: `Plan ${plan.tipo}`, habilitado: true, metodoDescuento: null, condicionesDescuento: '' }));
const priceText = value => dinero(value).replace(/\s/g, ' ');
beforeEach(() => {
    listarPlanes.mockReset();
    listarPlanes.mockResolvedValue(planes);
});
function setup(usuario = null) {
    return render(<MemoryRouter><AuthContext.Provider value={{ usuario }}><NotificationProvider><HomePage /></NotificationProvider></AuthContext.Provider></MemoryRouter>);
}

test('mantiene Cerca y la agenda real, sin leyenda bajo la foto', async () => {
    const { container } = setup();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Qué bueno que viniste.');
    expect(screen.getByRole('link', { name: 'Ver actividades' })).toHaveAttribute('href', '/#servicios');
    expect(screen.getByRole('link', { name: 'Ver clases', exact: true })).toHaveAttribute('href', '/clases');
    expect(screen.queryByText(/No corresponde a Target GYM/)).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/marca/gimnasio-referencia.webp');
    expect(container.querySelectorAll('details')).toHaveLength(4);
    expect(container.querySelectorAll('details[open]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Quiero asociarme' })).toHaveAttribute('href', '/asociate');
    await screen.findByText('Plan mensual');
});

test('muestra importes del servidor por periodo y aplica el descuento una sola vez', async () => {
    setup();
    const anual = (await screen.findByRole('heading', { name: 'Plan anual', exact: true })).closest('article');
    expect(within(anual).getByText(priceText(9900000))).toBeVisible();
    expect(within(anual).getByText(priceText(11000000))).toHaveProperty('tagName', 'DEL');
    expect(within(anual).getByText('10% de descuento')).toBeVisible();
    expect(within(anual).getByText('Por 12 meses calendario')).toBeVisible();
    expect(screen.getByText(priceText(1000000))).toBeVisible();
    expect(screen.getByText(priceText(2500000))).toBeVisible();
    expect(screen.getByRole('link', { name: 'Asociate', exact: true })).toHaveAttribute('href', '/asociate');
    expect(screen.getByRole('link', { name: 'Elegir Plan anual' })).toHaveAttribute('href', '/asociate?plan=anual');
});

test('precio sin configurar no se transforma en cero y no simula pagos', async () => {
    listarPlanes.mockResolvedValue([{ ...planes[0], precioCentavos: null }]);
    setup();
    expect(await screen.findByText('Consultá el precio')).toBeVisible();
    expect(screen.queryByText(priceText(0))).not.toBeInTheDocument();
    expect(screen.getByText(/El pago se coordina en el gimnasio/)).toBeVisible();
});

test('descuento condicionado muestra base y promoción sin prometer una rebaja incondicional', async () => {
    listarPlanes.mockResolvedValue([{ ...planes[0], tipo: 'plan-personalizado', nombre: 'Plan flexible', descuentoPorcentaje: 20, metodoDescuento: 'Efectivo', condicionesDescuento: 'Pago presencial.' }]);
    setup();
    const card = (await screen.findByRole('heading', { name: 'Plan flexible' })).closest('article');
    expect(within(card).getByText(priceText(1000000))).toHaveClass('plan-price');
    expect(within(card).getByText(`Con descuento: ${priceText(800000)}`)).toBeVisible();
    expect(within(card).getByText(/Pago presencial/)).toHaveTextContent('Pagando con efectivo. Pago presencial. Se confirma al pagar en el gimnasio.');
    expect(card.querySelector('del')).toBeNull();
});

test('error de precios no oculta la portada y permite reintentar', async () => {
    listarPlanes.mockRejectedValueOnce(new Error('No pudimos consultar los precios.')).mockResolvedValueOnce(planes);
    setup();
    expect(await screen.findByRole('heading', { name: 'No pudimos cargar la información' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Plan anual')).toBeVisible();
});

test('lista vacía de planes se explica sin inventar precios', async () => {
    listarPlanes.mockResolvedValue([]);
    setup();
    expect(await screen.findByText('Todavía no hay planes disponibles. Consultá en el gimnasio.')).toBeVisible();
});

test('carga de precios mantiene la bienvenida visible', () => {
    listarPlanes.mockReturnValue(new Promise(() => {}));
    setup();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando información…');
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
    expect(screen.queryByText('Plan mensual')).not.toBeInTheDocument();
});

test.each([
    ['Socio', 'Ver mi membresía', '/mi-membresia'],
    ['Administrador', 'Configurar planes', '/gestion/planes'],
    ['Instructor', 'Consultar en el gimnasio', '/#contacto'],
])('la acción de planes respeta el rol %s', async (rol, label, href) => {
    setup({ rol });
    expect(await screen.findByRole('link', { name: label })).toHaveAttribute('href', href);
});
