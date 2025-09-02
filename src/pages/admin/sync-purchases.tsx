// ADMIN ONLY PAGE - FUNCTIONALITY DISABLED FOR SECURITY
// This page allows syncing payment orders to certification purchases
// Only enable when needed for maintenance/debugging

import React from 'react';

// Placeholder component to prevent build errors
export default function SyncPurchasesPage() {
  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-400 mb-4">Page Temporarily Disabled</h1>
        <p className="text-gray-500">This admin function is currently disabled for security.</p>
      </div>
    </div>
  );
}

/* COMMENTED OUT - ADMIN SYNC FUNCTIONALITY
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { RefreshCw, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';

export default function SyncPurchasesPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSync = async () => {
    try {
      setLoading(true);
      setError('');
      setResult(null);

      const response = await fetch('/api/admin/sync-purchases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Sync failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      <nav className="bg-dark-secondary border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-neon-green">
                HackCubes
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Admin Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/admin" className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-lg flex items-center justify-center">
              <RefreshCw className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Sync Purchases</h1>
              <p className="text-gray-400">Sync completed payment orders to certification purchases table</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-secondary border border-gray-border rounded-lg p-6 mb-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Sync Payment Orders</h3>
          <p className="text-gray-300 mb-6">
            This will sync all completed payment orders from the payment_orders table to the certification_purchases table.
            This is useful when payments were completed but the purchase records weren't created properly.
          </p>

          <button
            onClick={handleSync}
            disabled={loading}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-semibold rounded-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Start Sync'}</span>
          </button>
        </motion.div>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-dark-secondary border border-gray-border rounded-lg p-6 mb-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircle className="w-6 h-6 text-neon-green" />
              <h3 className="text-lg font-semibold text-white">Sync Results</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Message:</span>
                <span className="text-white font-medium">{result.message}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Records Synced:</span>
                <span className="text-neon-green font-medium">{result.synced}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Total Orders Processed:</span>
                <span className="text-white font-medium">{result.total_orders}</span>
              </div>
              
              {result.errors && result.errors.length > 0 && (
                <div className="mt-4 p-4 bg-red-500/20 border border-red-500 rounded-lg">
                  <h4 className="text-red-400 font-medium mb-2">Errors:</h4>
                  <ul className="space-y-1">
                    {result.errors.map((err: any, index: number) => (
                      <li key={index} className="text-red-300 text-sm">
                        Order {err.order_id}: {err.error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-gray-border">
              <Link href="/profile/orders">
                <button className="px-4 py-2 bg-electric-blue text-white rounded-lg hover:bg-electric-blue/80 transition-colors">
                  View Orders Page
                </button>
              </Link>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/20 border border-red-500 rounded-lg p-6"
          >
            <div className="flex items-center space-x-3 mb-2">
              <XCircle className="w-6 h-6 text-red-400" />
              <h3 className="text-lg font-semibold text-white">Sync Error</h3>
            </div>
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-dark-secondary/50 border border-gray-border rounded-lg p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>
          <div className="space-y-2 text-sm">
            <p className="text-gray-300">
              <span className="text-gray-400">Orders Page:</span>{' '}
              <Link href="/profile/orders" className="text-electric-blue hover:underline">
                /profile/orders
              </Link>
            </p>
            <p className="text-gray-300">
              <span className="text-gray-400">Admin Enrollments:</span>{' '}
              <Link href="/admin/enrollments" className="text-electric-blue hover:underline">
                /admin/enrollments
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
*/ 