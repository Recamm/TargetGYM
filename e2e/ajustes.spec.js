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

test('planes con 1, 2, 3, 4, 5 y 7 desplegables ocupan el ancho disponible sin desbordar', async ({ page }, testInfo) => {
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
        const medidas = await page.locator('.plan-list').evaluate(element => {
            const box = element.getBoundingClientRect();
            return { ancho: box.width, x: box.x, folds: [...element.children].map(fold => {
                const rect = fold.getBoundingClientRect();
                return { ancho: rect.width, x: rect.x, open: fold.open };
            }), overflow: document.documentElement.scrollWidth > innerWidth };
        });
        expect(medidas.overflow).toBe(false);
        for (const fold of medidas.folds) {
            expect(Math.abs(fold.ancho - medidas.ancho)).toBeLessThanOrEqual(1);
            expect(Math.abs(fold.x - medidas.x)).toBeLessThanOrEqual(1);
            expect(fold.open).toBe(false);
        }
        await expect(page.getByRole('link', { name: /^Elegir / })).toHaveCount(0);
        if (width === 1600 && cantidad === 1) {
            await page.screenshot({ path: testInfo.outputPath('plan-unico.png'), fullPage: true });
        }
        if (width === 1600 && cantidad === 5) await page.screenshot({ path: testInfo.outputPath('planes-cinco.png'), fullPage: true });
        if (cantidad === 3 && [390, 1600].includes(width)) {
            expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
            const summary = page.locator('.plan-fold > summary').first();
            await summary.focus();
            await page.keyboard.press('Enter');
            await expect(page.locator('.plan-fold').first()).toHaveJSProperty('open', true);
            const elegir = page.locator('.plan-card a').first();
            await elegir.focus();
            await expect(elegir).toBeVisible();
            await expect(elegir).toHaveCSS('background-color', 'rgb(44, 48, 53)');
            expect(await elegir.evaluate(element => getComputedStyle(element).outlineColor)).toBe('rgb(44, 48, 53)');
            await expect(elegir).toBeFocused();
            expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
        }
    }
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
});

test('precios completos en resumen y detalle de cada plan en todos los anchos', async ({ page }) => {
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
        for (const fold of await page.locator('.plan-fold').all()) await fold.locator('summary').click();
        await page.evaluate(() => document.fonts.ready);
        const precios = await page.locator('.plan-summary-amount, .plan-card .plan-price').evaluateAll(nodes => nodes.map(node => {
            const range = document.createRange();
            range.selectNodeContents(node);
            const rects = [...range.getClientRects()].filter(rect => rect.width > 0), box = node.getBoundingClientRect();
            return { lineas: new Set(rects.map(rect => Math.round(rect.y))).size,
                dentro: rects.every(rect => rect.left >= box.left - 1 && rect.right <= box.right + 1),
                legible: parseFloat(getComputedStyle(node).fontSize) >= 16 };
        }));
        expect(precios, `pantalla ${width}px, ${cantidad} planes`).toEqual(Array(cantidad * 2).fill({ lineas: 1, dentro: true, legible: true }));
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
});

test('C abre con teclado, conserva foco y estado al actualizar tarifas y no promete medios apagados', async ({ page }) => {
    await page.clock.install();
    let efectivo = true;
    await page.route('**/api/planes', route => route.fulfill({ json: { success: true, data: [{
        tipo: 'mensual', nombre: 'Plan Mensual Libre', meses: 1, dias: null, precioCentavos: 8800000,
        precioDescuentoCentavos: 7800000, descuentoPorcentaje: 0, metodoDescuento: 'Efectivo', condicionesDescuento: '',
        descripcion: 'Entrenamiento acompañado.', requisitosAcceso: 'Condición verificada en recepción.',
        metodoExclusivo: null, permiteTarjeta: true, habilitado: true,
    }] } }));
    await page.route('**/api/metodos-pago', route => route.fulfill({ json: { success: true, data: ['Efectivo', 'Transferencia', 'Tarjeta']
        .map(codigo => ({ codigo, habilitado: codigo !== 'Efectivo' || efectivo, permiteSocio: true })) } }));
    await page.goto('/#planes');
    const fold = page.locator('.plan-fold'), summary = fold.locator('summary');
    await expect(summary).toContainText('Efectivo');
    await expect(summary).toContainText('78.000');
    await expect(page.getByRole('link', { name: 'Elegir Plan Mensual Libre', exact: true })).toHaveCount(0);
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(fold).toHaveJSProperty('open', true);
    await expect(page.getByRole('article', { name: 'Plan Mensual Libre', exact: true })).toContainText('Condición verificada en recepción.');
    await expect(page.getByRole('link', { name: 'Elegir Plan Mensual Libre', exact: true })).toBeVisible();
    efectivo = false;
    await page.clock.fastForward(30000);
    await expect(summary).toContainText('Transferencia o tarjeta');
    await expect(summary).toContainText('88.000');
    await expect(fold).toHaveJSProperty('open', true);
    await expect(summary).toBeFocused();
    await expect(fold.locator('.plan-card')).not.toContainText('78.000');
    await expect(fold.locator('.plan-card')).not.toContainText('Efectivo');
    await page.keyboard.press('Enter');
    await expect(fold).toHaveJSProperty('open', false);
    await expect(page.getByRole('link', { name: 'Elegir Plan Mensual Libre', exact: true })).toHaveCount(0);
    await expect(summary).toBeFocused();
});

test('portada A conserva foto horizontal, esquinas de 24 px y superficies neutras responsive', async ({ page }, testInfo) => {
    for (const width of [320, 390, 760, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto('/');
        const foto = page.locator('.hero-photo img');
        await expect(foto).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const medidas = await foto.evaluate(img => {
            const rect = img.getBoundingClientRect(), copy = document.querySelector('.hero-copy').getBoundingClientRect();
            const style = getComputedStyle(img);
            return { cargada: img.complete && img.naturalWidth > 0, proporcion: rect.width / rect.height,
                radios: [style.borderTopLeftRadius, style.borderTopRightRadius, style.borderBottomLeftRadius, style.borderBottomRightRadius],
                x: rect.x, y: rect.y, right: rect.right, copyX: copy.x, copyBottom: copy.bottom,
                overflow: document.documentElement.scrollWidth > innerWidth };
        });
        expect(medidas.cargada).toBe(true);
        expect(medidas.proporcion).toBeCloseTo(4 / 3, 2);
        expect(medidas.radios).toEqual(['24px', '24px', '24px', '24px']);
        expect(medidas.overflow).toBe(false);
        const suave = 'rgb(245, 246, 247)';
        await expect(page.locator('.location-line')).toHaveCSS('border-left-width', '0px');
        await expect(page.locator('.site-header nav > a[aria-current="page"]')).toHaveCSS('text-decoration-color', 'rgb(44, 48, 53)');
        await expect(page.locator('.activity[open]')).toHaveCSS('background-color', suave);
        await expect(page.locator('.plan-summary-heading .plan-period').first()).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
        await expect(page.locator('.plan-card').first()).toHaveCSS('background-color', 'rgb(255, 255, 255)');
        await expect(page.locator('.gym-benefits li').first()).toHaveCSS('border-left-width', '0px');
        await expect(page.locator('.footer-visit')).toHaveCSS('border-top-width', '0px');
        if (width > 760) expect(medidas.right).toBeLessThan(medidas.copyX);
        else expect(medidas.y).toBeGreaterThan(medidas.copyBottom);
        if ([390, 1440].includes(width)) {
            const actividad = page.locator('.activity').nth(1), control = actividad.locator('summary');
            await control.focus();
            await page.keyboard.press('Enter');
            await expect(actividad).toHaveJSProperty('open', true);
            await expect(actividad).toHaveCSS('background-color', suave);
            await page.keyboard.press('Enter');
            await expect(actividad).toHaveJSProperty('open', false);
            await expect(actividad).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
            await control.blur();
            await page.screenshot({ path: testInfo.outputPath(`portada-A-${width}.png`), fullPage: true });
            expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
        }
    }
});

test('botones cambian de fondo con transición, conservan geometría y respetan deshabilitados y movimiento reducido', async ({ page }) => {
    const naranja = 'rgb(244, 131, 53)', grafito = 'rgb(44, 48, 53)', blanco = 'rgb(255, 255, 255)';
    async function verificar(boton, primario = false) {
        const esperado = primario ? grafito : naranja, texto = primario ? blanco : grafito;
        await page.mouse.move(0, 0);
        await expect(boton).toHaveCSS('background-color', primario ? naranja : grafito);
        const inicial = await boton.boundingBox();
        await boton.hover();
        await expect(boton).toHaveCSS('background-color', esperado);
        await expect(boton).toHaveCSS('color', texto);
        const final = await boton.evaluate(el => ({ ancho: el.getBoundingClientRect().width, alto: el.getBoundingClientRect().height,
            duracion: getComputedStyle(el).transitionDuration, propiedad: getComputedStyle(el).transitionProperty }));
        expect(final.ancho).toBe(inicial.width);
        expect(final.alto).toBe(inicial.height);
        expect(final.duracion).toContain('0.22s');
        expect(final.propiedad).toContain('background-color');
        await page.mouse.move(0, 0);
        await page.keyboard.press('Tab');
        await boton.focus();
        await expect(boton).toHaveCSS('background-color', esperado);
        await expect(boton).toHaveCSS('color', texto);
        await expect(boton).toHaveCSS('outline-style', 'solid');
        await boton.blur();
        await expect(boton).toHaveCSS('background-color', primario ? naranja : grafito);
    }
    await page.goto('/');
    await verificar(page.getByRole('link', { name: 'Ver planes', exact: true }), true);
    await verificar(page.getByRole('link', { name: 'Ver clases', exact: true }));
    await page.goto('/clases');
    await verificar(page.getByRole('button', { name: 'Limpiar filtros', exact: true }));
    await page.goto('/');
    await page.setViewportSize({ width: 390, height: 900 });
    await verificar(page.getByRole('button', { name: 'Menú', exact: true }));
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
    await expect(principal).toHaveCSS('background-color', grafito);
    await expect(principal).toHaveCSS('color', blanco);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.goto('/equipo');
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('Incorrecta123!');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    const cerrar = page.getByRole('button', { name: 'Cerrar notificación' });
    await expect(cerrar).toBeVisible();
    await verificar(cerrar);
    await cerrar.click();
    await expect(cerrar).toHaveCount(0);
    await ingresarEquipo(page);
    await page.goto('/gestion/planes');
    const plan = page.getByRole('article').first();
    await verificar(plan.getByRole('button', { name: 'Editar', exact: true }));
    const eliminar = plan.getByRole('button', { name: 'Eliminar', exact: true });
    await verificar(eliminar);
    await eliminar.click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toBeVisible();
    await verificar(dialogo.getByRole('button', { name: 'Confirmar', exact: true }), true);
    await dialogo.getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(dialogo).toHaveCount(0);
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
