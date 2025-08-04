'use client';

import { useState } from 'react';
import { useWaitlist } from '@/hooks/useWaitlist';

interface WaitlistFormProps {
  inviteCode?: string;
  candidateEmail?: string;
}

export default function WaitlistForm({ inviteCode, candidateEmail }: WaitlistFormProps) {
  const [formData, setFormData] = useState({
    email: candidateEmail || '',
    name: '',
    company: '',
    role: '',
    referralSource: '',
  });

  const { signup, isLoading, error, success, reset } = useWaitlist();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await signup({
      email: formData.email,
      name: formData.name || undefined,
      company: formData.company || undefined,
      role: formData.role || undefined,
      referral_source: formData.referralSource || undefined,
      interest_level: 'high',
      inviteCode: inviteCode,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto p-6 bg-green-900/20 border border-green-700 rounded-lg">
        <h3 className="text-lg font-semibold text-green-400 mb-2">
          🎉 You're on the waitlist!
        </h3>
        <p className="text-green-300 mb-4">
          Thanks for joining! We'll notify you when HackCubes is ready.
        </p>
        <button
          onClick={reset}
          className="text-green-400 hover:text-green-300 underline"
        >
          Join another email
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900/50 backdrop-blur-sm border border-gray-700 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-white mb-2">
        Join the HackCubes Waitlist
      </h2>
      <p className="text-gray-300 mb-6">
        Be the first to know when we launch our revolutionary platform.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formData.email}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="your.email@example.com"
          />
        </div>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="John Doe"
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-1">
            Company
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={formData.company}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Acme Inc"
          />
        </div>

        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-300 mb-1">
            Role
          </label>
          <input
            type="text"
            id="role"
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Software Engineer"
          />
        </div>

        <div>
          <label htmlFor="referralSource" className="block text-sm font-medium text-gray-300 mb-1">
            How did you hear about us?
          </label>
          <select
            id="referralSource"
            name="referralSource"
            value={formData.referralSource}
            onChange={handleInputChange}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select an option</option>
            <option value="twitter">Twitter</option>
            <option value="linkedin">LinkedIn</option>
            <option value="github">GitHub</option>
            <option value="friend">Friend/Colleague</option>
            <option value="search">Search Engine</option>
            <option value="other">Other</option>
          </select>
        </div>

        {error && (
          <div className="p-3 bg-red-900/20 border border-red-700 rounded-md">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          {isLoading ? 'Joining...' : 'Join Waitlist'}
        </button>
      </form>

      <p className="text-xs text-gray-400 mt-4 text-center">
        We respect your privacy. No spam, ever.
      </p>
    </div>
  );
}