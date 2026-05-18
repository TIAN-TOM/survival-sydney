// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// consistent success/failure response envelope helpers.
function ok(data = null) {
  return {
    success: true,
    data,
  };
}

function fail(message = 'Request failed') {
  return {
    success: false,
    error: message,
  };
}

module.exports = {
  ok,
  fail,
};
