'use client';

import dynamic from 'next/dynamic';

export const DynamicMatrix = dynamic(
  () => import('./MatrixBackground').then((mod) => mod.MatrixBackground),
  { ssr: false }
);