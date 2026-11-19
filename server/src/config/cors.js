
import cors from 'cors';
import { env } from './env.js';

const allowedOrigins = new Set(env.CLIENT_ORIGINS);

export const corsMiddleware = cors({
  origin(origin, callback) {
    // Allow requests without an Origin header, such as local health checks.
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }

    const err = new Error('Origin not allowed by CORS');
    err.status = 403;
    return callback(err);
  },

  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  maxAge: 600,
});
