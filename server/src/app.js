import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { corsMiddleware } from './config/cors.js';
import { sanitize } from './middleware/sanitize.js';
import { csrfProtection } from './middleware/csrf.js';
import { apiLimiter } from './middleware/rateLimiters.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import healthRouter from './routes/public/health.js';
import authRouter from './routes/public/auth.js';
import productsRouter from './routes/public/products.js';
import ordersRouter from './routes/orders.js';
import adminRouter from './routes/admin/index.js';

const app = express();

app.disable('x-powered-by');
// Behind one proxy in production (e.g. Render); needed so rate limiting sees the real client IP.
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(sanitize);
app.use('/api', apiLimiter);
app.use('/api', csrfProtection);

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
