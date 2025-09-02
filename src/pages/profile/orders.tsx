import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Shield, DollarSign, Calendar, FileText, ExternalLink, ArrowLeft, Package, Receipt } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface Order {
  id: string;
  certification_id: string;
  certificationName: string;
  certificationDescription: string;
  order_id: string;
  payment_id: string;
  amount: number;
  currency: string;
  formattedAmount: string;
  status: string;
  purchased_at: string;
  purchaseDate: string;
}

export default function OrdersPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/signin?redirect=/profile/orders');
          return;
        }
        setUser(user);

        // Fetch orders
        const response = await fetch('/api/profile/orders');
        if (!response.ok) {
          throw new Error('Failed to fetch orders');
        }

        const data = await response.json();
        setOrders(data.orders || []);
      } catch (err) {
        console.error('Error loading orders:', err);
        setError(err instanceof Error ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [supabase, router]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'text-neon-green bg-neon-green/20';
      case 'pending': return 'text-yellow-400 bg-yellow-400/20';
      case 'failed': return 'text-red-400 bg-red-400/20';
      default: return 'text-gray-400 bg-gray-400/20';
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-neon-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-300">Loading your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-bg text-white">
      {/* Navigation */}
      <nav className="bg-dark-secondary border-b border-gray-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-neon-green">
                HackCubes
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/challenges" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Challenges
              </Link>
              <Link href="/certification" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Certifications
              </Link>
              <Link href="/profile" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                Profile
              </Link>
              <button onClick={handleLogout} className="ml-2 text-gray-300 hover:text-white px-3 py-2 border border-gray-700 rounded-md text-sm font-medium">
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/profile" className="inline-flex items-center text-gray-400 hover:text-white mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Link>
          
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-lg flex items-center justify-center">
              <Receipt className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Order History</h1>
              <p className="text-gray-400">View your certification purchases and order details</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Orders Yet</h3>
            <p className="text-gray-400 mb-6">You haven't purchased any certifications yet.</p>
            <Link href="/certification">
              <button className="px-6 py-3 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-semibold rounded-lg hover:scale-105 transition-all duration-300">
                Browse Certifications
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-dark-secondary border border-gray-border rounded-lg p-6 hover:border-neon-green/30 transition-colors"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                  {/* Order Info */}
                  <div className="flex-1">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-neon-green/20 to-electric-blue/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-neon-green" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-white">{order.certificationName}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-400 mb-3">{order.certificationDescription}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">Purchased: {order.purchaseDate}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">Amount: {order.formattedAmount}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300 font-mono text-xs">Order: {order.order_id}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300 font-mono text-xs">Payment: {order.payment_id}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2">
                    {order.status === 'completed' && order.certification_id === 'hcjpt' && (
                      <Link href="/assessments/533d4e96-fe35-4540-9798-162b3f261572">
                        <button className="w-full lg:w-auto px-4 py-2 bg-gradient-to-r from-neon-green to-green-500 text-dark-bg font-semibold rounded-lg hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2">
                          <span>Start Assessment</span>
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </Link>
                    )}
                    <Link href="/certification">
                      <button className="w-full lg:w-auto px-4 py-2 border border-gray-border text-gray-300 rounded-lg hover:bg-dark-bg transition-colors text-center">
                        View Certification
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Summary */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 bg-dark-secondary/50 border border-gray-border rounded-lg p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-neon-green">{orders.length}</div>
                <div className="text-gray-400 text-sm">Total Orders</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-green">
                  {orders.filter(o => o.status === 'completed').length}
                </div>
                <div className="text-gray-400 text-sm">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-neon-green">
                  {orders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)}
                </div>
                <div className="text-gray-400 text-sm">Total Spent ({orders[0]?.currency || 'INR'})</div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
} 