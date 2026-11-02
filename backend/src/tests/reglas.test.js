import test from 'node:test';
import assert from 'node:assert/strict';
import { sumarMeses } from '../utils/validation.js';

test('meses calendario conservan el dia local del gimnasio a ultima hora', () => {
    assert.equal(sumarMeses(new Date('2030-01-30T23:30:00-03:00'), 1).toISOString(), '2030-03-01T02:30:00.000Z');
    assert.equal(sumarMeses(new Date('2032-01-31T12:00:00-03:00'), 1).toISOString(), '2032-02-29T15:00:00.000Z');
    assert.equal(sumarMeses(new Date('2030-01-31T12:00:00-03:00'), 3).toISOString(), '2030-04-30T15:00:00.000Z');
    assert.equal(sumarMeses(new Date('2032-02-29T12:00:00-03:00'), 12).toISOString(), '2033-02-28T15:00:00.000Z');
});
