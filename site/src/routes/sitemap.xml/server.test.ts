import { describe, it, expect } from 'vitest';
import { GET } from './+server';
import { nfts, series, artists } from '$lib/data';
import { LOCALES } from '$lib/i18n';
import { SITE_URL } from '$lib/site';

const body = await GET().text();
const locs = [...body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);

describe('sitemap.xml', () => {
	it('is served as XML', () => {
		expect(GET().headers.get('content-type')).toBe('application/xml');
	});

	it('starts with an XML declaration and a urlset', () => {
		expect(body.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
		expect(body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
		expect(body.trimEnd().endsWith('</urlset>')).toBe(true);
	});

	it('lists the home page plus every card, series and artist in both locales', () => {
		const perLocale = 1 + nfts.length + series.length + artists.length;
		expect(locs).toHaveLength(LOCALES.length * perLocale);
	});

	it('contains no duplicates', () => {
		expect(new Set(locs).size).toBe(locs.length);
	});

	it('emits absolute urls under the configured site url', () => {
		for (const loc of locs) {
			expect(loc.startsWith(`${SITE_URL}/`), loc).toBe(true);
		}
	});

	it('covers both locales evenly', () => {
		for (const locale of LOCALES) {
			expect(locs.filter((l) => l.startsWith(`${SITE_URL}/${locale}/`))).toHaveLength(
				1 + nfts.length + series.length + artists.length
			);
		}
	});

	it('percent-encodes non-ascii artist ids', () => {
		const decomposable = artists.find((a) => /[^\x20-\x7E]/.test(a.id));
		expect(decomposable, 'expected at least one non-ascii artist id').toBeDefined();

		expect(locs).toContain(
			`${SITE_URL}/ja/artists/${encodeURIComponent(decomposable!.id)}/`
		);
		// Raw multi-byte characters would make the sitemap invalid.
		for (const loc of locs) expect(loc, loc).toMatch(/^[\x20-\x7E]+$/);
	});

	it('keeps nested series paths intact', () => {
		const nested = series.find((s) => s.id.includes('/'))!;
		expect(locs).toContain(`${SITE_URL}/en/series/${nested.id}/`);
	});

	it('ends every url with a trailing slash, matching trailingSlash: always', () => {
		for (const loc of locs) expect(loc.endsWith('/'), loc).toBe(true);
	});
});
