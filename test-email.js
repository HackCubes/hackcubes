#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' });

async function testEmailService() {
  console.log('📧 Testing Email Service Configuration\n');

  const resendKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const fromEmail = process.env.FROM_EMAIL;

  console.log('🔍 Checking configuration...');
  console.log(`   FROM_EMAIL: ${fromEmail || '❌ Not set'}`);
  console.log(`   RESEND_API_KEY: ${resendKey ? '✅ Set' : '❌ Not set'}`);
  console.log(`   SMTP_HOST: ${smtpHost || '❌ Not set'}\n`);

  if (!resendKey && !smtpHost) {
    console.log('⚠️  No email service configured');
    console.log('   Emails will be logged to console in development mode');
    console.log('\n📋 To set up emails:');
    console.log('   1. Copy .env.example to .env.local');
    console.log('   2. Add your email service credentials');
    console.log('   3. See EMAIL_SETUP_GUIDE.md for detailed instructions\n');
    return;
  }

  try {
    // Test Resend if configured
    if (resendKey) {
      console.log('🧪 Testing Resend configuration...');
      const { Resend } = require('resend');
      const resend = new Resend(resendKey);
      
      // Just verify the key format
      if (resendKey.startsWith('re_')) {
        console.log('✅ Resend API key format looks correct');
      } else {
        console.log('❌ Resend API key format incorrect (should start with "re_")');
      }
    }

    // Test SMTP if configured
    if (smtpHost) {
      console.log('🧪 Testing SMTP configuration...');
      const nodemailer = require('nodemailer');
      
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      });

      await transporter.verify();
      console.log('✅ SMTP connection verified');
    }

    console.log('\n✅ Email service configuration looks good!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Start your dev server: npm run dev');
    console.log('   2. Test signup forms at:');
    console.log('      - Early joiners: http://localhost:3000/#signup');
    console.log('      - Waitlist: http://localhost:3000/challenge');
    console.log('   3. Check console logs for email confirmations\n');

  } catch (error) {
    console.log('❌ Email service test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check your credentials are correct');
    console.log('   - For Gmail: Use App Password, not regular password');
    console.log('   - For Resend: Ensure API key is valid');
    console.log('   - See EMAIL_SETUP_GUIDE.md for detailed help\n');
  }
}

async function testEmailTemplates() {
  console.log('📧 Testing Email Templates...\n');
  
  try {
    const { emailService } = require('./src/lib/email/service');
    
    console.log('🎨 Early Joiner Welcome Email:');
    const earlyJoinerResult = await emailService.sendEarlyJoinerWelcome(
      'test@example.com', 
      'Test User'
    );
    console.log('   Result:', earlyJoinerResult.success ? '✅ Success' : `❌ ${earlyJoinerResult.error}`);

    console.log('\n🎨 Waitlist Confirmation Email:');
    const waitlistResult = await emailService.sendWaitlistConfirmation(
      'test@example.com', 
      'Challenge Solver'
    );
    console.log('   Result:', waitlistResult.success ? '✅ Success' : `❌ ${waitlistResult.error}`);
    
  } catch (error) {
    console.log('❌ Email template test failed:', error.message);
  }
}

async function main() {
  const command = process.argv[2];
  
  if (command === 'templates') {
    await testEmailTemplates();
  } else {
    await testEmailService();
  }
}

main().catch(console.error);
