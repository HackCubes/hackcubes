import React from 'react';
import Head from 'next/head';
import { Footer } from '@/components/Footer';
import { Mail, Phone, MapPin } from 'lucide-react';

const ContactUsPage: React.FC = () => {
  return (
    <>
      <Head>
        <title>Contact Us | HackCubes</title>
        <meta name="description" content="Get in touch with HackCubes. Email, phone, and physical address details." />
      </Head>
      <main className="min-h-screen bg-dark-bg text-white">
        <div className="max-w-5xl mx-auto px-4 pt-32 pb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-neon-green to-electric-blue bg-clip-text text-transparent">Contact Us</h1>
          <p className="text-gray-300 text-lg max-w-2xl mb-12 leading-relaxed">
            We&apos;re here to help. Reach out to us through any of the channels below and our team will get back to you as soon as possible.
          </p>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="p-6 rounded-xl border border-gray-border bg-dark-secondary/60 backdrop-blur-sm hover:border-neon-green/50 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Mail size={20} className="text-neon-green" />
                <h2 className="text-xl font-semibold">Email</h2>
              </div>
              <p className="text-gray-400 text-sm mb-3">For general inquiries, please email us at:</p>
              <a href="mailto:support@hackcubes.com" className="text-neon-green hover:underline break-all">
                support@hackcubes.com
              </a>
            </div>

            <div className="p-6 rounded-xl border border-gray-border bg-dark-secondary/60 backdrop-blur-sm hover:border-neon-green/50 transition-colors duration-300">
              <div className="flex items-center gap-3 mb-4">
                <Phone size={20} className="text-electric-blue" />
                <h2 className="text-xl font-semibold">Phone</h2>
              </div>
              <p className="text-gray-400 text-sm mb-3">You can reach us by phone at:</p>
              <p className="text-gray-200 font-medium">+91 8058591718</p>
            </div>

            <div className="p-6 rounded-xl border border-gray-border bg-dark-secondary/60 backdrop-blur-sm hover:border-neon-green/50 transition-colors duration-300 md:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <MapPin size={20} className="text-neon-green" />
                <h2 className="text-xl font-semibold">Address</h2>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">
                HACKRUIT SECURITY HIRING PRIVATE LIMITED<br />
                46 B Uniara Garden Near Tri Murti Circle<br />
                Opp Govind Marg, Jaipur, Rajasthan, India
              </p>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </>
  );
};

export default ContactUsPage;
