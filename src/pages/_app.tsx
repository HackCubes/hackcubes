import type { AppProps } from 'next/app';
import Head from 'next/head';
import '@/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>⚡ HackCubes - Hack Your Way to a Free Cert!</title>
        <meta name="description" content="Gamified cybersecurity platform for hackers, by hackers! First 10 hackers get free entry-level cert. Early adopters: $99 per cert." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="keywords" content="cybersecurity certification, ethical hacking, free cert, gamified learning, CTF challenges, hacker certification, cybersecurity training" />
        <meta name="author" content="HackCubes" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://hackcubes.com/" />
        <meta property="og:title" content="⚡ HackCubes - Hack Your Way to a Free Cert!" />
        <meta property="og:description" content="First 10 hackers get free entry-level cert. Gamified cybersecurity platform for hackers, by hackers!" />
        <meta property="og:image" content="/og-image.jpg" />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content="https://hackcubes.com/" />
        <meta property="twitter:title" content="⚡ HackCubes - Hack Your Way to a Free Cert!" />
        <meta property="twitter:description" content="First 10 hackers get free entry-level cert. Gamified cybersecurity platform for hackers, by hackers!" />
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