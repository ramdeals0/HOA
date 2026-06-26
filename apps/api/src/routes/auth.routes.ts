import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signupSchema, loginSchema, selectTenantSchema } from '@hoa/shared';
import { asyncHandler, AppError } from '../lib/types';
import { requireAuth } from '../middleware/auth';
import { AuthService } from '../services/auth.service';
import { createEmailService } from '../services/email.service';
import { signToken, cookieOptions, COOKIE_NAME } from '../lib/jwt';

const router = Router();
const authService = new AuthService(createEmailService());

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many login attempts' },
});

router.post(
  '/signup',
  asyncHandler(async (req, res) => {
    const data = signupSchema.parse(req.body);
    const user = await authService.signup(data);
    res.status(201).json({ user });
  }),
);

router.post(
  '/login',
  loginLimiter,
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);
    const result = await authService.login(data.email, data.password);

    res.cookie(COOKIE_NAME, result.token, cookieOptions());

    if (result.tenants.length === 1) {
      const selected = await authService.selectTenant(result.user.id, result.tenants[0].tenantId);
      res.cookie(COOKIE_NAME, selected.token, cookieOptions());
      res.json({ ...result, selectedTenant: selected.tenant, autoSelected: true });
      return;
    }

    res.json({ ...result, autoSelected: false });
  }),
);

router.post(
  '/select-tenant',
  requireAuth,
  asyncHandler(async (req, res) => {
    const { tenantId } = selectTenantSchema.parse(req.body);
    const result = await authService.selectTenant(req.auth!.userId, tenantId);
    res.cookie(COOKIE_NAME, result.token, cookieOptions());
    res.json(result);
  }),
);

router.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    res.clearCookie(COOKIE_NAME, { path: '/' });
    res.json({ success: true });
  }),
);

router.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const me = await authService.getMe(req.auth!.userId, req.auth!.tenantId);
    res.json(me);
  }),
);

export default router;
