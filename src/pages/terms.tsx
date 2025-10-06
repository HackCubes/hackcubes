import Head from 'next/head';
import { Footer } from '@/components/Footer';

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms and Conditions | HackCubes</title>
        <meta name="description" content="Terms and Conditions for use of the HackCubes platform." />
      </Head>
      <main className="min-h-screen bg-dark-bg text-gray-200">
        <div className="max-w-4xl mx-auto px-4 pt-32 pb-16">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-neon-green to-electric-blue bg-clip-text text-transparent">Terms and Conditions</h1>
          <p className="text-sm text-gray-400 mb-10">Last updated: 6/16/2025</p>

          <p className="mb-6 leading-relaxed">This document is an electronic record under the Information Technology Act, 2000. By using <a href="https://hackcubes.com" className="text-neon-green hover:underline">https://hackcubes.com</a>, you agree to these Terms and Conditions.</p>

          <ol className="space-y-6 list-decimal list-inside">
            <li>
              <p className="font-semibold text-white">Use of Platform</p>
              <p className="text-gray-300 mt-1">Access and use are subject to truthfulness of information and lawful conduct.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Accuracy of Information</p>
              <p className="text-gray-300 mt-1">We make no warranties on accuracy and are not liable for inaccuracies.</p>
            </li>
            <li>
              <p className="font-semibold text-white">User Responsibility</p>
              <p className="text-gray-300 mt-1">Use the Services at your sole discretion and risk.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Intellectual Property</p>
              <p className="text-gray-300 mt-1">All content is proprietary to Hirelyst.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Legal Use</p>
              <p className="text-gray-300 mt-1">You agree not to use the Platform for illegal purposes.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Third-Party Links</p>
              <p className="text-gray-300 mt-1">External links are for convenience; we are not liable for their content.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Binding Agreement</p>
              <p className="text-gray-300 mt-1">Using the Platform forms a binding contract.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Indemnity</p>
              <p className="text-gray-300 mt-1">You shall indemnify Hirelyst against all third-party claims.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Force Majeure</p>
              <p className="text-gray-300 mt-1">We are not liable for events beyond our control.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Governing Law</p>
              <p className="text-gray-300 mt-1">Laws of India apply; Jaipur courts have exclusive jurisdiction.</p>
            </li>
            <li>
              <p className="font-semibold text-white">Communication</p>
              <p className="text-gray-300 mt-1">Contact us through the details below for queries or disputes.</p>
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
