import { mkdirSync, copyFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const src = join(__dirname, '..', 'src', 'assets', 'logo.png');
const destDir = join(__dirname, '..', 'public', 'icons');

try {
  if (!existsSync(destDir)) mkdirSync(destDir, { recursive: true });
  copyFileSync(src, join(destDir, 'logo-192.png'));
  copyFileSync(src, join(destDir, 'logo-512.png'));
  console.log('Copied logo.png to public/icons/logo-192.png and logo-512.png');
} catch (err) {
  console.error('Error copying icons:', err);
  process.exitCode = 1;
}
