import { Router } from 'express';
import { reportDateRangeSchema } from '@hoa/shared';
import { rowsToCsv } from '../lib/csv';
import { asyncHandler } from '../lib/types';
import { requireAuth, requireTenantMembership, requireTenantRole } from '../middleware/auth';
import { resolveTenant, requireTenant } from '../middleware/tenant';
import { reportingService } from '../services/reporting.service';

const router = Router({ mergeParams: true });

router.use(resolveTenant, requireTenant, requireAuth, requireTenantMembership);
router.use(requireTenantRole(['SUPER_ADMIN', 'BOARD']));

function parseDateRange(query: { from?: string; to?: string }) {
  const parsed = reportDateRangeSchema.parse(query);
  return {
    from: new Date(`${parsed.from}T00:00:00.000Z`),
    to: new Date(`${parsed.to}T23:59:59.999Z`),
    fromLabel: parsed.from,
    toLabel: parsed.to,
  };
}

router.get(
  '/collections-summary',
  asyncHandler(async (req, res) => {
    const { from, to } = parseDateRange(req.query as { from?: string; to?: string });
    const summary = await reportingService.getCollectionsSummary(req.tenant!.tenantId, from, to);
    res.json(summary);
  }),
);

router.get(
  '/members-summary',
  asyncHandler(async (req, res) => {
    const summary = await reportingService.getMembersSummary(req.tenant!.tenantId);
    res.json(summary);
  }),
);

router.get(
  '/delinquencies',
  asyncHandler(async (req, res) => {
    const delinquencies = await reportingService.getDelinquencies(req.tenant!.tenantId);
    res.json({ delinquencies });
  }),
);

router.get(
  '/invoices.csv',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenant!.tenantId;
    const { from, to, fromLabel, toLabel } = parseDateRange(req.query as { from?: string; to?: string });
    const rows = await reportingService.getInvoicesForExport(tenantId, from, to);
    const csv = rowsToCsv(rows, [
      { key: 'tenantId', header: 'tenant_id' },
      { key: 'invoiceId', header: 'invoice_id' },
      { key: 'memberName', header: 'member_name' },
      { key: 'memberEmail', header: 'member_email' },
      { key: 'propertyStreet', header: 'property_street' },
      { key: 'propertyLot', header: 'property_lot' },
      { key: 'description', header: 'description' },
      { key: 'amountCents', header: 'amount_cents' },
      { key: 'status', header: 'status' },
      { key: 'dueDate', header: 'due_date' },
      { key: 'periodStart', header: 'period_start' },
      { key: 'periodEnd', header: 'period_end' },
    ]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="invoices-${fromLabel}-to-${toLabel}.csv"`,
    );
    res.send(csv);
  }),
);

router.get(
  '/payments.csv',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenant!.tenantId;
    const { from, to, fromLabel, toLabel } = parseDateRange(req.query as { from?: string; to?: string });
    const rows = await reportingService.getPaymentsForExport(tenantId, from, to);
    const csv = rowsToCsv(rows, [
      { key: 'tenantId', header: 'tenant_id' },
      { key: 'paymentId', header: 'payment_id' },
      { key: 'memberName', header: 'member_name' },
      { key: 'memberEmail', header: 'member_email' },
      { key: 'invoiceDescription', header: 'invoice_description' },
      { key: 'amountCents', header: 'amount_cents' },
      { key: 'status', header: 'status' },
      { key: 'paidAt', header: 'paid_at' },
    ]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="payments-${fromLabel}-to-${toLabel}.csv"`,
    );
    res.send(csv);
  }),
);

router.get(
  '/members.csv',
  asyncHandler(async (req, res) => {
    const tenantId = req.tenant!.tenantId;
    const rows = await reportingService.getMembersForExport(tenantId);
    const csv = rowsToCsv(rows, [
      { key: 'tenantId', header: 'tenant_id' },
      { key: 'memberId', header: 'member_id' },
      { key: 'memberName', header: 'member_name' },
      { key: 'memberEmail', header: 'member_email' },
      { key: 'role', header: 'role' },
      { key: 'status', header: 'status' },
      { key: 'joinDate', header: 'join_date' },
      { key: 'lastLogin', header: 'last_login' },
      { key: 'propertyStreet', header: 'property_street' },
      { key: 'propertyLot', header: 'property_lot' },
    ]);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="members.csv"');
    res.send(csv);
  }),
);

export default router;
