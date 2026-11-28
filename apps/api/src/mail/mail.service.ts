import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.config';

export interface EmployeeInviteEmailParams {
  to: string;
  name: string;
  workEmail: string;
  tempPassword: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null = null;

  constructor() {
    if (env.MAIL_HOST && env.MAIL_USERNAME && env.MAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: env.MAIL_HOST,
        port: env.MAIL_PORT,
        secure: env.MAIL_PORT === 465,
        auth: {
          user: env.MAIL_USERNAME,
          pass: env.MAIL_PASSWORD,
        },
      });
    } else {
      this.logger.warn(
        'SMTP mail credentials are not configured. Invite emails will be logged instead of sent.',
      );
    }
  }

  async sendEmployeeInvite(params: EmployeeInviteEmailParams): Promise<boolean> {
    const loginUrl = `${env.FRONTEND_URL}/login`;
    const from = env.MAIL_FROM || env.MAIL_USERNAME || 'no-reply@hrm.local';

    const subject = 'Welcome to HRM Portal — Your Account Credentials';
    const text = [
      `Hi ${params.name},`,
      '',
      'Your employee account has been created on the HRM Portal.',
      '',
      `Login URL: ${loginUrl}`,
      `Username (Work Email): ${params.workEmail}`,
      `Temporary Password: ${params.tempPassword}`,
      '',
      'For security, you will be required to change this temporary password immediately after your first login.',
      '',
      'Regards,',
      'HR Team',
    ].join('\n');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="margin-top: 0; color: #0f172a;">Welcome to the HRM Portal, ${params.name}!</h2>
        <p style="font-size: 14px; line-height: 1.6;">
          Your employee account has been created. Use the credentials below to sign in:
        </p>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 14px;">
          <p style="margin: 0 0 8px;"><strong>Username (Work Email):</strong> ${params.workEmail}</p>
          <p style="margin: 0;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${params.tempPassword}</code></p>
        </div>
        <p style="font-size: 13px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; padding: 10px 12px; border-radius: 8px;">
          You will be required to set a new password immediately after logging in for the first time.
        </p>
        <p style="margin: 20px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: #0d9488; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: bold; font-size: 14px;">
            Sign In to HRM Portal
          </a>
        </p>
        <p style="font-size: 12px; color: #64748b; margin-bottom: 0;">
          If the button does not work, open: ${loginUrl}
        </p>
      </div>
    `;

    if (!this.transporter) {
      this.logger.log(
        `[DEV MAIL] To: ${params.to} | Work Email: ${params.workEmail} | Temp Password: ${params.tempPassword}`,
      );
      return false;
    }

    try {
      await this.transporter.sendMail({
        from,
        to: params.to,
        subject,
        text,
        html,
      });
      this.logger.log(`Invite email sent to ${params.to} (workEmail=${params.workEmail})`);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to send invite email to ${params.to}: ${(error as Error).message}`,
      );
      return false;
    }
  }
}
