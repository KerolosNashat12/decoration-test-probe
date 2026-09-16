import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

export interface TenantCredentialsEmailInput {
  to: string;
  tenantName: string;
  loginEmail: string;
  temporaryPassword: string;
}

// SMTP-backed transactional email, configured entirely via env vars so it
// works with any provider (a real SMTP relay like Postmark/SendGrid/SES's
// SMTP endpoint, or a self-hosted MTA) without vendor lock-in.
//
// Fails soft, deliberately, mirroring TenantDashboardClientService: a
// tenant getting created/provisioned must never fail — or even slow down —
// because email isn't configured yet or a send attempt errors out. The
// temporary password is still shown once in the Super Admin UI either way
// (see CredentialsModal), so email is a convenience layered on top of an
// already-working flow, never a dependency of it.
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;
  private triedToInit = false;

  private getTransporter(): Transporter | null {
    if (this.triedToInit) return this.transporter;
    this.triedToInit = true;

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !port || !user || !pass) {
      this.logger.warn('SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASSWORD not fully configured — skipping email sending');
      return null;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(port),
      secure: process.env.SMTP_SECURE === 'true' || Number(port) === 465,
      auth: { user, pass },
    });
    return this.transporter;
  }

  // Never throws. Returns true if the email was handed off to the SMTP
  // server successfully, false otherwise — callers should log/ignore the
  // result, never block on it.
  async sendTenantCredentials(input: TenantCredentialsEmailInput): Promise<boolean> {
    const transporter = this.getTransporter();
    if (!transporter) return false;

    const from = process.env.SMTP_FROM ?? 'Decoration <no-reply@decoration.local>';
    const loginUrl = process.env.TENANT_DASHBOARD_FRONTEND_URL ?? 'http://localhost:5174';

    try {
      await transporter.sendMail({
        from,
        to: input.to,
        subject: 'Your Decoration Tenant Dashboard login',
        text: [
          `Hi ${input.tenantName},`,
          '',
          'Your Tenant Dashboard account is ready. Here are your login details:',
          '',
          `Login page: ${loginUrl}`,
          `Email: ${input.loginEmail}`,
          `Temporary password: ${input.temporaryPassword}`,
          '',
          "This password is shown only once — please sign in and change it from Settings as soon as you can.",
          '',
          '— Decoration',
        ].join('\n'),
        html: `
          <p>Hi ${escapeHtml(input.tenantName)},</p>
          <p>Your Tenant Dashboard account is ready. Here are your login details:</p>
          <p>
            Login page: <a href="${loginUrl}">${loginUrl}</a><br/>
            Email: <strong>${escapeHtml(input.loginEmail)}</strong><br/>
            Temporary password: <strong>${escapeHtml(input.temporaryPassword)}</strong>
          </p>
          <p>This password is shown only once — please sign in and change it from Settings as soon as you can.</p>
          <p>— Decoration</p>
        `,
      });
      this.logger.log(`Sent tenant credentials email to ${input.to}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to send tenant credentials email to ${input.to}: ${(error as Error).message}`);
      return false;
    }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
