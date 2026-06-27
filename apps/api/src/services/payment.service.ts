import Stripe from 'stripe';
import { prisma } from '../lib/prisma';
import { AppError } from '../lib/types';
import { EmailService } from './email.service';

export class PaymentService {
  constructor(private emailService: EmailService) {}

  private getStripe(secretKey: string): Stripe {
    return new Stripe(secretKey, { apiVersion: '2025-02-24.acacia' });
  }

  async createCheckoutSession(tenantId: string, userId: string, invoiceId: string) {
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId, userId },
      include: { tenant: { include: { settings: true } } },
    });

    if (!invoice) {
      throw new AppError(404, 'Invoice not found');
    }

    if (invoice.status === 'PAID') {
      throw new AppError(400, 'Invoice already paid');
    }

    const secretKey =
      invoice.tenant.settings?.stripeSecretKey ?? process.env.STRIPE_SECRET_KEY;

    if (!secretKey) {
      throw new AppError(500, 'Stripe not configured for this community');
    }

    const stripe = this.getStripe(secretKey);
    const webUrl = process.env.WEB_URL ?? 'http://localhost:3000';
    const slug = invoice.tenant.slug;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: invoice.description },
            unit_amount: invoice.amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        tenantId,
        invoiceId,
        userId,
      },
      success_url: `${webUrl}/t/${slug}/portal/payments/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${webUrl}/t/${slug}/portal/payments?cancelled=true`,
    });

    await prisma.payment.create({
      data: {
        tenantId,
        invoiceId,
        userId,
        amountCents: invoice.amountCents,
        status: 'PENDING',
        stripeSessionId: session.id,
      },
    });

    return { sessionId: session.id, url: session.url };
  }

  async handleWebhook(rawBody: Buffer, signature: string, webhookSecret?: string) {
    const secret = webhookSecret ?? process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) {
      throw new AppError(500, 'Webhook secret not configured');
    }

    const stripe = this.getStripe(process.env.STRIPE_SECRET_KEY ?? '');
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new AppError(400, 'Invalid webhook signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      await this.handleCheckoutComplete(session);
    }

    return { received: true };
  }

  async handleCheckoutComplete(session: Stripe.Checkout.Session) {
    const { tenantId, invoiceId, userId } = session.metadata ?? {};

    if (!tenantId || !invoiceId || !userId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    await prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findFirst({
        where: { stripeSessionId: session.id, tenantId },
      });

      if (payment) {
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCEEDED',
            stripePaymentIntentId: session.payment_intent as string,
          },
        });
      }

      await tx.invoice.updateMany({
        where: { id: invoiceId, tenantId },
        data: { status: 'PAID' },
      });

      await tx.tenantSettings.updateMany({
        where: { tenantId },
        data: { lastStripeEventAt: new Date() },
      });
    });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const invoice = await prisma.invoice.findFirst({ where: { id: invoiceId, tenantId } });

    if (user && invoice) {
      await this.emailService.send({
        to: user.email,
        subject: 'Payment Receipt - HOA Dues',
        html: `<p>Thank you for your payment of $${(invoice.amountCents / 100).toFixed(2)}.</p>`,
        text: `Thank you for your payment of $${(invoice.amountCents / 100).toFixed(2)}.`,
      });

      await prisma.tenantSettings.updateMany({
        where: { tenantId },
        data: { lastEmailSentAt: new Date() },
      });
    }
  }

  async getMyPayments(
    tenantId: string,
    userId: string,
    filters?: { from?: Date; to?: Date },
  ) {
    const where: {
      tenantId: string;
      userId: string;
      createdAt?: { gte?: Date; lte?: Date };
    } = { tenantId, userId };

    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) {
        where.createdAt.gte = filters.from;
      }
      if (filters.to) {
        where.createdAt.lte = filters.to;
      }
    }

    return prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { invoice: true },
    });
  }
}
