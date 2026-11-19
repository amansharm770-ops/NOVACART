
function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const clean = {};

  for (const [key, item] of Object.entries(value)) {
    if (
      key.startsWith('$') ||
      key.includes('.') ||
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype'
    ) {
      continue;
    }

    clean[key] = sanitizeValue(item);
  }

  return clean;
}

export function sanitize(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitizeValue(req.params);
    }

    const cleanQuery = sanitizeValue(req.query);

    Object.defineProperty(req, 'query', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: cleanQuery,
    });

    next();
  } catch (error) {
    next(error);
  }
}
