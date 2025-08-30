# Razorpay Payment Integration for HJCPT Certification

This document explains the payment integration setup for the HackCubes HJCPT certification using Razorpay.

## 🚀 Features

- **Secure Payment Processing**: Integration with Razorpay for secure payment handling
- **Payment Verification**: Server-side payment signature verification
- **Automatic Enrollment**: Users are automatically enrolled in HJCPT exam after successful payment
- **Payment History**: Track all payments and certification purchases
- **User Authentication**: Only authenticated users can make purchases
- **Responsive Design**: Mobile-friendly payment modal

## 📋 Prerequisites

1. **Razorpay Account**: You need a Razorpay account with API keys
2. **Environment Variables**: Razorpay keys must be configured in `.env.local`
3. **Database Tables**: Payment-related tables must be created in Supabase

## 🔧 Setup Instructions

### 1. Database Setup

First, you need to create the payment tables in your Supabase database:

1. Open your Supabase dashboard
2. Navigate to SQL Editor → New query
3. Copy and paste the contents of `payment-tables-setup.sql`
4. Click "Run" to execute the SQL

Or run the setup script:
```bash
node setup-payment-tables.js
```

### 2. Environment Variables

Ensure these variables are set in your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
```

### 3. Dependencies

The following packages are required:
- `razorpay`: For server-side payment processing
- `crypto`: For payment signature verification (built-in Node.js module)

## 🏗️ Architecture

### API Routes

1. **`/api/payments/create-order`** (POST)
   - Creates a new payment order in Razorpay
   - Stores order details in database
   - Returns order information for frontend

2. **`/api/payments/verify`** (POST)
   - Verifies payment signature from Razorpay
   - Grants certification access upon successful verification
   - Updates payment status in database

3. **`/api/payments/status`** (GET)
   - Checks payment status and certification access
   - Returns user's payment history

### Database Tables

1. **`payment_orders`**
   - Stores Razorpay order information
   - Tracks payment status
   - Links orders to users and certifications

2. **`certification_purchases`**
   - Records completed purchases
   - Stores purchase metadata
   - Enables purchase history tracking

### Components

1. **`PaymentModal`**
   - Handles payment UI
   - Integrates with Razorpay checkout
   - Manages payment states and feedback

## 🔄 Payment Flow

1. **User clicks "Buy Now"** on HJCPT certification page
2. **Authentication check**: Redirects to login if not authenticated
3. **Payment modal opens** with certification details
4. **Order creation**: Frontend calls `/api/payments/create-order`
5. **Razorpay checkout**: User completes payment on Razorpay
6. **Payment verification**: Razorpay callback triggers verification
7. **Access granted**: User gets assessment invitation on success
8. **Redirect to exam**: User can now start the HJCPT exam

## 🔒 Security Features

- **Server-side verification**: All payments verified server-side
- **Signature validation**: Razorpay signatures validated using webhook secret
- **Row Level Security**: Database policies restrict access to user's own data
- **Authentication required**: All payment operations require valid user session

## 📱 Usage

### For Users

1. Navigate to `/certification/hcjpt` or `/certification`
2. Click "Buy Now - $100" for HJCPT certification
3. Complete payment through Razorpay checkout
4. Automatically redirected to exam upon successful payment

### For Developers

```typescript
// Import the payment modal
import { PaymentModal } from '@/components/payments';

// Use in your component
<PaymentModal
  isOpen={isPaymentModalOpen}
  onClose={() => setIsPaymentModalOpen(false)}
  certificationId="hcjpt"
  certificationName="HCJPT"
  amount={100}
  currency="USD"
  onSuccess={handlePaymentSuccess}
/>
```

## 🧪 Testing

### Test Card Details (Razorpay Test Mode)

- **Card Number**: 4111 1111 1111 1111
- **Expiry**: Any future date
- **CVV**: Any 3 digits
- **Name**: Any name

### Test Scenarios

1. **Successful Payment**: Use test card for successful payment flow
2. **Failed Payment**: Use invalid card details to test failure handling
3. **Authentication**: Test without login to verify redirect
4. **Duplicate Purchase**: Test buying same certification twice

## 🔍 Monitoring

### Database Queries

```sql
-- Check payment orders
SELECT * FROM payment_orders WHERE user_email = 'user@example.com';

-- Check certification purchases
SELECT * FROM certification_purchases WHERE user_email = 'user@example.com';

-- Check assessment invitations
SELECT * FROM assessment_invitations WHERE email = 'user@example.com';
```

### Logs

Monitor application logs for:
- Payment creation errors
- Verification failures
- Database insertion issues
- Authentication problems

## 🐛 Troubleshooting

### Common Issues

1. **"Payment verification failed"**
   - Check webhook secret configuration
   - Verify Razorpay signature calculation

2. **"Failed to grant certification access"**
   - Check assessment_invitations table structure
   - Verify HJCPT_ASSESSMENT_ID is correct

3. **"Authentication required"**
   - Ensure user is logged in
   - Check Supabase session validity

4. **Database errors**
   - Verify payment tables are created
   - Check RLS policies are properly configured

### Debug Mode

Enable debug logging by adding to your API routes:
```typescript
console.log('Payment debug:', { orderId, userId, certificationId });
```

## 📞 Support

For issues with:
- **Razorpay Integration**: Check Razorpay documentation
- **Database Issues**: Verify Supabase setup
- **Authentication**: Check Supabase auth configuration
- **Frontend Issues**: Ensure all components are properly imported

## 🔄 Future Enhancements

- [ ] Multiple payment methods (PayPal, Stripe)
- [ ] Subscription-based certifications
- [ ] Discount codes and coupons
- [ ] Bulk purchase options
- [ ] Payment analytics dashboard
- [ ] Automated refund processing

---

**Note**: This integration is currently configured for HJCPT certification at $100 USD. To add more certifications, update the certification configurations in the relevant components and API routes.
