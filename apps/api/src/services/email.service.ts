export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailService {
  send(message: EmailMessage): Promise<void>;
}

export class InMemoryEmailService implements EmailService {
  public sent: EmailMessage[] = [];

  async send(message: EmailMessage): Promise<void> {
    this.sent.push(message);
    console.log(`[Email:memory] To: ${message.to} | Subject: ${message.subject}`);
  }
}

export class NodemailerEmailService implements EmailService {
  private transporter: import('nodemailer').Transporter;
  private from: string;

  constructor() {
    const nodemailer = require('nodemailer');
    this.from = process.env.EMAIL_FROM ?? 'noreply@hoa-saas.example.com';
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    await this.transporter.sendMail({
      from: this.from,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
    });
  }
}

export function createEmailService(): EmailService {
  const provider = process.env.EMAIL_PROVIDER ?? 'memory';
  if (provider === 'smtp') {
    return new NodemailerEmailService();
  }
  return new InMemoryEmailService();
}
