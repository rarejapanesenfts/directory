import { base } from '$app/paths';
import type { Locale } from './i18n';

// Internal-link builders. Every href goes through `base` so the site works
// both locally (base = '') and on GitHub Pages (base = '/directory').
// - nft ids: ascii slugs (single segment)
// - series ids: contain '/', mapped onto the [...id] rest route verbatim (all
//   segments are ascii slugs, so no escaping)
// - artist ids: may be non-ascii, so each is percent-encoded

export const homeUrl = (locale: Locale) => `${base}/${locale}/`;

export const cardUrl = (locale: Locale, id: string) => `${base}/${locale}/cards/${id}/`;

export const seriesUrl = (locale: Locale, id: string) => `${base}/${locale}/series/${id}/`;

export const artistUrl = (locale: Locale, id: string) =>
	`${base}/${locale}/artists/${encodeURIComponent(id)}/`;

/** Path to a static asset (e.g. optimized images under /img), base-aware. */
export const asset = (path: string) => `${base}/${path.replace(/^\//, '')}`;
