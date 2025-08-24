import { Resend } from 'resend';

const resend = new Resend((process as any).env.RESEND_API_KEY);

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static instance: EmailService;
  private fromEmail: string;

  constructor() {
    this.fromEmail = (process as any).env.FROM_EMAIL || 'HackCubes <noreply@hackcubes.com>';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
      if (!(process as any).env.RESEND_API_KEY) {
        console.log('📧 Email service not configured - would send:', options.subject, 'to:', options.to);
        return { success: true }; // Return success for development
      }

      const result = await resend.emails.send({
        from: options.from || this.fromEmail,
        to: options.to,
        subject: options.subject,
        html: options.html,
      });

      if (result.error) {
        console.error('❌ Email send error:', result.error);
        return { success: false, error: result.error.message };
      }

      console.log('✅ Email sent successfully:', result.data?.id);
      return { success: true };
    } catch (error) {
      console.error('❌ Email service error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Method for early joiners signup confirmation
  async sendEarlyJoinerWelcome(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
    const subject = '🎯 Welcome to HackCubes - Early Access Confirmed!';
    const html = this.generateEarlyJoinerWelcomeEmail(name || 'Hacker', email);

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  // Method for waitlist signup confirmation
  async sendWaitlistConfirmation(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
    const subject = '🎉 HackCubes Waitlist - Challenge Completed!';
    const html = this.generateWaitlistConfirmationEmail(name || 'Hacker', email);

    return this.sendEmail({
      to: email,
      subject,
      html
    });
  }

  private generateEarlyJoinerWelcomeEmail(name: string, email: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to HackCubes</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #0a0a0a; 
            color: #ffffff; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #1a1a1a; 
            border-radius: 8px; 
            overflow: hidden; 
            border: 1px solid #333; 
        }
        .header { 
            background: linear-gradient(135deg, #00FF7F, #3BE8FF); 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: bold; 
            color: #0a0a0a; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .content h2 { 
            color: #00FF7F; 
            font-size: 24px; 
            margin-bottom: 20px; 
        }
        .content p { 
            line-height: 1.6; 
            margin-bottom: 20px; 
            color: #cccccc; 
        }
        .highlight { 
            background-color: #2a2a2a; 
            border-left: 4px solid #00FF7F; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 4px; 
        }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #00FF7F, #3BE8FF); 
            color: #0a0a0a; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 25px; 
            font-weight: bold; 
            margin: 20px 0; 
            text-align: center; 
        }
        .features { 
            list-style: none; 
            padding: 0; 
        }
        .features li { 
            margin: 10px 0; 
            padding-left: 25px; 
            position: relative; 
            color: #cccccc; 
        }
        .features li:before { 
            content: "⚡"; 
            position: absolute; 
            left: 0; 
            color: #00FF7F; 
        }
        .footer { 
            background-color: #0a0a0a; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #333; 
        }
        .footer p { 
            color: #666; 
            font-size: 14px; 
            margin: 5px 0; 
        }
        .social-links { 
            margin: 20px 0; 
        }
        .social-links a { 
            color: #00FF7F; 
            text-decoration: none; 
            margin: 0 15px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 HackCubes</h1>
            <p style="color: #0a0a0a; margin: 10px 0 0 0; font-size: 18px;">Welcome to the Future of Cybersecurity Learning</p>
        </div>
        
        <div class="content">
            <h2>Welcome Aboard, ${name}! 🚀</h2>
            
            <p>Thank you for joining the HackCubes early access community! You're now part of an exclusive group of cybersecurity enthusiasts who will be first to experience our revolutionary platform.</p>
            
            <div class="highlight">
                <p><strong>🎉 You're in!</strong> Your email <strong>${email}</strong> has been successfully added to our early access list.</p>
            </div>
            
            <h3 style="color: #3BE8FF;">What happens next?</h3>
            <ul class="features">
                <li>Get exclusive updates on our development progress</li>
                <li>Be the first to access new features and challenges</li>
                <li>Receive early bird pricing and special offers</li>
                <li>Join our private community of security professionals</li>
                <li>Get beta access before public launch</li>
            </ul>
            
            <h3 style="color: #3BE8FF;">While you wait...</h3>
            <p>Follow us on social media for behind-the-scenes content, cybersecurity tips, and platform updates:</p>
            
            <div class="social-links">
                <a href="https://x.com/hackcubes">Twitter 🐦</a>
                <a href="https://www.linkedin.com/company/hackcubes">LinkedIn 💼</a>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://hackcubes.com/challenge" class="cta-button">
                    Try Our Challenge 🧩
                </a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>HackCubes</strong> - Revolutionizing Cybersecurity Education</p>
            <p>This email was sent to ${email} because you signed up for early access.</p>
            <p>&copy; 2025 HackCubes. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  private generateWaitlistConfirmationEmail(name: string, email: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Challenge Completed - Waitlist Confirmed</title>
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            background-color: #0a0a0a; 
            color: #ffffff; 
        }
        .container { 
            max-width: 600px; 
            margin: 0 auto; 
            background-color: #1a1a1a; 
            border-radius: 8px; 
            overflow: hidden; 
            border: 1px solid #333; 
        }
        .header { 
            background: linear-gradient(135deg, #ff6b35, #f7931e); 
            padding: 40px 30px; 
            text-align: center; 
        }
        .header h1 { 
            margin: 0; 
            font-size: 32px; 
            font-weight: bold; 
            color: #0a0a0a; 
        }
        .content { 
            padding: 40px 30px; 
        }
        .content h2 { 
            color: #00FF7F; 
            font-size: 24px; 
            margin-bottom: 20px; 
        }
        .content p { 
            line-height: 1.6; 
            margin-bottom: 20px; 
            color: #cccccc; 
        }
        .challenge-badge { 
            background: linear-gradient(135deg, #ff6b35, #f7931e); 
            color: #0a0a0a; 
            padding: 20px; 
            text-align: center; 
            border-radius: 10px; 
            margin: 30px 0; 
            font-weight: bold; 
            font-size: 18px; 
        }
        .highlight { 
            background-color: #2a2a2a; 
            border-left: 4px solid #00FF7F; 
            padding: 20px; 
            margin: 20px 0; 
            border-radius: 4px; 
        }
        .cta-button { 
            display: inline-block; 
            background: linear-gradient(135deg, #00FF7F, #3BE8FF); 
            color: #0a0a0a; 
            padding: 15px 30px; 
            text-decoration: none; 
            border-radius: 25px; 
            font-weight: bold; 
            margin: 20px 0; 
            text-align: center; 
        }
        .skills-learned { 
            background-color: #2a2a2a; 
            padding: 25px; 
            border-radius: 8px; 
            margin: 25px 0; 
        }
        .skills-learned h4 { 
            color: #3BE8FF; 
            margin-bottom: 15px; 
        }
        .skills-learned ul { 
            list-style: none; 
            padding: 0; 
        }
        .skills-learned li { 
            margin: 8px 0; 
            padding-left: 25px; 
            position: relative; 
            color: #cccccc; 
        }
        .skills-learned li:before { 
            content: "✓"; 
            position: absolute; 
            left: 0; 
            color: #00FF7F; 
            font-weight: bold; 
        }
        .footer { 
            background-color: #0a0a0a; 
            padding: 30px; 
            text-align: center; 
            border-top: 1px solid #333; 
        }
        .footer p { 
            color: #666; 
            font-size: 14px; 
            margin: 5px 0; 
        }
        .social-links { 
            margin: 20px 0; 
        }
        .social-links a { 
            color: #00FF7F; 
            text-decoration: none; 
            margin: 0 15px; 
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🏆 CHALLENGE COMPLETED!</h1>
            <p style="color: #0a0a0a; margin: 10px 0 0 0; font-size: 18px;">Welcome to the HackCubes Waitlist</p>
        </div>
        
        <div class="content">
            <h2>Impressive work, ${name}! 🎯</h2>
            
            <p>Congratulations on successfully completing the HackCubes invite challenge! You've demonstrated the curiosity, persistence, and technical skills that define a true cybersecurity professional.</p>
            
            <div class="challenge-badge">
                🧩 HackCubes Challenge Solver 🧩<br>
                <span style="font-size: 14px;">Successfully decoded the invite system</span>
            </div>
            
            <div class="highlight">
                <p><strong>🎉 Waitlist Confirmed!</strong> Your email <strong>${email}</strong> has been successfully added to our exclusive waitlist.</p>
            </div>
            
            <div class="skills-learned">
                <h4>Skills you demonstrated in this challenge:</h4>
                <ul>
                    <li>Browser developer tools proficiency</li>
                    <li>JavaScript function discovery and execution</li>
                    <li>Base64 and ROT13 decoding techniques</li>
                    <li>API interaction and HTTP request crafting</li>
                    <li>Problem-solving and lateral thinking</li>
                </ul>
            </div>
            
            <h3 style="color: #3BE8FF;">What's next?</h3>
            <p>As a waitlist member who completed our challenge, you've earned priority access to:</p>
            
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 10px 0; padding-left: 25px; position: relative; color: #cccccc;">
                    <span style="position: absolute; left: 0; color: #00FF7F;">⚡</span>
                    Exclusive beta access before public launch
                </li>
                <li style="margin: 10px 0; padding-left: 25px; position: relative; color: #cccccc;">
                    <span style="position: absolute; left: 0; color: #00FF7F;">⚡</span>
                    Advanced challenge previews and early content
                </li>
                <li style="margin: 10px 0; padding-left: 25px; position: relative; color: #cccccc;">
                    <span style="position: absolute; left: 0; color: #00FF7F;">⚡</span>
                    Special launch pricing and exclusive offers
                </li>
                <li style="margin: 10px 0; padding-left: 25px; position: relative; color: #cccccc;">
                    <span style="position: absolute; left: 0; color: #00FF7F;">⚡</span>
                    Direct access to the HackCubes development team
                </li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://hackcubes.com" class="cta-button">
                    Explore More Challenges 🧩
                </a>
            </div>
            
            <div class="social-links">
                <p>Stay connected for updates:</p>
                <a href="https://x.com/hackcubes">Twitter 🐦</a>
                <a href="https://www.linkedin.com/company/hackcubes">LinkedIn 💼</a>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>HackCubes</strong> - Where Hackers Are Made</p>
            <p>This email was sent to ${email} because you completed our challenge and joined the waitlist.</p>
            <p>&copy; 2025 HackCubes. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
  }
}

export const emailService = EmailService.getInstance();
