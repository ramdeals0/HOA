import {
  defineRailway,
  github,
  group,
  postgres,
  preserve,
  project,
  service,
} from "railway/iac";

export default defineRailway(() => {
  const db = postgres("Postgres");

  const api = service("hoa-api", {
    source: github("ramdeals0/HOA", { branch: "cursor/hoa-multi-tenant-saas-9ed3" }),
    build:
      "pnpm install --frozen-lockfile && pnpm --filter @hoa/shared build && pnpm --filter @hoa/api build",
    start: "pnpm --filter @hoa/api start:prod",
    healthcheck: "/health",
    healthcheckTimeout: 120,
    env: {
      DATABASE_URL: db.env.DATABASE_URL,
      NODE_ENV: "production",
      JWT_SECRET: preserve(),
      COOKIE_CROSS_ORIGIN: "true",
      EMAIL_PROVIDER: "memory",
      SEED_DATABASE: preserve(),
      CORS_ORIGIN: preserve(),
      WEB_URL: preserve(),
      API_URL: preserve(),
    },
  });

  const web = service("hoa-web", {
    source: github("ramdeals0/HOA", { branch: "cursor/hoa-multi-tenant-saas-9ed3" }),
    build:
      "pnpm install --frozen-lockfile && pnpm --filter @hoa/shared build && pnpm --filter @hoa/web build",
    start: "pnpm --filter @hoa/web start",
    healthcheck: "/",
    healthcheckTimeout: 120,
    env: {
      NODE_ENV: "production",
      NEXT_PUBLIC_API_URL: preserve(),
    },
  });

  const backend = group("Backend", [db, api]);

  return project("hoa-saas", {
    resources: [backend, web],
  });
});
