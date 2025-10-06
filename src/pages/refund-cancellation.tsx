import Head from 'next/head';
import { Footer } from '@/components/Footer';

export default function RefundCancellationPage() {
  return (
    <>
      <Head>
        <title>Refund & Cancellation Policy | HackCubes</title>
        <meta name="description" content="Refund and Cancellation Policy for HackCubes." />
      </Head>
      <main className="min-h-screen bg-dark-bg text-gray-200">
        <div className="max-w-4xl mx-auto px-4 pt-32 pb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-green to-electric-blue bg-clip-text text-transparent">Refund & Cancellation Policy</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: 6/16/2025</p>

          <ol className="space-y-6 list-decimal list-inside">
            <li>
              <p className="font-semibold text-white">No Refunds</p>
              <p className="text-gray-300 mt-1">All payments made to HACKRUIT SECURITY HIRING PRIVATE LIMITED are final and non-refundable.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Cancellation</p>
              <p className="text-gray-300 mt-1">Customers may cancel their subscriptions at any time through the platform interface or by contacting support.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Post-Cancellation Access</p>
              <p className="text-gray-300 mt-1">Upon cancellation, users will continue to have access to their services and remaining credits until the expiration date, typically one year from purchase.</p>
            </li>
            <li>
              <p className="font-semibold text-white">No Prorated Refunds</p>
              <p className="text-gray-300 mt-1">We do not provide refunds or credits for any partial subscription periods or unused services.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Discretionary Exceptions</p>
              <p className="text-gray-300 mt-1">Any exception to this policy is at the sole discretion of the company and must be documented in writing.</p>
            </li>
          </ol>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Company Information</h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><span className="font-medium text-white">Company Name:</span> HACKRUIT SECURITY HIRING PRIVATE LIMITED</li>
              <li><span className="font-medium text-white">Name:</span> DEVANSH BORDIA</li>
              <li><span className="font-medium text-white">Office Address:</span> 46 B Uniara Garden Near Tri Murti Circle, Opp Govind Marg, Jaipur, Rajasthan, India</li>
              <li><span className="font-medium text-white">GSTIN:</span> 08AAHCH7084F1ZC</li>
              <li><span className="font-medium text-white">Email:</span> <a href="mailto:support@hackcubes.com" className="text-neon-green hover:underline">support@hackcubes.com</a></li>
              <li><span className="font-medium text-white">Mobile No:</span> 8058591718</li>
            </ul>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
}
