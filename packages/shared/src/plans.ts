export const PLANS = ['FREE', 'PRO', 'ENTERPRISE'] as const;

export type Plan = 'FREE' | 'PRO' | 'ENTERPRISE';

export const PLAN_LIMITS: Record<Plan, { maxProperties: number; blasts: boolean; maintenance: boolean }> = {
  FREE: { maxProperties: 25, blasts: false, maintenance: false },
  PRO: { maxProperties: 200, blasts: true, maintenance: true },
  ENTERPRISE: { maxProperties: Infinity, blasts: true, maintenance: true },
};
