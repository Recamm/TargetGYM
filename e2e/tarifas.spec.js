import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('tarifas confirmadas: portada, pase diario, jubilados verificados y tarjeta presencial', async ({ page, browser }, testInfo) => {
    test.setTimeout(90000);
    expect((await page.request.post('http://127.0.0.1:3011/__test__/clock', { data: { fecha: '2030-01-01T15:00:00Z' } })).ok()).toBe(true);
    await page.goto('/equipo');
    await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
    await page.getByLabel('Contraseña', { exact: true }).fill('PruebaSegura123!');
    await page.getByRole('button', { name: 'Ingresar', exact: true }).click();
    await expect(page).toHaveURL('/gestion');
    const headers = { 'X-CSRF-Token': (await page.request.get('/api/auth/sesion').then(r => r.json())).data.csrfToken };
    expect((await page.request.put('/api/planes/mensual', { headers, data: { nombre: 'Plan Mensual Libre',
        precioCentavos: 8800000, precioDescuentoCentavos: 7800000, metodoDescuento: 'Efectivo', descuentoPorcentaje: 0, condicionesDescuento: '' } })).status()).toBe(200);
    const canonicos = new Set(['mensual','pase-dia','pase-semanal','pase-quincena','jubilados','full-target']);
    for (const plan of (await page.request.get('/api/gestion/planes').then(r => r.json())).data) {
        expect((await page.request.put(`/api/planes/${plan.tipo}`, { headers, data: { habilitado: canonicos.has(plan.tipo) } })).status()).toBe(200);
    }
    for (const codigo of ['Efectivo','Transferencia','Tarjeta']) expect((await page.request.put(`/api/metodos-pago/${codigo}`, { headers, data: { habilitado: true } })).status()).toBe(200);
    const contexto = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    const tarjeta = await browser.newContext({ baseURL: testInfo.project.use.baseURL });
    try {
        const socioPage = await contexto.newPage();
        await socioPage.goto('/#planes');
        await expect(socioPage.locator('.plan-card')).toHaveCount(6);
        await socioPage.locator('.plan-fold').filter({ has: socioPage.getByRole('heading', { name: 'Plan Mensual Libre', exact: true }) }).locator('summary').click();
        const mensual = socioPage.getByRole('article', { name: 'Plan Mensual Libre', exact: true });
        await expect(mensual.locator('.plan-tariff').filter({ hasText: 'Transferencia o tarjeta' })).toContainText('88.000');
        await expect(mensual.locator('.plan-tariff').filter({ hasText: 'Efectivo' })).toContainText('78.000');
        await expect(socioPage.getByText('Sin matrícula ni inscripción.', { exact: true })).toBeVisible();
        await expect(socioPage.getByText('10 a 18 h', { exact: true })).toBeAttached();
        await expect(socioPage.getByText(/Duchas, vestidores y lockers/)).toContainText('Traé tu candado');
        for (const width of [390, 1440]) {
            await socioPage.setViewportSize({ width, height: 900 });
            expect(await socioPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
            expect((await new AxeBuilder({ page: socioPage }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
        }
        await socioPage.locator('.plan-fold').filter({ has: socioPage.getByRole('heading', { name: 'Pase por un día', exact: true }) }).locator('summary').click();
        await socioPage.getByRole('link', { name: 'Elegir Pase por un día', exact: true }).click();
        await expect(socioPage.getByLabel('Plan que querés contratar')).toHaveValue('pase-dia');
        await expect(socioPage.getByText('Por 1 día corrido', { exact: true })).toBeVisible();
        await expect(socioPage.getByLabel('Cómo vas a pagar').getByRole('option', { name: 'Tarjeta', exact: true })).toHaveCount(0);
        await socioPage.getByLabel('Cómo vas a pagar', { exact: true }).selectOption('Efectivo');
        await expect(socioPage.getByRole('status')).toContainText('25.000,00');
        const datos = async (target, email, dni) => {
            for (const [label, value] of [['Nombre','Prueba'],['Apellido','Tarifas'],['Email',email],['DNI',dni],
                ['Teléfono','1100000000'],['Fecha de nacimiento','1960-01-01'],['Contraseña','PruebaSegura123!']]) {
                await target.getByLabel(label, { exact: true }).fill(value);
            }
        };
        await datos(socioPage, 'tarifas-socio@example.test', '90008200');
        await socioPage.getByRole('button', { name: 'Crear cuenta y solicitar membresía' }).click();
        await expect(socioPage).toHaveURL('/mi-espacio');
        const socio = (await socioPage.request.get('/api/auth/sesion').then(r => r.json())).data.usuario;
        const pagosSocio = async () => (await page.request.get('/api/pagos').then(r => r.json())).data.filter(p => p.socioId === socio.id);
        await page.goto(`/gestion/pagos?socio=${socio.id}`);
        await expect(page.getByLabel('Plan', { exact: true })).toHaveValue('pase-dia');
        await expect(page.getByText('Importe: $ 25.000,00', { exact: true })).toBeVisible();
        await page.getByRole('checkbox', { name: /Confirmo que recibí/ }).check();
        await page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
        await expect.poll(async () => (await pagosSocio()).length).toBe(1);
        await expect(page.getByText(`Pago #${(await pagosSocio())[0].id}`, { exact: true })).toBeVisible();
        const vigente = (await socioPage.request.get('/api/mi-membresia').then(r => r.json())).data;
        expect(vigente.fechaVencimiento).toBe('2030-01-02T15:00:00.000Z');
        await socioPage.goto('/mi-membresia');
        await socioPage.getByLabel('Elegí tu plan', { exact: true }).selectOption('jubilados');
        await expect(socioPage.getByLabel('Cómo vas a pagar').getByRole('option', { name: 'Transferencia', exact: true })).toHaveCount(0);
        await socioPage.getByLabel('Cómo vas a pagar', { exact: true }).selectOption('Efectivo');
        await socioPage.getByRole('button', { name: 'Enviar solicitud' }).click();
        await expect(socioPage.getByText('Plan solicitado: Promo jubilados.', { exact: false })).toBeVisible();
        await page.goto(`/gestion/pagos?socio=${socio.id}`);
        await expect(page.getByLabel('Plan', { exact: true })).toHaveValue('jubilados');
        await page.getByRole('checkbox', { name: /Confirmo que recibí/ }).check();
        await page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
        await expect(page.getByText('Verificá los requisitos de acceso antes de registrar el pago.', { exact: true })).toBeVisible();
        await page.getByRole('checkbox', { name: /Confirmo que verifiqué/ }).check();
        await page.getByRole('checkbox', { name: /Confirmo que recibí/ }).check();
        await page.getByRole('button', { name: 'Registrar pago', exact: true }).click();
        await expect.poll(async () => (await pagosSocio()).length).toBe(2);
        const pagos = await pagosSocio();
        expect(pagos.find(p => p.tipoPlan === 'jubilados')).toMatchObject({ montoCentavos: 6200000, confirmacionRequisitos: true });
        const paginaTarjeta = await tarjeta.newPage();
        await paginaTarjeta.goto('/asociate?plan=mensual');
        await paginaTarjeta.getByLabel('Cómo vas a pagar', { exact: true }).selectOption('Tarjeta');
        await expect(paginaTarjeta.getByText(/No se piden datos de tu tarjeta/)).toBeVisible();
        await expect(paginaTarjeta.getByRole('status')).toContainText('88.000,00');
        await datos(paginaTarjeta, 'tarifas-tarjeta@example.test', '90008201');
        await paginaTarjeta.getByRole('button', { name: 'Crear cuenta y solicitar membresía' }).click();
        await expect(paginaTarjeta).toHaveURL('/mi-espacio');
        expect((await paginaTarjeta.request.get('/api/mi-membresia').then(r => r.json())).data).toBeNull();
        await page.goto('/gestion/planes');
        const semanal = page.getByRole('article', { name: 'Pase semanal', exact: true });
        await semanal.getByRole('button', { name: 'Editar', exact: true }).click();
        await expect(page.getByLabel('Unidad de duración')).toHaveValue('dias');
        await expect(page.getByLabel('Duración (días corridos)')).toHaveValue('7');
        await expect(page.getByLabel('Precio promocional exacto (ARS)')).toHaveValue('46000.00');
        await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click();
        await expect(semanal.getByText('Por 7 días corridos', { exact: true })).toBeVisible();
    } finally { await contexto.close(); await tarjeta.close(); }
});
