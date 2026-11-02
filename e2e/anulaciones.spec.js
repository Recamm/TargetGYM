import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('el administrador elimina un duplicado, corrige vigencia y conserva auditoría visible para el socio', async ({ page, browser }, testInfo) => {
    await page.goto('/equipo');
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('PruebaSegura123!');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page).toHaveURL('/gestion');
    const sesion = await page.request.get('/api/auth/sesion').then(r => r.json());
    const headers = { 'X-CSRF-Token': sesion.data.csrfToken };
    const crearPlan = await page.request.post('/api/planes', { headers, data: { nombre: 'Plan anulación', meses: 1, precioCentavos: 1500000 } });
    expect(crearPlan.status()).toBe(201);
    const plan = (await crearPlan.json()).data;
    const crearSocio = await page.request.post('/api/socios', { headers, data: {
        nombre: 'Anulación', apellido: 'Prueba', email: 'anulacion-e2e@example.test', password: 'PruebaSegura123!',
        dni: '90007100', telefono: '1100000000', fechaNacimiento: '2000-01-01',
    } });
    expect(crearSocio.status()).toBe(201);
    const socio = (await crearSocio.json()).data;
    const pagos = async () => (await page.request.get('/api/pagos').then(r => r.json())).data.filter(p => p.socioId === socio.id);
    const detalle = async () => (await page.request.get(`/api/socios/${socio.id}`).then(r => r.json())).data;
    await page.goto(`/gestion/pagos?socio=${socio.id}`);
    const cobrar = async () => {
        await page.getByLabel('Plan', { exact: true }).selectOption(plan.tipo);
        await page.getByRole('checkbox', { name: /Confirmo que recibí/ }).check();
        await page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
    };
    await cobrar();
    await expect.poll(async () => (await pagos()).length).toBe(1);
    const vigenciaOriginal = (await detalle()).membresias[0].fechaVencimiento;
    await cobrar();
    await expect.poll(async () => (await pagos()).length).toBe(2);
    const [duplicado, valido] = await pagos();
    const vigenciaDuplicada = (await detalle()).membresias[0].fechaVencimiento;
    expect(Date.parse(vigenciaDuplicada)).toBeGreaterThan(Date.parse(vigenciaOriginal));
    const registro = page.locator('li').filter({ has: page.getByText(`Pago #${duplicado.id}`, { exact: true }) });
    await registro.getByRole('button', { name: 'Eliminar pago', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('se recalculará la membresía');
    expect((await pagos()).filter(p => !p.anuladoEn)).toHaveLength(2);
    for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    }
    await page.getByRole('dialog').getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(registro.getByRole('button', { name: 'Eliminar pago', exact: true })).toBeFocused();
    await registro.getByRole('button', { name: 'Eliminar pago', exact: true }).click();
    await page.getByLabel('Motivo (opcional)').fill('Pago cargado dos veces por error');
    await page.getByRole('dialog').getByRole('button', { name: 'Eliminar pago', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(`Pago #${duplicado.id}`, { exact: true })).toHaveCount(0);
    await expect(page.getByText(`Pago #${valido.id}`, { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Pagos registrados' })).toBeFocused();
    const actualizado = await detalle();
    expect(actualizado.membresias.find(m => !m.anulada).fechaVencimiento).toBe(vigenciaOriginal);
    expect(actualizado.membresias.find(m => m.anulada).fechaVencimientoOriginal).toBe(vigenciaDuplicada);
    await page.getByLabel('Mostrar pagos anulados').check();
    await expect(registro.getByText('Anulado', { exact: true })).toBeVisible();
    await expect(registro.getByText(/Pago cargado dos veces por error/)).toBeVisible();
    await expect(registro.getByRole('button', { name: 'Eliminar pago', exact: true })).toHaveCount(0);
    for (const width of [390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    }
    await page.screenshot({ path: testInfo.outputPath('pago-anulado.png'), fullPage: true });
    await page.goto(`/gestion/socios/${socio.id}`);
    await expect(page.getByRole('heading', { name: 'Cambiar plan vigente' })).toBeVisible();
    await expect(page.getByText('Anulado', { exact: true })).toBeVisible();
    await expect(page.getByText(/Pago cargado dos veces por error/)).toBeVisible();
    const contextoSocio = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const paginaSocio = await contextoSocio.newPage();
        await paginaSocio.goto('/login');
        await paginaSocio.getByLabel('Email', { exact: true }).fill(socio.email);
        await paginaSocio.getByLabel('Contraseña', { exact: true }).fill('PruebaSegura123!');
        await paginaSocio.getByRole('button', { name: 'Ingresar', exact: true }).click();
        await expect(paginaSocio).toHaveURL('/mi-espacio');
        await paginaSocio.goto('/mi-membresia');
        await expect(paginaSocio.getByText('Anulado', { exact: true })).toBeVisible();
        const membresia = await paginaSocio.request.get('/api/mi-membresia').then(r => r.json());
        expect(membresia.data.fechaVencimiento).toBe(vigenciaOriginal);
        expect((await paginaSocio.request.delete(`/api/pagos/${valido.id}`, { headers: {
            'X-CSRF-Token': (await paginaSocio.request.get('/api/auth/sesion').then(r => r.json())).data.csrfToken,
        }, data: {} })).status()).toBe(403);
    } finally { await contextoSocio.close(); }
});
