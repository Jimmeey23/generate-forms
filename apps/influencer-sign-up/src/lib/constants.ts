// Hosted original; saved forms reference this URL and social previews need an absolute image.
export const LEGACY_BRAND_LOGO = 'https://images.fillout.com/orgid-66954/flowpublicid-uxjuax2dbd/widgetid-default/jART4M3Yb27Pc9DpgJCpz5/pasted-image-1782902048740-lg84b5zl.png';
// Original logo for light backgrounds; the dark variant has white "PHYSIQUE" text and keeps the blue 57.
export const BRAND_LOGO = '/brand/physique57-logo.png';
export const BRAND_LOGO_DARK = '/brand/physique57-logo-dark.png';
export const isBrandLogo = (url?: string) => !url || url === LEGACY_BRAND_LOGO || url === BRAND_LOGO || url === BRAND_LOGO_DARK;

export { HERO_IMAGES } from '../../shared/heroImages.mjs';

export const CENTERS = [
  'Kwality House, Kemps Corner',
  'Supreme HQ, Bandra',
  'Kenkere House, Bengaluru',
  'The Studio by Copper & Cloves, Bengaluru',
  'Plash Pilates, Bengaluru',
];

export const CLASS_TYPES = [
  'Barre',
  'Strength Lab',
  'powerCycle',
];

export const FALLBACK_CENTER = 'Kwality House, Kemps Corner';
