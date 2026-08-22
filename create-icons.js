import fs from 'fs';
import path from 'path';

// Generate SVG icon
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="128" fill="#4F46E5"/>
  <circle cx="256" cy="256" r="180" fill="#4338CA" opacity="0.4"/>
  <text x="256" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="220" font-weight="900" fill="#FFFFFF" text-anchor="middle">B</text>
  <circle cx="360" cy="150" r="30" fill="#10B981"/>
</svg>`;

fs.writeFileSync(path.join(process.cwd(), 'public', 'favicon.svg'), svgIcon);
fs.writeFileSync(path.join(process.cwd(), 'public', 'pwa-192x192.svg'), svgIcon);
fs.writeFileSync(path.join(process.cwd(), 'public', 'pwa-512x512.svg'), svgIcon);

console.log('✅ App icons created in public/');
