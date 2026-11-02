import { test, expect, chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import AxeBuilder from '@axe-core/playwright';
const password = 'PruebaSegura123!';
async function login(page, email) {
    await page.goto('/login');
    await page.getByLabel('Email', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Salir', exact: true })).toBeVisible();
}
async function logout(page) { await page.getByRole('button', { name: 'Salir', exact: true }).click(); await expect(page).toHaveURL('/'); }
async function cerrarAvisos(page) {
    for (let intento = 0; intento < 10 && await page.locator('.notice-close').count(); intento++) await page.locator('.notice-close').first().click();
    await expect(page.locator('.notice-close')).toHaveCount(0);
}
async function datosUsuario(page, { nombre, email, dni }) {
    for (const [label, value] of [['Nombre',nombre],['Apellido','Sintetico'],['Email',email],['DNI',dni],['Teléfono','1100000000'],['Fecha de nacimiento','2000-01-01'],['Contraseña',password]]) await page.getByLabel(label, { exact: true }).fill(value);
}
async function verificarIdentidad(page, rutas, testInfo, rol) {
    for (const ruta of rutas) {
        await page.goto(ruta);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByText('Cargando información…')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('.brand-link img')).toHaveCount(0);
        await expect(page.locator('.brand-link')).toHaveText(await page.locator('.equipo-shell').count() ? ['Target gym'] : ['Target gym', 'Target gym']);
        expect(await page.locator('h1').evaluate(element => getComputedStyle(element).fontFamily)).toContain('Outfit');
        expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--action').trim())).toBe('#f48335');
        for (const width of [360, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
            expect(results.violations).toEqual([]);
        }
    }
    await page.screenshot({ path: testInfo.outputPath(`${rol}-marca.png`), fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
}
test('flujo completo administrador, socio e instructor con datos reales', async ({ page, request }, testInfo) => {
    test.setTimeout(120000);
    const failures = [];
    page.on('pageerror', error => failures.push(error.message));
    await page.clock.setFixedTime(new Date('2030-01-01T12:00:00-03:00'));
    await login(page, 'admin@example.test');
    await verificarIdentidad(page, ['/gestion', '/gestion/clases', '/gestion/socios', '/gestion/pagos', '/gestion/planes', '/gestion/instructores', '/gestion/reportes', '/mi-cuenta'], testInfo, 'administrador');
    await page.goto('/gestion/clases');
    await page.getByRole('navigation', { name: 'Gestión del gimnasio' }).getByRole('link', { name: 'Planes', exact: true }).click();
    await page.getByRole('article', { name: 'Plan mensual', exact: true }).getByRole('button', { name: 'Editar', exact: true }).click();
    const mensual = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Editar plan', exact: true }) });
    await mensual.getByLabel('Precio base (ARS)').fill('15000');
    await mensual.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByText('Listo: Plan mensual actualizado.')).toBeVisible();
    await page.getByRole('link', { name: 'Instructores', exact: true }).click();
    await page.getByRole('button', { name: 'Nuevo instructor' }).click();
    await datosUsuario(page, { nombre: 'Instructor', email: 'instructor@example.test', dni: '90003001' });
    await page.getByLabel('Especialidad').fill('Funcional');
    await page.getByRole('button', { name: 'Crear instructor', exact: true }).click();
    await expect(page.getByText('Listo: Instructor creado.')).toBeVisible();
    await page.getByRole('link', { name: 'Clases', exact: true }).last().click();
    await page.getByRole('link', { name: 'Nueva clase', exact: true }).click();
    for (const [label,value] of [['Nombre de la clase','Funcional de prueba'],['Actividad','Funcional'],['Fecha','2030-01-02'],['Hora de inicio','18:00'],['Duración (minutos)','60'],['Cupo máximo','2']]) await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByLabel('Instructor', { exact: true }).selectOption({ label: 'Instructor Sintetico' });
    await page.getByRole('button', { name: 'Guardar clase' }).click();
    await expect(page.getByRole('heading', { name: 'Funcional de prueba' })).toBeVisible();
    await page.getByRole('link', { name: 'Editar', exact: true }).click();
    await page.getByLabel('Cupo máximo').fill('3');
    await page.getByRole('button', { name: 'Guardar clase' }).click();
    await expect(page.getByText('3 de 3 lugares')).toBeVisible();
    await logout(page);
    const publicStart = Date.now();
    await page.goto('/');
    await page.getByRole('link', { name: 'Ver clases', exact: true }).click();
    await expect(page.getByText('3 de 3 lugares')).toBeVisible();
    expect(Date.now() - publicStart).toBeLessThan(10000);
    await page.goto('/registro');
    await datosUsuario(page, { nombre: 'Socio', email: 'socio@example.test', dni: '90003002' });
    await page.getByLabel('Plan que querés contratar', { exact: true }).selectOption('mensual');
    await page.getByLabel('Cómo vas a pagar', { exact: true }).selectOption('Efectivo');
    await page.getByRole('button', { name: 'Crear cuenta y solicitar membresía' }).click();
    await expect(page).toHaveURL('/mi-espacio');
    await expect(page.getByRole('heading', { name: 'Tu cuenta está creada' })).toBeVisible();
    await verificarIdentidad(page, ['/mi-espacio', '/mi-cuenta', '/mi-membresia', '/mis-inscripciones', '/mi-historial', '/clases'], testInfo, 'socio');
    await logout(page);
    await login(page, 'admin@example.test');
    await page.getByRole('link', { name: 'Socios', exact: true }).click();
    await page.locator('li').filter({ hasText: 'socio@example.test' }).getByRole('link', { name: 'Ver y editar socio' }).click();
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue('socio@example.test');
    await page.getByRole('link', { name: 'Registrar pago de este socio' }).click();
    await page.getByLabel('Plan', { exact: true }).selectOption('mensual');
    await page.getByRole('checkbox', { name: /Confirmo que recibí/ }).check();
    let pagosEnviados = 0;
    page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/pagos') pagosEnviados++; });
    await page.getByRole('button', { name: 'Registrar pago', exact: true }).dblclick();
    await expect(page.getByText(/Listo: Pago .* registrado/)).toBeVisible();
    expect(pagosEnviados).toBe(1);
    await expect(page.getByLabel('Plan', { exact: true })).toHaveValue('');
    await logout(page);
    await login(page, 'socio@example.test');
    await page.goto('/clases');
    const availabilityStart = Date.now();
    await page.getByLabel('Semana de referencia').fill('2030-01-02');
    await expect(page.getByText('3 de 3 lugares')).toBeVisible();
    expect(Date.now() - availabilityStart).toBeLessThan(10000);
    await page.goto('/mi-cuenta');
    await page.getByLabel('Teléfono').fill('1199999999');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByText('Listo: Tu perfil se actualizó.')).toBeVisible();
    await page.goto('/gestion/socios');
    await expect(page.getByRole('heading', { name: 'Acceso no permitido' })).toBeVisible();
    const reservationStart = Date.now();
    await page.goto('/clases');
    await page.getByLabel('Semana de referencia').fill('2030-01-02');
    let writes = 0;
    page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/inscripciones') writes++; });
    await page.getByRole('button', { name: 'Reservar lugar' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByRole('button', { name: 'Volver' })).toBeFocused();
    await dialog.getByRole('button', { name: 'Volver' }).click();
    expect(writes).toBe(0);
    await expect(page.getByRole('button', { name: 'Reservar lugar' })).toBeFocused();
    await page.getByRole('button', { name: 'Reservar lugar' }).click();
    await dialog.getByRole('button', { name: 'Confirmar inscripción' }).click();
    await expect(page.getByText('2 de 3 lugares')).toBeVisible();
    expect(writes).toBe(1);
    expect(Date.now() - reservationStart).toBeLessThan(60000);
    await page.getByRole('link', { name: 'Mis inscripciones', exact: true }).click();
    await page.getByRole('button', { name: 'Cancelar inscripción' }).click();
    await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByText('Listo: Inscripción cancelada. Tu lugar quedó disponible.')).toBeVisible();
    await page.goto('/clases');
    await page.getByLabel('Semana de referencia').fill('2030-01-02');
    await page.getByRole('button', { name: 'Reservar lugar' }).click();
    await dialog.getByRole('button', { name: 'Confirmar inscripción' }).click();
    await expect(page.getByText('2 de 3 lugares')).toBeVisible();
    await logout(page);
    await request.post('http://127.0.0.1:3011/__test__/clock', { data: { fecha: '2030-01-02T18:01:00-03:00' } });
    await page.clock.setFixedTime(new Date('2030-01-02T18:01:00-03:00'));
    await login(page, 'instructor@example.test');
    await verificarIdentidad(page, ['/mi-cuenta', '/instructor/clases'], testInfo, 'instructor');
    await page.getByRole('link', { name: 'Ver participantes y asistencia' }).click();
    await page.locator('li').filter({ has: page.getByText('En curso', { exact: true }) }).getByRole('button', { name: 'Marcar presente' }).click();
    await expect(page.getByText('Presente', { exact: true })).toBeVisible();
    await logout(page);
    await request.post('http://127.0.0.1:3011/__test__/clock', { data: { fecha: '2030-01-02T19:01:00-03:00' } });
    await page.clock.setFixedTime(new Date('2030-01-02T19:01:00-03:00'));
    await login(page, 'socio@example.test');
    await page.getByRole('link', { name: 'Mi asistencia', exact: true }).click();
    await expect(page.getByText('Asistencia confirmada', { exact: true })).toBeVisible();
    await logout(page);
    await login(page, 'admin@example.test');
    await page.getByRole('link', { name: 'Reportes', exact: true }).click();
    await expect(page.locator('.report-values dd').last()).toHaveText('1');
    await page.goto('/gestion/clases');
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await dialog.getByRole('button', { name: 'Volver' }).click();
    await expect(page.getByRole('heading', { name: 'Funcional de prueba' })).toBeVisible();
    await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
    await dialog.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByText('Listo: Clase eliminada. El historial se conserva.')).toBeVisible();
    await page.goto('/gestion/clases/999999/editar');
    await expect(page.getByText('La clase no existe.').first()).toBeVisible();
    expect(failures).toEqual([]);
});
test('interfaz publica: responsive, teclado, errores y accesibilidad', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Qué bueno que viniste.');
    await expect(page.locator('.hero-photo img')).toHaveAttribute('src', '/marca/gimnasio-referencia.webp');
    await expect(page.getByText(/No corresponde a Target GYM/)).toHaveCount(0);
    await expect(page.getByRole('article', { name: 'Plan mensual' })).toBeVisible();
    const planes = await page.request.get('/api/planes').then(response => response.json());
    for (const plan of planes.data) {
        const card = page.getByRole('article', { name: plan.nombre, exact: true });
        if (plan.precioCentavos === null) await expect(card.locator('.plan-price')).toHaveText('Consultá el precio');
        else {
            const base = plan.condicionesDescuento || plan.metodoDescuento ? plan.precioCentavos
                : plan.precioDescuentoCentavos ?? Math.round(plan.precioCentavos * (100 - plan.descuentoPorcentaje) / 100);
            const total = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(base / 100);
            await expect(card.locator('.plan-price').last()).toHaveText(total);
        }
        await expect(card.locator('.plan-period')).toHaveText(plan.dias === null
            ? `Por ${plan.meses} ${plan.meses === 1 ? 'mes' : 'meses'} calendario`
            : `Por ${plan.dias} ${plan.dias === 1 ? 'día corrido' : 'días corridos'}`);
    }
    for (const width of [320, 360, 390, 768, 1024, 1440, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await page.evaluate(() => document.fonts.ready);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        expect(results.violations).toEqual([]);
        if ([360, 768, 1440].includes(width)) await page.screenshot({ path: testInfo.outputPath(`inicio-${width}.png`), fullPage: true });
    }
    for (const activity of await page.locator('.activity').all()) {
        await activity.locator('summary').focus();
        if (await activity.evaluate(element => element.open)) await page.keyboard.press('Enter');
        await page.keyboard.press('Enter');
        expect(await activity.evaluate(element => element.open)).toBe(true);
    }
    await page.setViewportSize({ width: 360, height: 900 });
    const nav = page.getByRole('navigation', { name: 'Navegación principal' });
    await expect(nav).not.toBeVisible();
    await page.getByRole('button', { name: 'Menú', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Menú', exact: true })).toHaveAttribute('aria-expanded', 'true');
    await expect(nav.getByRole('link', { name: 'Inicio', exact: true })).toBeVisible();
    expect(await nav.evaluate(element => getComputedStyle(element).animationName)).toBe('menu-enter');
    expect(await nav.evaluate(element => getComputedStyle(element).animationDuration)).toBe('0.22s');
    await expect(nav.getByRole('link', { name: 'Actividades', exact: true })).toHaveCount(0);
    await nav.getByRole('link', { name: 'Inicio', exact: true }).focus();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menú', exact: true })).toBeFocused();
    await expect(nav).not.toBeVisible();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Menú', exact: true }).click();
    expect(await nav.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    await nav.getByRole('link', { name: 'Planes', exact: true }).click();
    await expect(nav).not.toBeVisible();
    await expect(page).toHaveURL('/#planes');
    await expect(page.getByRole('heading', { name: 'Un plan para tu rutina.' })).toBeInViewport();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 720, height: 450 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.route('**/api/clases', route => route.fulfill({ json: { success: true, data: [{}] } }));
    await page.clock.install();
    await page.goto('/clases');
    await expect(page.getByRole('heading', { name: 'No pudimos cargar la información' })).toBeVisible();
    await expect(page.getByText(/datos invalidos/).first()).toBeVisible();
    await expect(page.getByRole('alert')).toBeVisible();
    expect(await page.getByRole('complementary', { name: 'Notificaciones' }).evaluate(element => getComputedStyle(element).position)).toBe('fixed');
    await page.mouse.move(0, 0);
    await page.clock.runFor(10000);
    await expect(page.getByRole('alert')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'No pudimos cargar la información' })).toBeVisible();
    await page.unroute('**/api/clases');
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText(/No hay clases para estos filtros/)).toBeVisible();
});
test('catálogo: crear, promoción presencial, deshabilitar, renovar, cambiar y eliminar conservando historial', async ({ page }, testInfo) => {
    test.setTimeout(120000);
    await login(page, 'admin@example.test');
    await page.goto('/gestion/planes');
    async function crear(nombre, meses, precio, promocion = false) {
        await page.getByRole('button', { name: 'Nuevo plan', exact: true }).click();
        await page.getByLabel('Nombre del plan', { exact: true }).fill(nombre);
        await page.getByLabel('Duración (meses calendario)').fill(meses);
        await page.getByLabel('Precio base (ARS)').fill(precio);
        if (promocion) {
            await page.getByLabel('Descuento (%)').fill('15');
            await page.getByLabel('Método para el descuento').selectOption('Efectivo');
            await page.getByLabel('Condiciones del descuento (opcional)').fill('Pago en mostrador.');
        }
        for (const width of [360, 1440]) {
            await page.setViewportSize({ width, height: 900 });
            expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
        }
        await page.getByRole('button', { name: 'Crear plan', exact: true }).click();
        await expect(page.getByRole('article', { name: nombre, exact: true })).toBeVisible();
        const catalogo = await page.request.get('/api/gestion/planes').then(response => response.json());
        return catalogo.data.find(plan => plan.nombre === nombre);
    }
    const plan = await crear('Plan flexible E2E', '2', '20000', true);
    const alternativo = await crear('Plan alternativo E2E', '3', '30000');
    await page.screenshot({ path: testInfo.outputPath('catalogo-planes.png'), fullPage: true });
    await logout(page);
    await page.goto('/');
    const publicCard = page.getByRole('article', { name: plan.nombre, exact: true });
    await expect(publicCard.locator('.plan-price')).toHaveText('$ 20.000');
    await expect(publicCard.getByText('Con descuento: $ 17.000,00')).toBeVisible();
    await expect(publicCard.getByText(/Pago en mostrador/)).toBeVisible();
    await page.goto('/registro');
    await datosUsuario(page, { nombre: 'Planes', email: 'planes@example.test', dni: '90003050' });
    await page.getByLabel('Plan que querés contratar', { exact: true }).selectOption(plan.tipo);
    await page.getByLabel('Cómo vas a pagar', { exact: true }).selectOption('Efectivo');
    await page.getByRole('button', { name: 'Crear cuenta y solicitar membresía', exact: true }).click();
    await expect(page).toHaveURL('/mi-espacio');
    await logout(page);
    await login(page, 'admin@example.test');
    const socios = await page.request.get('/api/socios').then(response => response.json());
    const socio = socios.data.find(user => user.email === 'planes@example.test');
    await page.goto(`/gestion/pagos?socio=${socio.id}`);
    await page.getByLabel('Plan', { exact: true }).selectOption(plan.tipo);
    await expect(page.locator('.payment-total')).toHaveText('Importe: $ 20.000,00');
    await page.getByRole('checkbox', { name: /Confirmo que se cumplen/ }).check();
    await expect(page.locator('.payment-total')).toHaveText('Importe: $ 17.000,00');
    await page.getByRole('checkbox', { name: /Confirmo que recibí/ }).check();
    await page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
    await expect(page.getByText(/Listo: Pago/)).toBeVisible();
    const antes = await page.request.get(`/api/socios/${socio.id}`).then(response => response.json());
    await page.goto('/gestion/planes');
    await page.getByRole('article', { name: plan.nombre, exact: true }).getByRole('button', { name: 'Deshabilitar', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByRole('article', { name: plan.nombre, exact: true }).getByText('Solo renovaciones', { exact: true })).toBeVisible();
    await logout(page);
    await expect(page.getByRole('article', { name: plan.nombre, exact: true })).toHaveCount(0);
    await page.goto('/registro');
    await expect(page.getByLabel('Plan que querés contratar', { exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: plan.nombre, exact: true })).toHaveCount(0);
    await login(page, 'planes@example.test');
    await page.goto('/mi-membresia');
    await page.getByLabel('Elegí tu plan').selectOption(plan.tipo);
    await expect(page.getByText(/Podés renovarlo porque ya lo tuviste/)).toBeVisible();
    await page.getByLabel('Cómo vas a pagar', { exact: true }).selectOption('Efectivo');
    await page.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(page.getByText(/Listo: Solicitud enviada/)).toBeVisible();
    await logout(page);
    await login(page, 'admin@example.test');
    await page.goto(`/gestion/socios/${socio.id}`);
    await page.getByLabel('Nuevo plan del socio').selectOption(alternativo.tipo);
    await page.getByRole('button', { name: 'Cambiar plan', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page.getByText(/Listo: Plan cambiado/)).toBeVisible();
    const despues = await page.request.get(`/api/socios/${socio.id}`).then(response => response.json());
    expect(despues.data.membresias[0].fechaVencimiento).toBe(antes.data.membresias[0].fechaVencimiento);
    expect(despues.data.membresias[0].tipoPlan).toBe(alternativo.tipo);
    expect(despues.data.pagos).toHaveLength(1);
    expect(despues.data.pagos[0].montoCentavos).toBe(1700000);
    await page.goto('/gestion/planes');
    for (const item of [plan, alternativo]) {
        await page.getByRole('article', { name: item.nombre, exact: true }).getByRole('button', { name: 'Eliminar', exact: true }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Confirmar', exact: true }).click();
        await expect(page.getByRole('article', { name: item.nombre, exact: true })).toHaveCount(0);
    }
    await logout(page);
    await login(page, 'planes@example.test');
    await page.goto('/mi-membresia');
    await expect(page.getByRole('heading', { name: alternativo.nombre, exact: true })).toBeVisible();
    await expect(page.getByRole('option', { name: /Plan flexible E2E/ })).toHaveCount(0);
    await expect(page.getByText(/15% de descuento aplicado/)).toBeVisible();
});
test('zoom nativo de Chromium al 200% mantiene navegacion y formularios', async ({}, testInfo) => {
    const baseURL = testInfo.project.use.baseURL;
    const extension = testInfo.outputPath('extension-zoom');
    await mkdir(extension, { recursive: true });
    await writeFile(join(extension, 'manifest.json'), JSON.stringify({ manifest_version: 3, name: 'Prueba local de zoom', version: '1.0', permissions: ['tabs'], background: { service_worker: 'zoom.js' } }));
    await writeFile(join(extension, 'zoom.js'), `chrome.tabs.onUpdated.addListener((id, change, tab) => { if (change.status === 'complete' && tab.url?.startsWith(${JSON.stringify(`${baseURL}/`)})) chrome.tabs.setZoom(id, 2); });`);
    const context = await chromium.launchPersistentContext(testInfo.outputPath('perfil-zoom'), {
        channel: 'chromium', headless: true, viewport: { width: 1440, height: 900 }, baseURL,
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
        args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`],
    });
    try {
        const worker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
        const page = await context.newPage();
        await page.goto('/registro');
        await expect.poll(() => worker.evaluate(async url => {
            const tabs = await chrome.tabs.query({ url: `${url}/*` });
            return tabs.length ? chrome.tabs.getZoom(tabs[0].id) : 0;
        }, baseURL)).toBe(2);
        await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.getByRole('button', { name: 'Menú', exact: true }).click();
        await expect(page.getByRole('navigation', { name: 'Navegación principal' }).getByRole('link', { name: 'Ya soy socio', exact: true })).toBeVisible();
        const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        expect(results.violations).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath('registro-zoom-200.png'), fullPage: true });
    } finally { await context.close(); }
});

test('asociación por transferencia, portal del equipo y activación solo por pago confirmado', async ({ page, request }, testInfo) => {
    test.setTimeout(120000);
    const cambioReloj = await request.post('http://127.0.0.1:3011/__test__/clock', { data: { fecha: '2030-03-01T12:00:00-03:00' } });
    expect(cambioReloj.status()).toBe(200);
    expect(await cambioReloj.json()).toEqual({ fecha: '2030-03-01T15:00:00.000Z' });
    await page.clock.setFixedTime(new Date('2030-03-01T12:00:00-03:00'));
    await login(page, 'admin@example.test');
    const sesion = await page.request.get('/api/auth/sesion').then(response => response.json());
    const headers = { 'X-CSRF-Token': sesion.data.csrfToken };
    expect((await page.request.put('/api/planes/mensual', { headers, data: { precioCentavos: 1500000 } })).status()).toBe(200);
    const instructor = await page.request.post('/api/instructores', { headers, data: { nombre: 'Equipo', apellido: 'Accesos', email: 'equipo-accesos@example.test', dni: '90006110', telefono: '1100000000', fechaNacimiento: '2000-01-01', password, especialidad: 'Funcional' } });
    expect(instructor.status()).toBe(201);
    const instructorId = (await instructor.json()).data.id;
    const claseResponse = await page.request.post('/api/clases', { headers, data: { nombre: 'Clase de accesos', tipo: 'Funcional', fecha: '2030-03-02', horaInicio: '18:00', duracionMinutos: 60, cupoMaximo: 2, instructorId } });
    expect(claseResponse.status()).toBe(201);
    const claseId = (await claseResponse.json()).data.id;
    await logout(page);
    await page.getByRole('link', { name: 'Elegir Plan mensual' }).click();
    await expect(page).toHaveURL('/asociate?plan=mensual');
    await expect(page.getByLabel('Plan que querés contratar')).toHaveValue('mensual');
    await verificarIdentidad(page, ['/asociate?plan=mensual'], testInfo, 'asociacion');
    await datosUsuario(page, { nombre: 'Transferencia', email: 'transferencia-accesos@example.test', dni: '90006111' });
    await page.getByRole('button', { name: 'Crear cuenta y solicitar membresía' }).click();
    await expect(page.getByText('Elegí cómo vas a pagar.')).toBeVisible();
    await page.getByLabel('Cómo vas a pagar', { exact: true }).selectOption('Transferencia');
    await page.getByRole('button', { name: 'Crear cuenta y solicitar membresía' }).click();
    await expect(page).toHaveURL('/mi-espacio');
    await expect(page.getByRole('heading', { name: 'Tu cuenta está creada' })).toBeVisible();
    const socioSesion = await page.request.get('/api/auth/sesion').then(response => response.json());
    const socioId = socioSesion.data.usuario.id;
    const reservaPendiente = await page.request.post('/api/inscripciones', { headers: { 'X-CSRF-Token': socioSesion.data.csrfToken }, data: { claseId } });
    expect(reservaPendiente.status()).toBe(409);
    await page.getByRole('button', { name: 'Ya realicé la transferencia' }).click();
    await expect(page.getByRole('heading', { name: 'Estamos revisando tu transferencia' })).toBeVisible();
    expect((await page.request.get('/api/mi-membresia').then(response => response.json())).data).toBeNull();
    await cerrarAvisos(page);
    await page.screenshot({ path: testInfo.outputPath('socio-transferencia-pendiente.png'), fullPage: true });
    await logout(page);
    await page.getByRole('link', { name: 'Acceso del equipo' }).click();
    await expect(page).toHaveURL('/equipo');
    await expect(page.getByRole('link', { name: 'Asociate', exact: true })).toHaveCount(0);
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page).toHaveURL('/gestion');
    await expect(page.getByText('Transferencia a revisar')).toBeVisible();
    await expect(page.locator('.site-footer')).toHaveCount(0);
    await cerrarAvisos(page);
    for (const width of [360, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
        if (width === 360) {
            await page.getByRole('button', { name: 'Menú', exact: true }).click();
            const nav = page.getByRole('navigation', { name: 'Gestión del gimnasio' });
            await expect(nav).toBeVisible();
            expect(await page.locator('.equipo-sidebar').evaluate(element => getComputedStyle(element).animationName)).toBe('menu-enter');
            await nav.getByRole('link', { name: 'Resumen' }).focus();
            await page.keyboard.press('Escape');
            await expect(page.getByRole('button', { name: 'Menú', exact: true })).toBeFocused();
            await expect(nav).not.toBeVisible();
        }
        await page.screenshot({ path: testInfo.outputPath(`equipo-resumen-${width}.png`), fullPage: true });
    }
    await page.goto(`/gestion/pagos?socio=${socioId}`);
    await expect(page.getByLabel('Método de pago')).toHaveValue('Transferencia');
    await page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
    await expect(page.getByText(/Confirmá que recibiste el dinero/)).toBeVisible();
    await page.getByRole('checkbox', { name: /Confirmo que recibí/ }).check();
    await page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
    await expect(page.getByText(/Listo: Pago/)).toBeVisible();
    await logout(page);
    await login(page, 'transferencia-accesos@example.test');
    await expect(page.getByText('Membresía activa', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Ya realicé la transferencia' })).toHaveCount(0);
    await page.goto('/clases');
    await page.getByLabel('Semana de referencia').fill('2030-03-02');
    await page.getByRole('button', { name: 'Reservar lugar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Confirmar inscripción', exact: true }).click();
    await expect(page.getByText('Listo: Tu lugar en Clase de accesos está confirmado.')).toBeVisible();
    await page.goto('/gestion');
    await expect(page.getByRole('heading', { name: 'Acceso no permitido' })).toBeVisible();
});

test('recepción da alta sin contraseña y el socio activa su acceso mediante invitación', async ({ page, browser }, testInfo) => {
    test.setTimeout(60000);
    await login(page, 'admin@example.test');
    await page.goto('/gestion/socios/nuevo');
    for (const [label, value] of [['Nombre','Invitado'],['Apellido','Sintetico'],['Email','invitado-accesos@example.test'],['DNI','90006112'],['Teléfono','1100000000'],['Fecha de nacimiento','2000-01-01']]) await page.getByLabel(label, { exact: true }).fill(value);
    await expect(page.getByLabel('Contraseña', { exact: true })).toHaveCount(0);
    await page.getByLabel('Plan que querés contratar').selectOption('mensual');
    await page.getByRole('button', { name: 'Guardar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Primer acceso del socio' })).toBeVisible();
    await page.getByRole('button', { name: 'Generar enlace de acceso' }).click();
    const enlace = await page.getByLabel('Enlace personal de primer acceso').inputValue();
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    try {
        const socio = await context.newPage();
        await socio.goto(enlace);
        await expect(socio).toHaveURL(new URL('/activar-acceso', enlace).href);
        await socio.getByLabel('Tu contraseña', { exact: true }).fill(password);
        await socio.getByLabel('Repetí tu contraseña', { exact: true }).fill(password);
        expect((await new AxeBuilder({ page: socio }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
        await socio.getByRole('button', { name: 'Activar mi acceso' }).click();
        await expect(socio.getByRole('heading', { name: 'Hola, Invitado' })).toBeVisible();
        expect((await socio.request.get('/api/mi-membresia').then(response => response.json())).data).toBeNull();
        await cerrarAvisos(socio);
        await socio.screenshot({ path: testInfo.outputPath('invitado-primer-acceso-390.png'), fullPage: true });
        const sesion = await socio.request.get('/api/auth/sesion').then(response => response.json());
        const reuso = await socio.request.post('/api/auth/activar-acceso', { headers: { 'X-CSRF-Token': sesion.data.csrfToken }, data: { token: new URLSearchParams(new URL(enlace).hash.slice(1)).get('token'), password } });
        expect(reuso.status()).toBe(409);
    } finally { await context.close(); }
});
