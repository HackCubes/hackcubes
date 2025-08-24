# 📧 Email Setup Guide for HackCubes

This guide explains how to set up automatic acknowledgment emails for your HackCubes signup forms.

## Overview

Your application has two signup forms that will automatically send emails:

1. **Early Joiners Form** → Sends a welcome email
2. **Waitlist Form** (after challenge) → Sends a challenge completion confirmation email

## Option 1: Using Resend (Recommended)

[Resend](https://resend.com) is a modern email service that's perfect for developers.

### 1. Create a Resend Account
1. Go to [resend.com](https://resend.com)
2. Sign up for a free account (100 emails/day free)
3. Verify your account

### 2. Get Your API Key
1. In the Resend dashboard, go to **API Keys**
2. Click **Create API Key**
3. Give it a name like "HackCubes Production"
4. Copy the API key (starts with `re_`)

### 3. Set Up Your Domain (Optional but Recommended)
1. Go to **Domains** in Resend dashboard
2. Add your domain (e.g., `hackcubes.com`)
3. Add the required DNS records to your domain provider
4. Wait for verification (usually 5-10 minutes)

### 4. Update Environment Variables
Add to your `.env.local` file:

```bash
# Resend Email Configuration
RESEND_API_KEY=re_your-actual-api-key-here
FROM_EMAIL=HackCubes <noreply@yourdomain.com>
```

If you haven't set up a custom domain, use:
```bash
FROM_EMAIL=HackCubes <onboarding@resend.dev>
```

## Option 2: Using SMTP (Gmail, Outlook, etc.)

If you prefer using your existing email provider:

### For Gmail:
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Add to `.env.local`:

```bash
# SMTP Configuration for Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
FROM_EMAIL=HackCubes <your-email@gmail.com>
```

### For Outlook:
```bash
# SMTP Configuration for Outlook
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASSWORD=your-password
FROM_EMAIL=HackCubes <your-email@outlook.com>
```

## Testing the Email System

### 1. Development Testing
If no email service is configured, the system will log email information to the console without actually sending emails.

### 2. Test Email Sending
Create a test script to verify your email setup:

```bash
# Test the early joiners signup
curl -X POST http://localhost:3000/api/early-joiners \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'
```

### 3. Check Logs
Look in your server console for:
- ✅ Email sent successfully
- ❌ Email service errors
- 📧 Email service not configured (development mode)

## Email Templates

The system includes two beautifully designed email templates:

### Early Joiners Welcome Email
- **Subject**: "🎯 Welcome to HackCubes - Early Access Confirmed!"
- **Content**: Welcome message with platform features and social links
- **Design**: HackCubes-themed with gradient headers and cybersecurity styling

### Waitlist Confirmation Email  
- **Subject**: "🎉 HackCubes Waitlist - Challenge Completed!"
- **Content**: Challenge completion celebration with skills demonstrated
- **Design**: Achievement-focused with challenge badge and next steps

## Troubleshooting

### Common Issues:

1. **"Email service not configured"**
   - Check your environment variables are set correctly
   - Restart your development server after adding env vars

2. **Resend API errors**
   - Verify your API key is correct
   - Check if you've exceeded the free tier limit (100 emails/day)
   - Ensure your FROM_EMAIL domain is verified

3. **SMTP authentication errors**
   - For Gmail: Make sure you're using App Password, not regular password
   - Check SMTP host and port settings
   - Verify 2FA is enabled for Gmail

4. **Emails going to spam**
   - Set up proper SPF/DKIM records (Resend helps with this)
   - Use a verified domain
   - Avoid spam trigger words in subject lines

### Testing Commands:

```bash
# Test Resend connection
node -e "
const { Resend } = require('resend');
const resend = new Resend('your-api-key');
resend.emails.send({
  from: 'onboarding@resend.dev',
  to: 'your-email@example.com',
  subject: 'Test Email',
  html: '<p>Test successful!</p>'
}).then(console.log).catch(console.error);
"
```

## Production Deployment

### Environment Variables for Production:
Make sure to set these in your production environment (Vercel, Netlify, etc.):

```bash
RESEND_API_KEY=your-production-api-key
FROM_EMAIL=HackCubes <noreply@hackcubes.com>
```

### Email Analytics:
Resend provides detailed analytics:
- Delivery rates
- Open rates  
- Click tracking
- Bounce handling

## Customizing Email Templates

Email templates are in `src/lib/email/service.ts`. To customize:

1. Edit the HTML in `generateEarlyJoinerWelcomeEmail()` or `generateWaitlistConfirmationEmail()`
2. Update styling, colors, or content as needed
3. Test thoroughly before deploying

## Support

- **Resend Documentation**: [resend.com/docs](https://resend.com/docs)
- **Nodemailer Documentation**: [nodemailer.com](https://nodemailer.com)
- **Gmail App Passwords**: [support.google.com](https://support.google.com/accounts/answer/185833)

---

**Need Help?** Check the console logs first, then refer to your email provider's documentation for specific SMTP settings.
