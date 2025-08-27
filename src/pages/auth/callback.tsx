"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@/lib/supabase/client';

export default function AuthCallback() {
  const router = useRouter();
  const supabase = createClient();
  const [message, setMessage] = useState('Completing sign-in...');

  useEffect(() => {
    const run = async () => {
      try {
        // Prefer "next" query param if present
        const search = new URLSearchParams(window.location.search);
        const next = search.get('next') || '/dashboard';
        const code = search.get('code');

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          await router.replace(next);
          return;
        }

        // Handle magic link style: tokens in the URL hash
        if (window.location.hash) {
          const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
          const access_token = hash.get('access_token');
          const refresh_token = hash.get('refresh_token');

          if (access_token && refresh_token) {
            const { error } = await supabase.auth.setSession({ access_token, refresh_token });
            if (error) throw error;
            await router.replace(next);
            return;
          }
        }

        setMessage('Invalid or expired link. Please try signing in again.');
      } catch (err) {
        console.error('Auth callback error:', err);
        setMessage('Something went wrong. Please try signing in again.');
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg text-white">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gray-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-300">{message}</p>
      </div>
    </div>
  );
}
