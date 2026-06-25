import express from 'express';
import cors from 'cors';
import passport from 'passport';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { env } from './config/env';
import { correlationId } from './middlewares/correlation-id';
import { errorHandler } from './middlewares/error-handler';
import medicationRoutes from './modules/medications/routes';
import saleRoutes from './modules/sales/routes';
import dashboardRoutes from './modules/dashboard/routes';

// Must import to register BearerStrategy
import './middlewares/auth';

const app = express();

const allowedOrigins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, curl, server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin '${origin}' not allowed`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type', 'x-correlation-id'],
    exposedHeaders: ['x-correlation-id'],
    credentials: true,
  }),
);

app.use(express.json());
app.use(correlationId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.correlationId,
    customLogLevel: (_req, res) => (res.statusCode >= 500 ? 'error' : 'info'),
    serializers: {
      req(req) {
        return { method: req.method, url: req.url, correlationId: req.id };
      },
    },
  }),
);
app.use(passport.initialize());

app.get('/health', (_req, res) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use('/api/v1/medications', medicationRoutes);
app.use('/api/v1/sales', saleRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.use(errorHandler);

export { app };
