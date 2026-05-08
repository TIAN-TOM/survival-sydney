// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// response envelope helper regression coverage.
const { fail, ok } = require('../utils/responseEnvelope');

describe('response envelope', () => {
  test('ok returns success envelope with data and meta', () => {
    expect(ok({ id: 1 }, { page: 1 })).toEqual({
      success: true,
      data: { id: 1 },
      meta: { page: 1 },
    });
  });

  test('fail returns failure envelope with status and details', () => {
    expect(fail('Nope', 422, [{ field: 'questionId' }], 'VALIDATION_ERROR')).toEqual({
      success: false,
      error: 'Nope',
      code: 'VALIDATION_ERROR',
      details: [{ field: 'questionId' }],
      statusCode: 422,
    });
  });
});
