import { Plan } from '@prisma/client';
import { PLAN_LIMITS, Plan as SharedPlan } from '@hoa/shared';

export class FeatureFlagService {
  canSendBlasts(plan: Plan): boolean {
    return PLAN_LIMITS[plan as SharedPlan].blasts;
  }

  canUseMaintenance(plan: Plan): boolean {
    return PLAN_LIMITS[plan as SharedPlan].maintenance;
  }

  getMaxProperties(plan: Plan): number {
    return PLAN_LIMITS[plan as SharedPlan].maxProperties;
  }

  canAddProperty(plan: Plan, currentCount: number): boolean {
    return currentCount < this.getMaxProperties(plan);
  }
}

export const featureFlagService = new FeatureFlagService();
