export function notFound(req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Route not found' } });
}

export function errorHandler(err, req, res, next) {
  const status = err.status || (err.name === 'ZodError' ? 400 : 500);
  const code = err.code || (err.name === 'ZodError' ? 'VALIDATION_ERROR' : 'INTERNAL_ERROR');
  const message = status >= 500 ? 'Internal server error' : err.message;
  if (status >= 500) console.error(err);
  res.status(status).json({ success: false, error: { code, message } });
}