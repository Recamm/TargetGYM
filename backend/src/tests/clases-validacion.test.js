import test from 'node:test';
import assert from 'node:assert/strict';
import { validarClase } from '../utils/validation.js';

const valido = { nombre: 'Funcional', tipo: 'Grupal', fecha: '2099-11-01', horaInicio: '18:00', cupoMaximo: 10 };

for (const cambios of [
    { nombre: '   ' }, { tipo: 123 }, { fecha: '2026-02-30' },
    { fecha: '2000-01-01' }, { horaInicio: '25:00' },
    { cupoMaximo: '10' }, { cupoMaximo: 1.5 }, { id: 99 },
]) {
    test(`rechaza clase invalida: ${JSON.stringify(cambios)}`, () => {
        assert.throws(() => validarClase({ ...valido, ...cambios }));
    });
}

test('editar no permite alterar id ni cupo disponible', () => {
    assert.throws(() => validarClase({ ...valido, id: 123, cupoDisponible: 999 }));
});
