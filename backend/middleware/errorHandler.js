export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(error, _req, res, _next) { res.status(res.statusCode >= 400 ? res.statusCode : 500).json({ message: error.message || 'Internal server error' }); }
