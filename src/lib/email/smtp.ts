import nodemailer from 'nodemailer';

export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class SMTPEmailService {
  private transporter: nodemailer.Transporter | null = null;
  private fromEmail: string;

  constructor() {
    this.fromEmail = (process as any).env.FROM_EMAIL || 'HackCubes <noreply@hackcubes.com>';
    
    // Initialize transporter if SMTP config is provided
    if ((process as any).env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: (process as any).env.SMTP_HOST,
        port: parseInt((process as any).env.SMTP_PORT || '587'),
        secure: (process as any).env.SMTP_PORT === '465', // true for 465, false for other ports
        auth: {
          user: (process as any).env.SMTP_USER,
          pass: (process as any).env.SMTP_PASSWORD,
        },
      });
    } else {
      console.log('📧 SMTP not configured - email service disabled');
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        console.log('📧 SMTP not configured - would send:', subject, 'to:', to);
        return { success: true }; // Return success for development
      }

      const info = await this.transporter.sendMail({
        from: this.fromEmail,
        to,
        subject,
        html,
      });

      console.log('✅ Email sent successfully:', info.messageId);
      return { success: true };
    } catch (error) {
      console.error('❌ SMTP email error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.transporter) return false;
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}
