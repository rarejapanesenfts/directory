// Absolute site location, used for canonical/OGP/sitemap URLs (which must be
// absolute). Overridable at build time via PUBLIC_SITE_URL; defaults to the
// GitHub Pages project URL. Keep in sync with BASE_PATH in the deploy workflow.
const raw = (typeof process !== 'undefined' && process.env?.PUBLIC_SITE_URL) || '';
export const SITE_URL = (raw || 'https://rarejapanesenfts.github.io/directory').replace(/\/+$/, '');

export const SITE_NAME = 'Rare Japanese NFTs';
