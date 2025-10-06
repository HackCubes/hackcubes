import Head from 'next/head';
import { Footer } from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy | HackCubes</title>
        <meta name="description" content="Privacy Policy for HackCubes platform." />
      </Head>
      <main className="min-h-screen bg-dark-bg text-gray-200">
        <div className="max-w-4xl mx-auto px-4 pt-32 pb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-green to-electric-blue bg-clip-text text-transparent">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: 6/16/2025</p>

            <p className="mb-6 leading-relaxed">This Privacy Policy governs how we collect, use, share, and protect personal data.</p>

          <ol className="space-y-6 list-decimal list-inside">
            <li>
              <p className="font-semibold text-white">Collection</p>
              <p className="text-gray-300 mt-1">We collect data during registration, use, and interaction with the Platform.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Usage</p>
              <p className="text-gray-300 mt-1">Data is used to provide services, improve offerings, resolve issues, and conduct marketing.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Sharing</p>
              <p className="text-gray-300 mt-1">We may share data with affiliates, partners, or law enforcement where legally required.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Security</p>
              <p className="text-gray-300 mt-1">We use reasonable measures to protect data but cannot guarantee complete security.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Data Retention</p>
              <p className="text-gray-300 mt-1">Data is retained as long as needed or required by law.</p>
            </li>
            <li>
              <p className="font-semibold text-white">User Rights</p>
              <p className="text-gray-300 mt-1">Users may access, update, or delete their data via their account or by request.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Consent</p>
              <p className="text-gray-300 mt-1">By using the Platform, you consent to data processing as per this policy.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Withdrawal</p>
              <p className="text-gray-300 mt-1">Consent can be withdrawn by contacting the Grievance Officer.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Changes</p>
              <p className="text-gray-300 mt-1">We may revise this policy and will notify users as needed.</p>
            </li>
          </ol>

          <div className="mt-12">
            <h2 className="text-2xl font-semibold mb-4">Grievance Officer</h2>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li><span className="font-medium text-white">Name:</span> Devansh Bordia</li>
              <li><span className="font-medium text-white">Designation:</span> Director</li>
              <li><span className="font-medium text-white">Address:</span> 46 B Uniara Garden Near Tri Murti Circle, Opp Govind Marg, Jaipur, Rajasthan, India</li>
              <li><span className="font-medium text-white">Phone:</span> 8058591718</li>
              <li><span className="font-medium text-white">Email:</span> <a href="mailto:support@hackcubes.com" className="text-neon-green hover:underline">support@hackcubes.com</a></li>
              <li><span className="font-medium text-white">Hours:</span> Monday to Friday, 9:00 AM to 6:00 PM</li>
            </ul>
          </div>

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
