// Errors created with httpError() are written by us, so their message is safe to show.
export function httpError(status, message, errors) {
  const err = new Error(message);
  err.name = 'HttpError';
  err.status = status;
  if (errors) err.errors = errors;
  return err;
}
