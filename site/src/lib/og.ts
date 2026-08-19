// Social-sharing (OGP) image metadata.
//
// The logic lives here rather than inside Seo.svelte because the test setup is
// `environment: 'node'` with no DOM and no component renderer — pure modules
// like this one and site.ts/urls.ts are the only thing unit tests can reach.
import { SITE_URL } from './site';

// The canvas scripts/optimize-images.ts renders. Every share image is this
// exact size, which is why the tags below can be constants: crawlers that get
// og:image:width/height up front lay the card out on the first pass instead of
// deferring until they have fetched the image.
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_TYPE = 'image/jpeg';

/**
 * Share card for pages with no art of their own (home, series, artist, and the
 * `/` redirect). Manifest-relative, like the entries in images.json.
 */
export const DEFAULT_OG_IMAGE = 'og/default.jpg';

/**
 * Absolute URL for an og:image.
 *
 * `image` is a manifest-relative path (`og/batcorn.jpg`) or an absolute URL;
 * null/empty falls back to the site-wide default so every page ends up with a
 * `summary_large_image` card rather than a bare text preview.
 *
 * Note this joins onto SITE_URL, which already carries the `/directory` base —
 * do NOT run the value through `asset()` from urls.ts as well, or the base
 * lands in the path twice.
 */
export function ogImageUrl(image?: string | null): string {
	const path = image || DEFAULT_OG_IMAGE;
	if (/^https?:\/\//i.test(path)) return path;
	return `${SITE_URL}/${path.replace(/^\/+/, '')}`;
}
