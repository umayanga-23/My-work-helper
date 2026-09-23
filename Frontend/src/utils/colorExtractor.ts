/**
 * Fast client-side dominant color extractor with deterministic hash fallback and in-memory caching.
 */

const colorCache = new Map<string, string>();

const FALLBACK_PALETTE = [
  '#10B981', // Emerald
  '#0EA5E9', // Sky
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#3B82F6', // Blue
  '#84CC16', // Lime
  '#A855F7', // Violet
];

/**
 * Returns a deterministic brand color based on a string seed (e.g., domain name).
 */
export function getDeterministicColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % FALLBACK_PALETTE.length;
  return FALLBACK_PALETTE[index];
}

/**
 * Extracts the most vibrant / dominant non-white/non-black color from an image URL using an offscreen HTML5 canvas.
 * Falls back to deterministic seed hashing if CORS restricts pixel data access.
 */
export async function extractDominantColor(
  imageUrl?: string,
  fallbackSeed?: string
): Promise<string> {
  const seed = fallbackSeed || imageUrl || 'default';
  if (!imageUrl) {
    return getDeterministicColor(seed);
  }

  if (colorCache.has(imageUrl)) {
    return colorCache.get(imageUrl)!;
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    const fallbackColor = getDeterministicColor(seed);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          colorCache.set(imageUrl, fallbackColor);
          return resolve(fallbackColor);
        }

        const size = 24;
        canvas.width = size;
        canvas.height = size;
        ctx.drawImage(img, 0, 0, size, size);

        const imageData = ctx.getImageData(0, 0, size, size).data;
        let bestR = 0,
          bestG = 0,
          bestB = 0;
        let maxSaturation = -1;
        let totalR = 0,
          totalG = 0,
          totalB = 0,
          validCount = 0;

        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];

          // Skip transparent or near-transparent pixels
          if (a < 120) continue;

          // Skip pure white / near white backgrounds
          if (r > 235 && g > 235 && b > 235) continue;

          // Skip pure black / near black outlines
          if (r < 25 && g < 25 && b < 25) continue;

          totalR += r;
          totalG += g;
          totalB += b;
          validCount++;

          // Calculate color saturation to pick the most vibrant brand accent
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const saturation = max === 0 ? 0 : delta / max;

          if (saturation > maxSaturation) {
            maxSaturation = saturation;
            bestR = r;
            bestG = g;
            bestB = b;
          }
        }

        if (maxSaturation > 0.15) {
          const hex = rgbToHex(bestR, bestG, bestB);
          colorCache.set(imageUrl, hex);
          return resolve(hex);
        } else if (validCount > 0) {
          const avgR = Math.round(totalR / validCount);
          const avgG = Math.round(totalG / validCount);
          const avgB = Math.round(totalB / validCount);
          const hex = rgbToHex(avgR, avgG, avgB);
          colorCache.set(imageUrl, hex);
          return resolve(hex);
        } else {
          colorCache.set(imageUrl, fallbackColor);
          return resolve(fallbackColor);
        }
      } catch (err) {
        // In case of CORS SecurityError on getImageData
        colorCache.set(imageUrl, fallbackColor);
        return resolve(fallbackColor);
      }
    };

    img.onerror = () => {
      colorCache.set(imageUrl, fallbackColor);
      return resolve(fallbackColor);
    };

    img.src = imageUrl;
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Returns dynamic styles for cards, backgrounds, glows, and badges based on the extracted brand color.
 */
export function getBrandCardStyle(brandColor?: string, customColor?: string) {
  const color = customColor || brandColor || '#10B981';
  return {
    color,
    // Light and dark subtle gradients
    lightBg: `linear-gradient(180deg, ${color}14 0%, ${color}08 100%)`,
    darkBg: `linear-gradient(180deg, ${color}20 0%, ${color}0D 100%)`,
    border: `${color}35`,
    hoverBorder: color,
    glow: `0 8px 24px ${color}25`,
    badgeBg: `${color}18`,
    badgeText: color,
    dockBg: `${color}10`,
  };
}
