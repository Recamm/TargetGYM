import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { resolve } from 'node:path';

const muestra = `/@fs${resolve('info/marca/planes-compactos.html')}`;
const anterior = `/@fs${resolve('info/marca/planes.html')}`;
const layouts = ['compactas', 'filas', 'desplegables', 'horizontal'];
const metodos = ['Efectivo', 'Transferencia', 'Tarjeta'].map(codigo => ({ codigo, habilitado: true, permiteSocio: true }));
const base = { meses: 1, dias: null, precioDescuentoCentavos: null, descuentoPorcentaje: 0, condicionesDescuento: '', metodoDescuento: null,
    metodoExclusivo: null, permiteTarjeta: true, requisitosAcceso: '', habilitado: true, descripcion: 'Pase libre y clases incluidas en Florida.' };
const planes = [
    { ...base, tipo: 'mensual', nombre: 'Plan Mensual Libre', precioCentavos: 8800000, precioDescuentoCentavos: 7800000, metodoDescuento: 'Efectivo' },
    { ...base, tipo: 'semanal', nombre: 'Pase semanal', meses: null, dias: 7, precioCentavos: 5000000, precioDescuentoCentavos: 4600000, metodoDescuento: 'Efectivo', permiteTarjeta: false },
    { ...base, tipo: 'quincena', nombre: 'Pase quincena', meses: null, dias: 15, precioCentavos: 5900000, precioDescuentoCentavos: 5300000, metodoDescuento: 'Efectivo', permiteTarjeta: false },
    { ...base, tipo: 'dia', nombre: 'Pase por un día', meses: null, dias: 1, precioCentavos: 3000000, precioDescuentoCentavos: 2500000, metodoDescuento: 'Efectivo', permiteTarjeta: false },
    { ...base, tipo: 'jubilados', nombre: 'Promo jubilados', precioCentavos: 6200000, metodoExclusivo: 'Efectivo', permiteTarjeta: false, requisitosAcceso: 'Exclusivo para jubilados. Recepción debe verificar esta condición.' },
    { ...base, tipo: 'full', nombre: 'Plan FULL Target', precioCentavos: 9800000, descripcion: 'Pase libre mensual y clases incluidas. Acceso a todas las sedes: Florida, San Fernando y Tigre.' },
];

async function catalogo(page, datos = planes, medios = metodos) {
    await page.route('**/api/planes', route => route.fulfill({ json: { success: true, data: datos } }));
    await page.route('**/api/metodos-pago', route => route.fulfill({ json: { success: true, data: medios } }));
}

test('muestras conservan importes legibles y C aplicada reduce al menos 20% frente al estudio Clara', async ({ page }, testInfo) => {
    await catalogo(page);
    const resultados = [];
    for (const width of [320, 390, 760, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await expect(page.locator('.plan-card')).toHaveCount(6);
        await page.evaluate(() => document.fonts.ready);
        const aplicado = await page.locator('.plan-list').evaluate(el => ({ ancho: el.getBoundingClientRect().width, altura: el.getBoundingClientRect().height }));
        await page.goto(`${anterior}#clara`);
        await expect(page.locator('#tarjetas .sample')).toHaveCount(6);
        await page.locator('.shell').evaluate((el, ancho) => { el.style.width = `${ancho}px`; }, aplicado.ancho);
        await page.evaluate(() => document.fonts.ready);
        const alturaClara = await page.locator('#tarjetas').evaluate(el => el.getBoundingClientRect().height);
        expect(aplicado.altura, `C aplicada a ${width}px`).toBeLessThanOrEqual(alturaClara * .8);
        for (const layout of layouts) {
            await page.goto(`${muestra}#${layout}`);
            await expect(page.locator('#tarjetas .sample')).toHaveCount(6);
            await page.evaluate(() => document.fonts.ready);
            const altura = await page.locator('#tarjetas').evaluate(el => el.getBoundingClientRect().height);
            if (['filas', 'desplegables'].includes(layout)) {
                const ancho = await page.locator('#tarjetas').evaluate(el => el.firstElementChild.getBoundingClientRect().width / el.getBoundingClientRect().width);
                expect(ancho).toBeCloseTo(1, 2);
            }
            resultados.push({ width, layout, clara: Math.round(alturaClara), altura: Math.round(altura), ahorro: Math.round((1 - altura / alturaClara) * 100) });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            if (layout === 'desplegables') {
                for (const fold of await page.locator('.plan-fold').all()) await fold.locator('summary').click();
            } else {
                for (const detalle of await page.locator('.plan-description-toggle').all()) await detalle.locator('summary').click();
            }
            const mensual = page.getByRole('article', { name: 'Plan Mensual Libre', exact: true });
            await expect(mensual).toContainText('$ 78.000');
            await expect(mensual).toContainText('$ 88.000');
            await expect(mensual).toContainText('Transferencia o tarjeta');
            await expect(page.getByRole('article', { name: 'Promo jubilados' })).toContainText('Exclusivo para jubilados');
            const precios = await page.locator('#tarjetas .quote .amount').evaluateAll(nodes => nodes.map(node => {
                const range = document.createRange();
                range.selectNodeContents(node);
                const text = range.getBoundingClientRect(), box = node.parentElement.getBoundingClientRect();
                return { lineas: range.getClientRects().length, dentro: text.left >= box.left - 1 && text.right <= box.right + 1 };
            }));
            expect(precios.every(p => p.lineas === 1 && p.dentro), `${layout} a ${width}px: ${JSON.stringify(precios)}`).toBe(true);
            if ([390, 1440].includes(width)) {
                expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
                if (layout === 'desplegables') {
                    for (const fold of await page.locator('.plan-fold').all()) await fold.locator('summary').click();
                } else {
                    for (const detalle of await page.locator('.plan-description-toggle').all()) await detalle.locator('summary').click();
                }
                await page.screenshot({ path: testInfo.outputPath(`${layout}-${width}.png`), fullPage: true });
            }
        }
    }
    console.log('Alturas del catálogo con seis planes:', JSON.stringify(resultados));
});

test('radio, enlaces directos, desplegables y tira horizontal funcionan con teclado y movimiento reducido', async ({ page }) => {
    await catalogo(page);
    await page.goto(muestra);
    const opcion = page.getByRole('radio', { name: /^A\. Compactas/ });
    await opcion.focus();
    await page.keyboard.press('ArrowRight');
    await expect(page).toHaveURL(`${muestra}#filas`);
    await expect(page.locator('#tarjetas')).toHaveAttribute('data-layout', 'filas');
    await page.goto(`${muestra}#desplegables`);
    const summary = page.locator('.plan-fold > summary').first();
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.plan-fold').first()).toHaveJSProperty('open', true);
    await expect(page.getByRole('link', { name: 'Elegir plan: Plan Mensual Libre', exact: true })).toHaveAttribute('href', '/asociate?plan=mensual');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: 'Elegir plan: Plan Mensual Libre', exact: true })).toBeHidden();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(`${muestra}#horizontal`);
    const tira = page.getByRole('region', { name: 'Todos los planes, desplazamiento horizontal' });
    await expect(tira).toHaveCSS('scroll-behavior', 'auto');
    await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled();
    const siguiente = page.getByRole('button', { name: 'Siguiente', exact: true });
    await siguiente.click();
    await expect.poll(() => tira.evaluate(el => el.scrollLeft)).toBeGreaterThan(0);
    await tira.evaluate(el => el.scrollTo({ left: el.scrollWidth }));
    await expect(siguiente).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeEnabled();
    const fin = await tira.evaluate(el => el.scrollLeft);
    await page.getByRole('button', { name: 'Anterior', exact: true }).click();
    await expect.poll(() => tira.evaluate(el => el.scrollLeft)).toBeLessThan(fin);
    await page.getByRole('link', { name: 'Elegir plan: Plan Mensual Libre', exact: true }).focus();
    const enVista = await page.getByRole('link', { name: 'Elegir plan: Plan Mensual Libre', exact: true }).evaluate(el => {
        const box = el.getBoundingClientRect(), rail = document.querySelector('#tarjetas').getBoundingClientRect();
        return box.left >= rail.left && box.right <= rail.right;
    });
    expect(enVista).toBe(true);
    await page.goto(`${muestra}#invalido`);
    await expect(page.getByRole('radio', { name: /^A\. Compactas/ })).toBeChecked();
});

test('errores y reintento, catálogo vacío, métodos apagados y datos seguros son explícitos', async ({ page }) => {
    let fallo = true;
    await page.route('**/api/planes', route => fallo ? route.fulfill({ status: 503 }) : route.fulfill({ json: { success: true, data: planes } }));
    await page.route('**/api/metodos-pago', route => route.fulfill({ json: { success: true, data: metodos } }));
    await page.goto(muestra);
    await expect(page.getByRole('status')).toContainText('No se pudo cargar');
    fallo = false;
    await page.getByRole('button', { name: 'Reintentar carga' }).click();
    await expect(page.locator('#tarjetas .sample')).toHaveCount(6);
    await catalogo(page, []);
    await page.goto(`${muestra}?caso=vacio#horizontal`);
    await expect(page.getByRole('status')).toContainText('No hay planes publicados');
    await expect(page.locator('#recorrido')).toBeHidden();
    const hostil = { ...base, tipo: 'seguro', nombre: '<img src=x onerror=alert(1)>', precioCentavos: 100000000,
        descripcion: 'Descripción extensa. '.repeat(20), requisitosAcceso: 'Requisito informado. '.repeat(20),
        descuentoPorcentaje: 10, metodoDescuento: 'Transferencia', condicionesDescuento: 'Presentar comprobante de la promoción.' };
    for (const layout of layouts) {
        await catalogo(page, [hostil, { ...planes[0], tipo: 'no-precio', precioCentavos: null, precioDescuentoCentavos: null }, { ...planes[1], tipo: 'oculto', habilitado: false }], metodos.map(m => ({ ...m, habilitado: false })));
        await page.goto(`${muestra}?caso=sin-medios-${layout}#${layout}`);
        await expect(page.locator('#tarjetas .sample')).toHaveCount(2);
        if (layout === 'desplegables') for (const fold of await page.locator('.plan-fold').all()) await fold.locator('summary').click();
        await expect(page.locator('#tarjetas')).toContainText(hostil.nombre);
        await expect(page.locator('#tarjetas img')).toHaveCount(0);
        await expect(page.locator('#tarjetas')).toContainText('Sin métodos disponibles');
        await expect(page.locator('#tarjetas')).toContainText('Se confirma en recepción');
        await expect(page.locator('#tarjetas .choose').first()).toHaveAttribute('href', '/#contacto');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    await catalogo(page, [hostil], metodos);
    await page.goto(`${muestra}?caso=precio#compactas`);
    await expect(page.locator('#tarjetas')).toContainText('$ 1.000.000');
    await expect(page.locator('#tarjetas')).toContainText('Promoción:');
    await page.goto(anterior);
    await expect(page.locator('#tarjetas .sample')).toHaveCount(1);
    await expect(page.locator('#tarjetas')).toContainText('$ 1.000.000');
    await expect(page.locator('#tarjetas img')).toHaveCount(0);
});

test('cantidades variables, centavos y nombres largos no rompen las cuatro distribuciones', async ({ page }) => {
    let cantidad = 1;
    await page.route('**/api/planes', route => route.fulfill({ json: { success: true, data: Array.from({ length: cantidad }, (_, index) => ({
        ...base, tipo: `variable-${index}`, nombre: index === 0 ? 'Entrenamiento'.repeat(9) : `Plan ${index + 1}`,
        precioCentavos: index % 2 ? 99999999 : 100000000, descripcion: 'Descripción del entrenamiento. '.repeat(15),
    })) } }));
    await page.route('**/api/metodos-pago', route => route.fulfill({ json: { success: true, data: metodos.filter(m => m.codigo === 'Transferencia') } }));
    for (const width of [320, 390, 760, 1440]) for (cantidad of [1, 2, 3, 7]) for (const layout of layouts) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(`${muestra}?cantidad=${cantidad}&width=${width}#${layout}`);
        await expect(page.locator('#tarjetas .sample')).toHaveCount(cantidad);
        if (layout === 'desplegables') for (const fold of await page.locator('.plan-fold').all()) await fold.locator('summary').click();
        await expect(page.locator('#tarjetas')).not.toContainText('Efectivo');
        if (cantidad > 1) await expect(page.locator('#tarjetas')).toContainText('999.999,99');
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        const importes = await page.locator('#tarjetas .amount').evaluateAll(nodes => nodes.map(el => {
            const range = document.createRange();
            range.selectNodeContents(el);
            return range.getBoundingClientRect().width <= el.parentElement.getBoundingClientRect().width + 1;
        }));
        expect(importes.every(Boolean), `${layout}, ${width}px, ${cantidad} planes`).toBe(true);
        if (layout === 'horizontal' && cantidad === 1) {
            await expect(page.getByRole('button', { name: 'Anterior', exact: true })).toBeDisabled();
            await expect(page.getByRole('button', { name: 'Siguiente', exact: true })).toBeDisabled();
        }
    }
    await page.route('**/api/metodos-pago', route => route.fulfill({ json: { success: true, data: [{ codigo: 'Incorrecto' }] } }));
    await page.goto(`${muestra}?caso=contrato-invalido`);
    await expect(page.getByRole('status')).toContainText('No se pudo cargar');
    await expect(page.getByRole('button', { name: 'Reintentar carga' })).toBeVisible();
});
