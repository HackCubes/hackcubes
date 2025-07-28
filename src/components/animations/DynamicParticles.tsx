'use client';

import dynamic from 'next/dynamic';

export const DynamicParticles = dynamic(
  () => import('./FloatingParticles').then((mod) => mod.FloatingParticles),
  { ssr: false }
);