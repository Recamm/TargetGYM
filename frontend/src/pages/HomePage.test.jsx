import { beforeEach, expect, test, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../components/AuthContext.js';
import NotificationProvider from '../components/NotificationProvider.jsx';
import { listarPlanes, listarMetodosPago } from '../services/membresiasService.js';
import { dinero } from '../utils/validation.js';
import HomePage from './HomePage.jsx';

vi.mock('../services/membresiasService.js', () => ({ listarPlanes: vi.fn(), listarMetodosPago: vi.fn() }));
const planes = [
    { tipo: 'mensual', meses: 1, precioCentavos: 1000000, descuentoPorcentaje: 0 },
    { tipo: 'trimestral', meses: 3, precioCentavos: 2500000, descuentoPorcentaje: 0 },
    { tipo: 'anual', meses: 12, precioCentavos: 11000000, descuentoPorcentaje: 10 },
].map(plan => ({ ...plan, nombre: `Plan ${plan.tipo}`, habilitado: true, metodoDescuento: null, condicionesDescuento: '' }));
const priceText = value => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value / 100).replace(/\s/g, ' ');
beforeEach(() => {
    listarPlanes.mockReset();
    listarPlanes.mockResolvedValue(planes);
    listarMetodosPago.mockReset();
    listarMetodosPago.mockResolvedValue(['Efectivo', 'Transferencia', 'Tarjeta'].map(codigo => ({ codigo, habilitado: true, permiteSocio: true })));
});
function setup(usuario = null) {
    return render(<MemoryRouter><AuthContext.Provider value={{ usuario }}><NotificationProvider><HomePage /></NotificationProvider></AuthContext.Provider></MemoryRouter>);
}
async function abrirPlan(nombre) {
    const fold = (await screen.findByRole('heading', { name: nombre, exact: true })).closest('details');
    fireEvent.click(fold.querySelector('summary'));
    return fold.querySelector('article');
}

test('C muestra resumen por método y conserva tarifas y requisitos dentro del desplegable cerrado', async () => {
    listarPlanes.mockResolvedValue([{ ...planes[0], nombre: 'Plan libre', precioCentavos: 8800000,
        precioDescuentoCentavos: 7800000, metodoDescuento: 'Efectivo', descripcion: 'Entrenamiento acompañado.',
        requisitosAcceso: 'Confirmar requisito en recepción.' }]);
    setup();
    const titulo = await screen.findByRole('heading', { name: 'Plan libre' });
    const fold = titulo.closest('details');
    expect(fold).not.toBeNull();
    expect(fold).not.toHaveAttribute('open');
    const resumen = within(fold.querySelector('summary'));
    expect(resumen.getByText('Efectivo')).toBeVisible();
    expect(resumen.getByText(priceText(7800000))).toBeVisible();
    expect(resumen.getByText('Por 1 mes calendario')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Elegir Plan libre' })).not.toBeVisible();
    fireEvent.click(fold.querySelector('summary'));
    expect(fold).toHaveAttribute('open');
    const cuerpo = within(fold.querySelector('article'));
    expect(cuerpo.getByText(priceText(7800000))).toBeVisible();
    expect(cuerpo.getByText(priceText(8800000))).toBeVisible();
    expect(cuerpo.getByText('Entrenamiento acompañado.')).toBeVisible();
    expect(cuerpo.getByText('Confirmar requisito en recepción.')).toBeVisible();
    expect(cuerpo.getByRole('link', { name: 'Elegir Plan libre' })).toHaveAttribute('href', '/asociate?plan=mensual');
    fireEvent.click(fold.querySelector('summary'));
    expect(fold).not.toHaveAttribute('open');
    expect(screen.getByRole('link', { name: 'Elegir Plan libre' })).not.toBeVisible();
});

test('C informa falta de métodos en el resumen y no usa una tarifa falsa', async () => {
    listarMetodosPago.mockResolvedValue([]);
    listarPlanes.mockResolvedValue([planes[0]]);
    setup();
    const fold = (await screen.findByRole('heading', { name: 'Plan mensual' })).closest('details');
    expect(fold).not.toBeNull();
    expect(within(fold.querySelector('summary')).getByText('Sin métodos disponibles')).toBeVisible();
    expect(within(fold.querySelector('summary')).getByText('Consultá en recepción')).toBeVisible();
    expect(within(fold.querySelector('summary')).queryByText(priceText(1000000))).not.toBeInTheDocument();
});

test('mantiene Cerca y la agenda real, sin leyenda bajo la foto', async () => {
    const { container } = setup();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Qué bueno que viniste.');
    expect(screen.getByRole('link', { name: 'Ver planes', exact: true })).toHaveAttribute('href', '/#planes');
    expect(screen.getByRole('link', { name: 'Ver clases', exact: true })).toHaveAttribute('href', '/clases');
    expect(screen.queryByText(/No corresponde a Target GYM/)).not.toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', '/marca/gimnasio-referencia.webp');
    expect(container.querySelectorAll('.activity')).toHaveLength(4);
    expect(container.querySelectorAll('.activity[open]')).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Quiero asociarme' })).toHaveAttribute('href', '/asociate');
    await screen.findByText('Plan mensual');
});

test('muestra importes del servidor por periodo y aplica el descuento una sola vez', async () => {
    setup();
    const anual = await abrirPlan('Plan anual');
    expect(within(anual).getByText(priceText(9900000))).toBeVisible();
    expect(within(anual).getByText(dinero(11000000).replace(/\s/g, ' '))).toHaveProperty('tagName', 'DEL');
    expect(within(anual).getByText('10% de descuento')).toBeVisible();
    expect(within(anual.closest('details').querySelector('summary')).getByText('Por 12 meses calendario')).toBeVisible();
    expect(within(await abrirPlan('Plan mensual')).getByText(priceText(1000000))).toBeVisible();
    expect(within(await abrirPlan('Plan trimestral')).getByText(priceText(2500000))).toBeVisible();
    expect(screen.getByRole('link', { name: 'Asociate', exact: true })).toHaveAttribute('href', '/asociate');
    expect(screen.getByRole('link', { name: 'Elegir Plan anual' })).toHaveAttribute('href', '/asociate?plan=anual');
    expect(screen.getByRole('link', { name: 'Elegir Plan anual' })).toHaveClass('button', 'primary');
});

test('precio sin configurar no se transforma en cero y no simula pagos', async () => {
    listarPlanes.mockResolvedValue([{ ...planes[0], precioCentavos: null }]);
    setup();
    const card = await abrirPlan('Plan mensual');
    expect(within(card).getByText('Consultá el precio')).toBeVisible();
    expect(screen.queryByText(priceText(0))).not.toBeInTheDocument();
    expect(screen.getByText(/El pago se coordina en el gimnasio/)).toBeVisible();
    expect(screen.queryByRole('link', { name: /^Elegir / })).not.toBeInTheDocument();
});

test('descuento condicionado muestra base y promoción sin prometer una rebaja incondicional', async () => {
    listarPlanes.mockResolvedValue([{ ...planes[0], tipo: 'plan-personalizado', nombre: 'Plan flexible', descuentoPorcentaje: 20, metodoDescuento: 'Efectivo', condicionesDescuento: 'Pago presencial.' }]);
    setup();
    const card = await abrirPlan('Plan flexible');
    expect(within(card).getByText(priceText(1000000))).toHaveClass('plan-price');
    expect(within(card).getByText(`Con descuento: ${dinero(800000).replace(/\s/g, ' ')}`)).toBeVisible();
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

test('pase diario publica el importe exacto en efectivo y su duración, sin porcentajes aproximados', async () => {
    listarPlanes.mockResolvedValue([{ ...planes[0], tipo: 'pase-dia', nombre: 'Pase por un día', meses: null, dias: 1,
        precioCentavos: 3000000, precioDescuentoCentavos: 2500000, metodoDescuento: 'Efectivo', permiteTarjeta: false,
        descripcion: 'Pase libre y clases incluidas.', requisitosAcceso: '', metodoExclusivo: null }]);
    setup();
    const card = await abrirPlan('Pase por un día');
    expect(within(card).getByText(priceText(3000000))).toBeVisible();
    expect(within(card).getByText(priceText(2500000))).toBeVisible();
    expect(within(card).getByText('Efectivo')).toBeVisible();
    expect(within(card).getByText('Transferencia')).toBeVisible();
    expect(within(card).queryByText(/Tarjeta/)).not.toBeInTheDocument();
    expect(within(card.closest('details').querySelector('summary')).getByText('Por 1 día corrido')).toBeVisible();
    expect(within(card).getByText('Pase libre y clases incluidas.')).toBeVisible();
    expect(card).not.toHaveTextContent('0%');
});

test('publica beneficios confirmados e instalaciones sin inventar servicios', async () => {
    setup();
    expect(screen.getByText('Pase libre y clases incluidas.')).toBeVisible();
    expect(screen.getByText('Sin matrícula ni inscripción.')).toBeVisible();
    expect(screen.getByText(/Duchas, vestidores y lockers/)).toBeVisible();
    expect(screen.getByText(/Traé tu candado/)).toBeVisible();
    await screen.findByText('Plan mensual');
});

test('carga de precios mantiene la bienvenida visible', () => {
    listarPlanes.mockReturnValue(new Promise(() => {}));
    setup();
    expect(screen.getByRole('status')).toHaveTextContent('Cargando información…');
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible();
    expect(screen.queryByText('Plan mensual')).not.toBeInTheDocument();
});

test('C agrupa importes por método sin ofrecer efectivo deshabilitado ni redondear centavos', async () => {
    listarPlanes.mockResolvedValue([{ ...planes[0], precioCentavos: 8800050, precioDescuentoCentavos: 7800000, metodoDescuento: 'Efectivo' }]);
    listarMetodosPago.mockResolvedValue(['Transferencia', 'Tarjeta'].map(codigo => ({ codigo, habilitado: true, permiteSocio: true })));
    setup();
    const card = await abrirPlan('Plan mensual');
    expect(within(card.closest('details').querySelector('summary')).getByText(priceText(8800050))).toBeVisible();
    expect(within(card).getByText('Transferencia o tarjeta')).toBeVisible();
    expect(within(card).getByText(priceText(8800050))).toBeVisible();
    expect(within(card).queryByText(priceText(7800000))).not.toBeInTheDocument();
    expect(within(card).queryByText('Efectivo')).not.toBeInTheDocument();
});

test('error de métodos permite reintentar sin anunciar precios por medios desconocidos', async () => {
    listarMetodosPago.mockRejectedValueOnce(new Error('No pudimos consultar los métodos.'))
        .mockResolvedValueOnce([{ codigo: 'Efectivo', habilitado: true, permiteSocio: true }]);
    setup();
    expect(await screen.findByText('No pudimos consultar los métodos.')).toBeVisible();
    expect(screen.queryByRole('article')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Plan mensual')).toBeVisible();
});

test('sin métodos compatibles informa el estado y no ofrece contratar el plan', async () => {
    listarMetodosPago.mockResolvedValue([]);
    listarPlanes.mockResolvedValue([planes[0]]);
    setup();
    const card = await abrirPlan('Plan mensual');
    expect(within(card).getByText('No hay métodos de pago disponibles para este plan. Consultá en el gimnasio.')).toBeVisible();
    expect(screen.queryByRole('link', { name: 'Elegir Plan mensual' })).not.toBeInTheDocument();
});

test.each([
    ['Socio', 'Ver mi membresía', '/mi-membresia'],
    ['Administrador', 'Configurar planes', '/gestion/planes'],
    ['Instructor', 'Consultar en el gimnasio', '/#contacto'],
])('la acción de planes respeta el rol %s', async (rol, label, href) => {
    const { container } = setup({ rol });
    expect(await screen.findByRole('link', { name: label })).toHaveAttribute('href', href);
    for (const summary of container.querySelectorAll('.plan-fold > summary')) fireEvent.click(summary);
    expect(screen.queryByRole('link', { name: /^Elegir / })).not.toBeInTheDocument();
});
