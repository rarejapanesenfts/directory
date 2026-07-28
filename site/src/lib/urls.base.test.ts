import { describe, it, expect, vi } from 'vitest';

// GitHub Pages serves the site from /directory, so every internal link has to
// carry that prefix. urls.ts captures `base` at import time, so the mock has to
// be in place before the module is imported (vi.mock is hoisted for that).
vi.mock('$app/paths', () => ({ base: '/directory' }));

const { homeUrl, cardUrl, seriesUrl, artistUrl, asset } = await import('./urls');

describe('with base = /directory', () => {
	it('prefixes locale home urls', () => {
		expect(homeUrl('ja')).toBe('/directory/ja/');
	});

	it('prefixes card urls', () => {
		expect(cardUrl('en', 'PEPEBAZAAR')).toBe('/directory/en/cards/PEPEBAZAAR/');
	});

	it('prefixes series urls without touching the nested id', () => {
		expect(seriesUrl('ja', 'badger-capsule/series-1')).toBe(
			'/directory/ja/series/badger-capsule/series-1/'
		);
	});

	it('prefixes artist urls and still encodes the id', () => {
		expect(artistUrl('ja', 'だいふく')).toBe(
			`/directory/ja/artists/${encodeURIComponent('だいふく')}/`
		);
	});

	it('prefixes assets exactly once', () => {
		expect(asset('/img/foo.webp')).toBe('/directory/img/foo.webp');
		expect(asset('img/foo.webp')).toBe('/directory/img/foo.webp');
	});
});
