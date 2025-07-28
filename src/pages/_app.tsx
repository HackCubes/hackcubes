import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>HackCubes - Master Cybersecurity</title>
        <meta name="description" content="The premier cybersecurity learning platform. Master ethical hacking, penetration testing, and security analysis through hands-on labs and real-world scenarios." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="cybersecurity, ethical hacking, penetration testing, CTF, security training, cyber education" />
        <meta name="author" content="HackCubes" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hackcubes.com/" />
        <meta property="og:title" content="HackCubes - Master Cybersecurity" />
        <meta property="og:description" content="The premier cybersecurity learning platform with hands-on labs and CTF challenges." />
        <meta property="og:image" content="/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://hackcubes.com/" />
        <meta property="twitter:title" content="HackCubes - Master Cybersecurity" />
        <meta property="twitter:description" content="The premier cybersecurity learning platform with hands-on labs and CTF challenges." />
        <meta property="twitter:image" content="/og-image.jpg" />

        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Preconnect to external resources */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}