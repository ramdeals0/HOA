import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { errorHandler } from './lib/types';

import authRoutes from './routes/auth.routes';
import tenantRoutes from './routes/tenant.routes';
import applicationsRoutes from './routes/applications.routes';
import newsRoutes from './routes/news.routes';
import blastsRoutes from './routes/blasts.routes';
import classifiedsRoutes from './routes/classifieds.routes';
import invoicesRoutes from './routes/invoices.routes';
import paymentsRoutes, { paymentsTenantRouter } from './routes/payments.routes';
import documentsRoutes from './routes/documents.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import membersRoutes from './routes/members.routes';
import accountRoutes from './routes/account.routes';
import meetingsRoutes from './routes/meetings.routes';
import directoryRoutes from './routes/directory.routes';
import reportsRoutes from './routes/reports.routes';
import saasAdminRoutes from './routes/saas-admin.routes';

dotenv.config();

function getCorsOrigins(): string | string[] {
  const raw = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  const origins = raw.split(',').map((o) => o.trim()).filter(Boolean);
  return origins.length === 1 ? origins[0] : origins;
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: getCorsOrigins(),
      credentials: true,
    }),
  );

  app.use(cookieParser());

  // Stripe webhook needs raw body
  app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Global auth routes
  app.use('/api/auth', authRoutes);

  // HOA onboarding (creates tenant)
  app.use('/api/tenants', tenantRoutes);

  // SaaS platform admin
  app.use('/api/saas-admin', saasAdminRoutes);

  // Global payment webhook
  app.use('/api/payments', paymentsRoutes);

  // Tenant-scoped routes: /api/t/:tenantSlug/...
  const tenantApi = express.Router({ mergeParams: true });
  tenantApi.use('/applications', applicationsRoutes);
  tenantApi.use('/news', newsRoutes);
  tenantApi.use('/blasts', blastsRoutes);
  tenantApi.use('/classifieds', classifiedsRoutes);
  tenantApi.use('/invoices', invoicesRoutes);
  tenantApi.use('/payments', paymentsTenantRouter);
  tenantApi.use('/documents', documentsRoutes);
  tenantApi.use('/maintenance', maintenanceRoutes);
  tenantApi.use('/members', membersRoutes);
  tenantApi.use('/account', accountRoutes);
  tenantApi.use('/meetings', meetingsRoutes);
  tenantApi.use('/directory', directoryRoutes);
  tenantApi.use('/reports', reportsRoutes);

  app.use('/api/t/:tenantSlug', tenantApi);

  app.use(errorHandler);

  return app;
}
