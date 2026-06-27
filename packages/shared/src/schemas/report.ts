import { z } from 'zod';

const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD');

export const reportDateRangeSchema = z
  .object({
    from: isoDateSchema,
    to: isoDateSchema,
  })
  .refine(
    (data) => new Date(data.from) <= new Date(data.to),
    { message: 'Start date must be on or before end date', path: ['to'] },
  );

export type ReportDateRange = z.infer<typeof reportDateRangeSchema>;

export type CollectionsSummary = {
  totals: {
    invoicedCents: number;
    paidCents: number;
    overdueCents: number;
    collectionRate: number;
  };
  monthly: Array<{
    month: string;
    invoicedCents: number;
    paidCents: number;
  }>;
};

export type InvoiceExportRow = {
  tenantId: string;
  invoiceId: string;
  memberName: string;
  memberEmail: string;
  propertyStreet: string;
  propertyLot: string;
  description: string;
  amountCents: number;
  status: string;
  dueDate: string;
  periodStart: string;
  periodEnd: string;
};

export type PaymentExportRow = {
  tenantId: string;
  paymentId: string;
  memberName: string;
  memberEmail: string;
  invoiceDescription: string;
  amountCents: number;
  status: string;
  paidAt: string;
};

export type MemberExportRow = {
  tenantId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  role: string;
  status: string;
  joinDate: string;
  lastLogin: string;
  propertyStreet: string;
  propertyLot: string;
};

export type DelinquencyRow = {
  invoiceId: string;
  memberName: string;
  memberEmail: string;
  propertyStreet: string;
  propertyLot: string;
  amountCents: number;
  status: string;
  dueDate: string;
  daysPastDue: number;
};

export type MembersSummary = {
  totalMembers: number;
  activeMembers: number;
  pendingMembers: number;
  pendingApplications: number;
};
