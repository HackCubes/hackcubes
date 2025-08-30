import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, Shield, Loader2, CheckCircle, XCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificationId: string;
  certificationName: string;
  amount: number;
  currency: string;
  onSuccess: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentModal({
  isOpen,
  onClose,
  certificationId,
  certificationName,
  amount,
  currency,
  onSuccess,
}: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      setPaymentStatus('processing');
      setErrorMessage('');

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      // Create order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          certificationId,
          userId: 'user', // This will be validated on the server side
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.error || 'Failed to create payment order');
      }

      const orderData = await orderResponse.json();

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: 'HackCubes',
        description: `${certificationName} Certification`,
        order_id: orderData.order.id,
        handler: async (response: RazorpayResponse) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                certificationId,
                amount,
                currency,
              }),
            });

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || 'Payment verification failed');
            }

            const verifyData = await verifyResponse.json();
            
            if (verifyData.success) {
              setPaymentStatus('success');
              setTimeout(() => {
                onSuccess();
                onClose();
              }, 2000);
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentStatus('error');
            setErrorMessage(error instanceof Error ? error.message : 'Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#00ff88', // neon-green
        },
        modal: {
          ondismiss: () => {
            setIsProcessing(false);
            setPaymentStatus('idle');
          },
        },
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Payment failed');
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-dark-secondary border border-gray-border rounded-lg p-8 max-w-md w-full mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Purchase Certification</h2>
              <p className="text-gray-400 text-sm">{certificationName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            disabled={isProcessing}
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Payment Status */}
        {paymentStatus === 'success' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <CheckCircle className="w-16 h-16 text-neon-green mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
            <p className="text-gray-300">
              You now have access to the {certificationName} certification exam.
            </p>
          </motion.div>
        )}

        {paymentStatus === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-8"
          >
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Payment Failed</h3>
            <p className="text-gray-300 mb-4">{errorMessage}</p>
            <button
              onClick={() => {
                setPaymentStatus('idle');
                setErrorMessage('');
              }}
              className="px-4 py-2 bg-neon-green text-dark-bg font-semibold rounded-lg hover:bg-green-500 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}

        {paymentStatus === 'idle' && (
          <>
            {/* Price Display */}
            <div className="bg-dark-bg/50 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-300">Certification Price</span>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-5 h-5 text-neon-green" />
                  <span className="text-2xl font-bold text-white">
                    {currency === 'INR' ? '₹' : '$'}{amount}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Base Price</span>
                  <span>{currency === 'INR' ? '₹' : '$'}{amount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee</span>
                  <span>Included</span>
                </div>
                <hr className="border-gray-600 my-2" />
                <div className="flex justify-between font-semibold text-white">
                  <span>Total</span>
                  <span>{currency === 'INR' ? '₹' : '$'}{amount}</span>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="mb-6">
              <h4 className="text-white font-semibold mb-3">What you get:</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>24-hour practical exam access</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>Professional certification upon passing</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>Lifetime certificate validity</span>
                </li>
                <li className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-neon-green rounded-full"></div>
                  <span>Industry-recognized credentials</span>
                </li>
              </ul>
            </div>

            {/* Payment Button */}
            <button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full py-3 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-bold rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-5 h-5" />
                  <span>Pay Now</span>
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              Secure payment powered by Razorpay. Your payment information is encrypted and secure.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
