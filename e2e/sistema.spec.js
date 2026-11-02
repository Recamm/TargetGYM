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
async function datosUsuario(page, { nombre, email, dni }) {
    for (const [label, value] of [['Nombre',nombre],['Apellido','Sintetico'],['Email',email],['DNI',dni],['Teléfono','1100000000'],['Fecha de nacimiento','2000-01-01'],['Contraseña',password]]) await page.getByLabel(label, { exact: true }).fill(value);
}
async function verificarIdentidad(page, rutas, testInfo, rol) {
    for (const ruta of rutas) {
        await page.goto(ruta);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        await expect(page.getByText('Cargando información…')).toHaveCount(0);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.locator('.brand-link img')).toHaveCount(2);
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
    await verificarIdentidad(page, ['/gestion/clases', '/gestion/socios', '/gestion/pagos', '/gestion/planes', '/gestion/instructores', '/gestion/reportes', '/mi-cuenta'], testInfo, 'administrador');
    await page.goto('/gestion/clases');
    await page.getByRole('link', { name: 'Planes', exact: true }).click();
    const mensual = page.locator('form').filter({ has: page.getByRole('heading', { name: 'Plan mensual', exact: true }) });
    await mensual.getByLabel('Precio base (ARS)').fill('15000');
    await mensual.getByRole('button', { name: 'Guardar precio' }).click();
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
    await page.getByRole('button', { name: 'Crear cuenta' }).click();
    await expect(page).toHaveURL('/mi-membresia');
    await expect(page.getByText(/Todavía no tenés una membresía activa/)).toBeVisible();
    await verificarIdentidad(page, ['/mi-cuenta', '/mi-membresia', '/mis-inscripciones', '/mi-historial', '/clases'], testInfo, 'socio');
    await logout(page);
    await login(page, 'admin@example.test');
    await page.getByRole('link', { name: 'Socios', exact: true }).click();
    await page.getByRole('link', { name: 'Ver y editar socio' }).click();
    await expect(page.getByLabel('Email', { exact: true })).toHaveValue('socio@example.test');
    await page.getByRole('link', { name: 'Registrar pago de este socio' }).click();
    await page.getByLabel('Plan', { exact: true }).selectOption('mensual');
    let pagosEnviados = 0;
    page.on('request', req => { if (req.method() === 'POST' && new URL(req.url()).pathname === '/api/pagos') pagosEnviados++; });
    await page.getByRole('button', { name: 'Registrar pago', exact: true }).dblclick();
    await expect(page.getByText(/Listo: Pago .* registrado/)).toBeVisible();
    expect(pagosEnviados).toBe(1);
    await expect(page.getByLabel('Plan', { exact: true })).toHaveValue('');
    await logout(page);
    await login(page, 'socio@example.test');
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
    await expect(page.getByText(/No corresponde a Target GYM/)).toBeVisible();
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
    await page.getByRole('button', { name: 'Menú', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Nosotros', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Nosotros', exact: true }).focus();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Menú', exact: true })).toBeFocused();
    await page.setViewportSize({ width: 720, height: 450 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.route('**/api/clases', route => route.fulfill({ json: { success: true, data: [{}] } }));
    await page.goto('/clases');
    await expect(page.getByRole('heading', { name: 'No pudimos cargar la información' })).toBeVisible();
    await expect(page.getByText(/datos invalidos/).first()).toBeVisible();
    await page.unroute('**/api/clases');
    await page.getByRole('button', { name: 'Reintentar' }).click();
    await expect(page.getByText(/No hay clases para estos filtros/)).toBeVisible();
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
        await expect(page.getByRole('link', { name: 'Ingresar', exact: true })).toBeVisible();
        const results = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        expect(results.violations).toEqual([]);
        await page.screenshot({ path: testInfo.outputPath('registro-zoom-200.png'), fullPage: true });
    } finally { await context.close(); }
});
