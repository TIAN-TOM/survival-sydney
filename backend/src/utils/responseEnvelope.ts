// Subsystem D - Integration, Robustness & Documentation (Tom Tian):
// consistent success/failure response envelope helpers.
export interface OkEnvelope<T> {
  success: true;
  data: T;
}

export interface FailEnvelope {
  success: false;
  error: string;
}

function ok(): OkEnvelope<null>;
function ok<T>(data: T): OkEnvelope<T>;
function ok<T>(data: T | null = null): OkEnvelope<T | null> {
  return {
    success: true,
    data,
  };
}

function fail(message = 'Request failed'): FailEnvelope {
  return {
    success: false,
    error: message,
  };
}

export {
  ok,
  fail,
};
