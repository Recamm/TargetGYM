import { expect, test } from 'vitest';
import { validarClase, validarUsuario, semanaDe, fechaTexto } from './validation.js';

test('validacion de clase detecta campos, enteros y fecha pasada', () => {
    const errors = validarClase({ nombre: ' ', tipo: '', fecha: '2000-01-01', horaInicio: '18:00', cupoMaximo: '1.5', instructorId: '', duracionMinutos: '0' });
    expect(Object.keys(errors)).toEqual(expect.arrayContaining(['nombre','tipo','fecha','cupoMaximo','instructorId','duracionMinutos']));
});
test('registro exige contraseña segura y datos obligatorios', () => {
    expect(validarUsuario({ email: 'incorrecto', password: '123' })).toHaveProperty('password');
    expect(validarUsuario({})).toHaveProperty('nombre');
});
test('fechas y semanas no desplazan un dia por UTC', () => {
    expect(fechaTexto('2030-02-02')).toContain('2');
    expect(semanaDe('2030-02-03')[0]).toBe('2030-01-28');
    expect(semanaDe('2030-02-03')[6]).toBe('2030-02-03');
});
