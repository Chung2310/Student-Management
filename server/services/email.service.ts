import nodemailer from "nodemailer";
import { logger } from "../config/logger";

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
}

export class EmailService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private static transporter: any = null;
  private static lastConfigKey: string = "";

  private static getTransporter() {
    const host = process.env.SMTP_HOST?.trim();
    const portStr = process.env.SMTP_PORT?.trim();
    const secureStr = process.env.SMTP_SECURE?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASS?.trim();

    if (!host || !portStr || !user || !pass) {
      throw new Error("SMTP_CONFIG_missing");
    }

    const configKey = `${host}:${portStr}:${secureStr}:${user}:${pass}`;

    // Reuse existing transporter if configuration hasn't changed
    if (this.transporter && this.lastConfigKey === configKey) {
      return this.transporter;
    }

    const port = parseInt(portStr, 10);
    const secure = secureStr === "true";

    this.transporter = nodemailer.createTransport({
      pool: true, // Enable connection pooling for faster bulk sending
      maxConnections: 5,
      maxMessages: 100,
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    });

    this.lastConfigKey = configKey;
    return this.transporter;
  }

  /**
   * Verify SMTP connection status
   */
  static async verifyConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const transporter = this.getTransporter();
      await transporter.verify();
      return { success: true };
    } catch (error: unknown) {
      logger.error("SMTP verify connection error: %o", error);
      const msg = error instanceof Error ? error.message : "Không thể kết nối máy chủ SMTP";
      return { success: false, error: msg };
    }
  }

  /**
   * Send an email via SMTP
   */
  static async sendMail(options: MailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const transporter = this.getTransporter();
      const from = process.env.SMTP_FROM?.trim() || `"Hệ thống Quản lý" <${process.env.SMTP_USER}>`;
      const sandboxEmail = process.env.SMTP_SANDBOX_EMAIL?.trim();

      let targetEmail = options.to.trim();
      let finalSubject = options.subject.trim();

      if (sandboxEmail) {
        targetEmail = sandboxEmail;
        finalSubject = `[SANDBOX - Học viên: ${options.to}] ${finalSubject}`;
      }

      const info = await transporter.sendMail({
        from,
        to: targetEmail,
        subject: finalSubject,
        html: options.html,
      });

      logger.info(`Email sent successfully: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error: unknown) {
      logger.error("SMTP send mail error: %o", error);
      const msg = error instanceof Error ? error.message : "Lỗi gửi mail qua SMTP";
      return { success: false, error: msg };
    }
  }
}
