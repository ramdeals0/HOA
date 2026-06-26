import { Router } from 'express';
import { createTenantSchema, updateTenantSchema } from '@hoa/shared';
import { asyncHandler, param } from '../lib/types';
import { requireAuth } from '../middleware/auth';
import { TenantService } from '../services/auth.service';
import { createEmailService } from '../services/email.service';

const router = Router();
const tenantService = new TenantService();

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const data = createTenantSchema.parse(req.body);
    const tenant = await tenantService.createWithAdmin(data);
    res.status(201).json({ tenant });
  }),
);

router.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const tenant = await tenantService.getBySlug(param(req.params.slug));
    if (!tenant) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      logoUrl: tenant.logoUrl,
      primaryColor: tenant.primaryColor,
      address: tenant.address,
      state: tenant.state,
      primaryContactEmail: tenant.primaryContactEmail,
      plan: tenant.plan,
    });
  }),
);

export default router;
