import { test, expect, chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

async function ingresarEquipo(page) {
    await page.goto('/equipo');
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('PruebaSegura123!');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page).toHaveURL('/gestion');
    await expect(page.getByText('Cargando información…')).toHaveCount(0);
}

test('panel estable con scrollbar real al navegar entre secciones cortas y largas', async ({ baseURL }) => {
    const browser = await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
        ignoreDefaultArgs: ['--hide-scrollbars'],
        args: ['--disable-features=OverlayScrollbar,OverlayScrollbars'],
    });
    try {
        const page = await browser.newPage({ baseURL, viewport: { width: 1600, height: 900 } });
        await ingresarEquipo(page);
        await page.addStyleTag({ content: 'html::-webkit-scrollbar { width: 16px; }' });
        const medidas = async () => page.evaluate(() => ({
            scrollbar: innerWidth - document.documentElement.clientWidth,
            scroll: document.documentElement.scrollHeight > document.documentElement.clientHeight,
            rects: ['.equipo-shell', '.equipo-sidebar', '.equipo-content', '.equipo-header'].map(selector => {
                const { x, width } = document.querySelector(selector).getBoundingClientRect();
                return { x, width };
            }),
        }));
        const inicial = await medidas();
        const resultados = [inicial];
        for (const label of ['Pagos', 'Socios', 'Clases', 'Planes', 'Métodos de pago', 'Instructores', 'Reportes', 'Resumen']) {
            await page.getByRole('navigation', { name: 'Gestión del gimnasio' }).getByRole('link', { name: label, exact: true }).click();
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            await expect(page.getByText('Cargando información…')).toHaveCount(0);
            resultados.push(await medidas());
        }
        await page.getByRole('navigation', { name: 'Gestión del gimnasio' }).getByRole('link', { name: 'Socios', exact: true }).click();
        await page.getByRole('link', { name: 'Nuevo socio', exact: true }).click();
        await expect(page.getByText('Cargando información…')).toHaveCount(0);
        resultados.push(await medidas());
        console.log('Geometría del panel:', JSON.stringify(resultados));
        expect(resultados.some(item => item.scroll)).toBe(true);
        expect(resultados.some(item => !item.scroll)).toBe(true);
        expect(resultados.some(item => item.scrollbar > 0)).toBe(true);
        for (const resultado of resultados) for (const [index, rect] of resultado.rects.entries()) {
            expect(Math.abs(rect.x - inicial.rects[index].x)).toBeLessThanOrEqual(1);
            expect(Math.abs(rect.width - inicial.rects[index].width)).toBeLessThanOrEqual(1);
        }
    } finally { await browser.close(); }
});

test('planes con 1, 2, 3, 4, 5 y 7 tarjetas se centran y se adaptan sin desbordar', async ({ page }, testInfo) => {
    let cantidad = 1;
    await page.route('**/api/planes', route => route.fulfill({ json: { success: true, data: Array.from({ length: cantidad }, (_, index) => ({
        tipo: `plan-${index}`, nombre: `Plan ${index + 1}`, meses: index + 1, dias: null, precioCentavos: 1500000,
        precioDescuentoCentavos: null, descripcion: '', requisitosAcceso: '', metodoExclusivo: null, permiteTarjeta: true,
        descuentoPorcentaje: index % 3 === 0 ? 0 : 20, condicionesDescuento: index % 3 === 2 ? 'Confirmación presencial del descuento.' : '',
        metodoDescuento: index % 3 === 2 ? 'Efectivo' : null, habilitado: true,
    })) } }));
    for (const width of [390, 760, 1024, 1600]) for (cantidad of [1, 2, 3, 4, 5, 7]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await expect(page.locator('.plan-card')).toHaveCount(cantidad);
        await page.evaluate(() => document.fonts.ready);
        const medidas = await page.locator('.plan-grid').evaluate(element => {
            const cards = [...element.children].map(card => {
                const { x, y, width, right, bottom } = card.getBoundingClientRect();
                const button = card.querySelector('a.button.primary'), style = getComputedStyle(card);
                const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
                return { x, y, width, right, bottom, fondo: style.backgroundColor, color: style.color,
                    button: button && { width: button.getBoundingClientRect().width, fondo: getComputedStyle(button).backgroundColor, height: button.getBoundingClientRect().height },
                    contenido: card.clientWidth - padding };
            });
            const section = element.closest('section').getBoundingClientRect();
            return { cards, centro: section.x + section.width / 2, overflow: document.documentElement.scrollWidth > innerWidth };
        });
        expect(medidas.overflow).toBe(false);
        const centro = (Math.min(...medidas.cards.map(card => card.x)) + Math.max(...medidas.cards.map(card => card.right))) / 2;
        expect(Math.abs(centro - medidas.centro)).toBeLessThanOrEqual(1);
        for (const card of medidas.cards) {
            expect(card.width).toBeGreaterThanOrEqual(Math.min(280, width - 48));
            expect(card.fondo).toBe('rgb(255, 255, 255)');
            expect(card.color).toBe('rgb(44, 48, 53)');
            expect(card.button).not.toBeNull();
            expect(Math.abs(card.button.width - card.contenido)).toBeLessThanOrEqual(1);
            expect(card.button.height).toBeGreaterThanOrEqual(48);
            expect(card.button.fondo).toBe('rgb(244, 131, 53)');
        }
        if (width === 1600 && cantidad === 1) {
            expect(medidas.cards[0].width).toBeLessThanOrEqual(520);
            await page.screenshot({ path: testInfo.outputPath('plan-unico.png'), fullPage: true });
        }
        if (width === 1600 && cantidad === 5) await page.screenshot({ path: testInfo.outputPath('planes-cinco.png'), fullPage: true });
        if (cantidad === 3 && [390, 1600].includes(width)) {
            expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
            const elegir = page.locator('.plan-card a').first();
            await elegir.focus();
            expect(await elegir.evaluate(element => getComputedStyle(element).outlineColor)).toBe('rgb(44, 48, 53)');
            await expect(elegir).toBeFocused();
        }
    }
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('precios completos en una línea dentro de cada tarjeta, incluso al cambiar las columnas', async ({ page }) => {
    let cantidad = 6;
    await page.route('**/api/planes', route => route.fulfill({ json: { success: true, data: Array.from({ length: cantidad }, (_, index) => ({
        tipo: `precio-${index}`, nombre: `Plan ${index + 1}`, meses: 1, dias: null,
        precioCentavos: [8800000, 9800000, 100000000][index % 3], precioDescuentoCentavos: null,
        descripcion: '', requisitosAcceso: '', metodoExclusivo: null, permiteTarjeta: true,
        descuentoPorcentaje: 0, condicionesDescuento: '', metodoDescuento: null, habilitado: true,
    })) } }));
    for (const width of [1440, 320, 360, 390, 600, 760, 1024, 1280, 1600]) for (cantidad of [1, 2, 3, 5, 6, 7]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await expect(page.locator('.plan-card')).toHaveCount(cantidad);
        await page.evaluate(() => document.fonts.ready);
        const precios = await page.locator('.plan-card .plan-price').evaluateAll(nodes => nodes.map(node => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const rects = [...range.getClientRects()].filter(rect => rect.width > 0), box = node.getBoundingClientRect();
            return { lineas: new Set(rects.map(rect => Math.round(rect.y))).size,
                dentro: rects.every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1),
                legible: parseFloat(getComputedStyle(node).fontSize) >= 20 };
        }));
        expect(precios, `pantalla ${width}px, ${cantidad} planes`).toEqual(Array(cantidad).fill({ lineas: 1, dentro: true, legible: true }));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
});

test('botones cambian de fondo con transición, conservan geometría y respetan deshabilitados y movimiento reducido', async ({ page }) => {
    await page.goto('/');
    for (const [nombre, esperado] of [['Ver planes', 'rgb(255, 173, 115)'], ['Ver clases', 'rgb(232, 235, 238)']]) {
        const boton = page.getByRole('link', { name: nombre, exact: true });
        await page.mouse.move(0, 0);
        const inicial = await boton.evaluate(el => ({ color: getComputedStyle(el).backgroundColor, ancho: el.getBoundingClientRect().width }));
        await boton.hover();
        await expect.poll(() => boton.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(esperado);
        const final = await boton.evaluate(el => ({ color: getComputedStyle(el).backgroundColor, ancho: el.getBoundingClientRect().width,
            duracion: getComputedStyle(el).transitionDuration, propiedad: getComputedStyle(el).transitionProperty }));
        expect(final.color).not.toBe(inicial.color);
        expect(final.ancho).toBe(inicial.ancho);
        expect(final.duracion).toContain('0.22s');
        expect(final.propiedad).toContain('background-color');
    }
    await page.setViewportSize({ width: 390, height: 900 });
    const menu = page.getByRole('button', { name: 'Menú', exact: true });
    await menu.hover();
    await expect(menu).toHaveCSS('background-color', 'rgb(232, 235, 238)');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.route('**/api/metodos-pago', route => route.fulfill({ json: { success: true, data: [] } }));
    await page.goto('/asociate');
    const bloqueado = page.getByRole('button', { name: 'Crear cuenta y solicitar membresía' });
    await expect(bloqueado).toBeDisabled();
    const color = await bloqueado.evaluate(el => getComputedStyle(el).backgroundColor);
    await bloqueado.hover();
    await expect(bloqueado).toHaveCSS('background-color', color);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const principal = page.getByRole('link', { name: 'Ver planes', exact: true });
    await principal.hover();
    await expect(principal).toHaveCSS('transition-duration', '0s');
    await expect(principal).toHaveCSS('background-color', 'rgb(255, 173, 115)');
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/equipo');
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('Incorrecta123!');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    const cerrar = page.getByRole('button', { name: 'Cerrar notificación' });
    await expect(cerrar).toBeVisible();
    await cerrar.hover();
    await expect(cerrar).toHaveCSS('background-color', 'rgb(232, 235, 238)');
    await cerrar.click();
    await expect(cerrar).toHaveCount(0);
});

test('el aviso real de logout desaparece solo aunque el puntero quede encima', async ({ page }) => {
    await ingresarEquipo(page);
    await page.getByRole('button', { name: 'Salir', exact: true }).click();
    await expect(page).toHaveURL('/');
    const aviso = page.getByRole('status').filter({ hasText: 'Cerraste tu sesión.' });
    await expect(aviso).toBeVisible();
    const inicio = Date.now();
    await aviso.hover();
    await expect(aviso).toHaveCount(0, { timeout: 5500 });
    expect(Date.now() - inicio).toBeGreaterThan(3000);
    expect(Date.now() - inicio).toBeLessThan(5500);
});

test('configurar métodos oculta opciones de socios, muestra aviso en caja y permite reactivarlos', async ({ page, browser }, testInfo) => {
    await ingresarEquipo(page);
    const publico = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const visitante = await publico.newPage();
        const cambiar = async codigo => {
            await page.getByRole('navigation', { name: 'Gestión del gimnasio' }).getByRole('link', { name: 'Métodos de pago', exact: true }).click();
            const card = page.getByRole('article', { name: codigo, exact: true });
            const estado = await card.getByRole('button').innerText();
            await card.getByRole('button').click();
            await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
            await expect(page.getByRole('dialog')).toHaveCount(0);
            await expect(card.getByRole('button', { name: estado === 'Deshabilitar' ? 'Habilitar' : 'Deshabilitar', exact: true })).toBeVisible();
        };
        await cambiar('Transferencia');
        await visitante.goto('/asociate');
        await expect(visitante.getByRole('option', { name: 'Efectivo', exact: true })).toBeAttached();
        await expect(visitante.getByRole('option', { name: 'Transferencia', exact: true })).toHaveCount(0);
        await page.getByRole('navigation', { name: 'Gestión del gimnasio' }).getByRole('link', { name: 'Pagos', exact: true }).click();
        await page.getByLabel('Método de pago').selectOption('Transferencia');
        await expect(page.getByText(/Método deshabilitado para socios/)).toBeVisible();
        await expect(page.getByLabel('Método de pago')).toBeEnabled();
        await cambiar('Efectivo');
        await visitante.reload();
        await expect(visitante.getByRole('option', { name: 'Tarjeta', exact: true })).toBeAttached();
        await cambiar('Tarjeta');
        await visitante.reload();
        await expect(visitante.getByText(/No hay métodos de pago habilitados/)).toBeVisible();
        await expect(visitante.getByLabel('Cómo vas a pagar')).toBeDisabled();
        await expect(visitante.locator('form button[type="submit"]')).toBeDisabled();
        for (const width of [360, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
        }
        await page.screenshot({ path: testInfo.outputPath('metodos-pago.png'), fullPage: true });
        await page.setViewportSize({ width: 1440, height: 900 });
        await cambiar('Efectivo');
        await cambiar('Transferencia');
        await cambiar('Tarjeta');
        await visitante.reload();
        await expect(visitante.getByRole('option', { name: 'Transferencia', exact: true })).toBeAttached();
        await expect(visitante.getByRole('option', { name: 'Tarjeta', exact: true })).toBeAttached();
    } finally { await publico.close(); }
});

test('desplazamiento suave en enlaces internos, repetidos y vuelta al inicio, con movimiento reducido', async ({ page }) => {
    async function comprobarClick(link, suave, cambioPagina = false) {
        const inicio = await page.evaluate(() => scrollY);
        const muestras = page.evaluate(() => new Promise(resolve => {
            const posiciones = [], inicio = performance.now();
            function registrar() {
                posiciones.push(scrollY);
                if (performance.now() - inicio >= 1200) resolve(posiciones);
                else requestAnimationFrame(registrar);
            }
            requestAnimationFrame(registrar);
        }));
        await link.click();
        const posiciones = await muestras, final = posiciones.at(-1);
        expect(Math.abs(final - inicio)).toBeGreaterThan(100);
        const intermedias = posiciones.filter(y => y > Math.min(inicio, final) + 2 && y < Math.max(inicio, final) - 2);
        // Una ruta más corta puede limitar el scroll un frame antes de volver arriba.
        if (suave) expect(intermedias.length).toBeGreaterThan(2);
        else expect(intermedias.length).toBeLessThanOrEqual(cambioPagina ? 1 : 0);
    }
    async function menu() {
        const toggle = page.getByRole('button', { name: 'Menú', exact: true });
        if (await toggle.isVisible() && await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
        return page.getByRole('navigation', { name: 'Navegación principal' });
    }
    for (const width of [390, 1440]) {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        await expect(page.getByText('Cargando información…')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        await comprobarClick(page.getByRole('link', { name: 'Ver planes', exact: true }), true);
        await expect(page).toHaveURL('/#planes');
        await expect(page.locator('#planes')).toBeFocused();
        await comprobarClick((await menu()).getByRole('link', { name: 'Inicio', exact: true }), true);
        await comprobarClick((await menu()).getByRole('link', { name: 'Planes', exact: true }), true);
        await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
        await comprobarClick(page.getByRole('link', { name: 'Ver planes', exact: true }), true);
        await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
        await comprobarClick(page.getByRole('link', { name: 'Target GYM, volver al inicio', exact: true }), true);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await comprobarClick(page.getByRole('link', { name: 'Ver planes', exact: true }), false);
        await expect(page.locator('#planes')).toBeFocused();
        await comprobarClick((await menu()).getByRole('link', { name: 'Clases', exact: true }), false, true);
        await expect(page).toHaveURL('/clases');
    }
});
