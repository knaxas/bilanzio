import { mkdirSync, copyFileSync, existsSync } from 'fs';
import { dirname } from 'path';

const src = dirname(new URL(import.meta.url).pathname).replace(/^\//, '') + '/../src/assets/logo.png';
const destDir = 'public/icons';

try {
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
  copyFileSync(src, `${destDir}/logo-192.png`);
  copyFileSync(src, `${destDir}/logo-512.png`);
  console.log('Copied logo.png to public/icons/logo-192.png and logo-512.png');
} catch (err) {
  console.error('Error copying icons:', err);
  process.exitCode = 1;
}
