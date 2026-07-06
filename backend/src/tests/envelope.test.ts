// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// response envelope helper regression coverage.
import { fail, ok } from '../utils/responseEnvelope';

describe('response envelope', () => {
  test('ok returns success envelope with data', () => {
    expect(ok({ id: 1 })).toEqual({
      success: true,
      data: { id: 1 },
    });
  });

  test('fail returns failure envelope with error only', () => {
    expect(fail('Nope')).toEqual({
      success: false,
      error: 'Nope',
    });
  });
});
