import { describe, it, expect } from 'vitest';
import { homeUrl, cardUrl, seriesUrl, artistUrl, asset } from './urls';

// $app/paths resolves to base = '' by default (local dev / user-site deploys).
// The base-aware variant lives in urls.base.test.ts.

describe('with an empty base', () => {
	it('builds locale home urls with a trailing slash', () => {
		expect(homeUrl('ja')).toBe('/ja/');
		expect(homeUrl('en')).toBe('/en/');
	});

	it('builds card urls from ascii slugs', () => {
		expect(cardUrl('ja', 'PEPEBAZAAR')).toBe('/ja/cards/PEPEBAZAAR/');
	});

	it('keeps the slash inside a series id (it maps onto the rest route)', () => {
		expect(seriesUrl('en', 'memorychain/series-7')).toBe('/en/series/memorychain/series-7/');
	});

	it('percent-encodes non-ascii artist ids', () => {
		expect(artistUrl('ja', 'だいふく')).toBe(
			`/ja/artists/${encodeURIComponent('だいふく')}/`
		);
		expect(artistUrl('ja', 'だいふく')).toContain('%');
	});

	it('leaves ascii artist ids readable', () => {
		expect(artistUrl('en', 'anonymous')).toBe('/en/artists/anonymous/');
	});

	describe('asset', () => {
		it('strips a leading slash so the base is not doubled', () => {
			expect(asset('/img/foo.webp')).toBe('/img/foo.webp');
		});

		it('accepts manifest-relative paths', () => {
			expect(asset('img/foo.webp')).toBe('/img/foo.webp');
		});
	});
});
