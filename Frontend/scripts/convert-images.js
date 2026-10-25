import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.resolve(__dirname, '../public');

const images = [
  'ambition-1.jpg',
  'ambition-2.jpg',
  'ambition-3.jpg',
  'ambition-4.jpg',
  'ambition-5.jpg',
  'it-1.jpg',
  'it-2.jpg',
  'it-3.jpg',
  'it-4.jpg',
  'aiu-logo.jpg',
];

async function convert() {
  console.log('--- Starting WebP Conversion ---');
  let totalOriginal = 0;
  let totalNew = 0;

  for (const img of images) {
    const inputPath = path.join(publicDir, img);
    if (!fs.existsSync(inputPath)) {
      console.log(`Skipping missing file: ${img}`);
      continue;
    }

    const origStats = fs.statSync(inputPath);
    totalOriginal += origStats.size;

    const baseName = path.basename(img, path.extname(img));
    const outputPath = path.join(publicDir, `${baseName}.webp`);

    // Resize to max 1920px width (plenty for high-res hero banners) & convert to webp quality 80
    await sharp(inputPath)
      .resize({ width: 1920, withoutEnlargement: true })
      .webp({ quality: 80, effort: 6 })
      .toFile(outputPath);

    const newStats = fs.statSync(outputPath);
    totalNew += newStats.size;

    const origKb = (origStats.size / 1024).toFixed(1);
    const newKb = (newStats.size / 1024).toFixed(1);
    const saving = (((origStats.size - newStats.size) / origStats.size) * 100).toFixed(1);

    console.log(`✔ ${img} (${origKb} KB) -> ${baseName}.webp (${newKb} KB) [${saving}% saved]`);
  }

  const origMb = (totalOriginal / (1024 * 1024)).toFixed(2);
  const newMb = (totalNew / (1024 * 1024)).toFixed(2);
  const totalSaving = (((totalOriginal - totalNew) / totalOriginal) * 100).toFixed(1);

  console.log('\n--- Summary ---');
  console.log(`Total Original: ${origMb} MB`);
  console.log(`Total WebP:     ${newMb} MB`);
  console.log(`Total Saved:    ${totalSaving}%`);
}

convert().catch((err) => {
  console.error('Error during conversion:', err);
  process.exit(1);
});
