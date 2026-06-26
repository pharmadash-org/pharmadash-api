import express from 'express';
import passport from 'passport';
import pinoHttp from 'pino-http';
import { logger } from './config/logger';
import { correlationId } from './middlewares/correlation-id';
import { errorHandler } from './middlewares/error-handler';
import medicationRoutes from './modules/medications/routes';
import saleRoutes from './modules/sales/routes';
import dashboardRoutes from './modules/dashboard/routes';

// Must import to register BearerStrategy
import './middlewares/auth';

const app = express();

app.use(express.json());
app.use(correlationId);
app.use(
  pinoHttp({
    logger,
    genReqId: (req) => req.correlationId ?? '',
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
