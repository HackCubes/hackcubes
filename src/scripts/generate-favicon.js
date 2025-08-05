// Run this script with Node.js to generate favicon files
// You'll need to install sharp: npm install sharp

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Simplified SVG of your cube logo
const faviconSvg = `<svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(4, 4) scale(1)">
    <path d="M8 12 L20 6 L32 12 L20 18 Z" fill="#00FF7F" stroke="#00FF7F" stroke-width="1" />
    <path d="M8 12 L8 30 L20 36 L20 18 Z" fill="#00FF7F" stroke="#00FF7F" stroke-width="1" opacity="0.7" />
    <path d="M20 18 L20 36 L32 30 L32 12 Z" fill="#3BE8FF" stroke="#3BE8FF" stroke-width="1" opacity="0.7" />
  </g>
</svg>`;

const publicDir = path.join(__dirname, '../../public');

// Create public directory if it doesn't exist
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the SVG file
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg);

// Generate PNG files
const sizes = [16, 32, 96, 180, 192, 512];

async function generateFavicons() {
  try {
    // Create favicon.ico (usually 16x16 and 32x32 combined)
    await sharp(Buffer.from(faviconSvg))
      .resize(32, 32)
      .png()
      .toFile(path.join(publicDir, 'favicon.ico'));

    // Create PNGs of different sizes
    for (const size of sizes) {
      await sharp(Buffer.from(faviconSvg))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `favicon-${size}x${size}.png`));
    }

    // Apple touch icon
    await sharp(Buffer.from(faviconSvg))
      .resize(180, 180)
      .png()
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));

    console.log('Favicon files generated successfully!');
    console.log('Generated files:');
    console.log('- favicon.ico');
    console.log('- favicon.svg');
    sizes.forEach(size => console.log(`- favicon-${size}x${size}.png`));
    console.log('- apple-touch-icon.png');
    console.log('- site.webmanifest');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

// Create site.webmanifest
const webmanifest = {
  name: 'HackCubes',
  short_name: 'HackCubes',
  icons: [
    {
      src: '/favicon-192x192.png',
      sizes: '192x192',
      type: 'image/png'
    },
    {
      src: '/favicon-512x512.png',
      sizes: '512x512',
      type: 'image/png'
    }
  ],
  theme_color: '#1a1d23',
  background_color: '#1a1d23',
  display: 'standalone'
};

fs.writeFileSync(
  path.join(publicDir, 'site.webmanifest'),
  JSON.stringify(webmanifest, null, 2)
);

// Run the favicon generation
console.log('Starting favicon generation...');
generateFavicons().catch(console.error);
