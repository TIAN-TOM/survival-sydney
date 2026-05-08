// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// consistent success/failure response envelope helpers.
function ok(data = null, meta = undefined) {
  const envelope = {
    success: true,
    data,
  };

  if (meta !== undefined) {
    envelope.meta = meta;
  }

  return envelope;
}

function fail(message = 'Request failed', statusCode = 400, details = undefined, code = undefined) {
  const envelope = {
    success: false,
    error: message,
    statusCode,
  };

  if (code !== undefined) {
    envelope.code = code;
  }

  if (details !== undefined) {
    envelope.details = details;
  }

  return envelope;
}

module.exports = {
  ok,
  fail,
};
