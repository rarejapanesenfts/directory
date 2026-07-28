import { describe, it, expect } from 'vitest';
import { buildPrerenderEntries } from './prerender-entries.js';
import nfts from '../../data/json/nfts.json';
import series from '../../data/json/series.json';
import artists from '../../data/json/artists.json';

const entries: string[] = buildPrerenderEntries();

describe('buildPrerenderEntries', () => {
	it('includes the root redirect and the sitemap', () => {
		expect(entries).toContain('/');
		expect(entries).toContain('/sitemap.xml');
	});

	it('emits every page in both locales exactly once', () => {
		const perLocale = 1 + nfts.length + series.length + artists.length;
		expect(entries).toHaveLength(2 + 2 * perLocale);
		expect(new Set(entries).size).toBe(entries.length);
	});

	it('lists card pages by ascii slug', () => {
		expect(entries).toContain(`/ja/cards/${nfts[0].id}/`);
		expect(entries).toContain(`/en/cards/${nfts[0].id}/`);
	});

	it('maps nested series ids onto the rest route verbatim', () => {
		const nested = series.find((s) => s.id.includes('/'))!;
		expect(entries).toContain(`/ja/series/${nested.id}/`);
	});

	// SvelteKit encodes entries itself and decodes params on the way in, so a
	// pre-encoded entry would reach load() still percent-encoded and 404.
	it('leaves non-ascii artist ids raw (unencoded)', () => {
		const nonAscii = artists.find((a) => /[^\x20-\x7E]/.test(a.id));
		expect(nonAscii, 'expected at least one non-ascii artist id').toBeDefined();

		expect(entries).toContain(`/ja/artists/${nonAscii!.id}/`);
		expect(entries).not.toContain(`/ja/artists/${encodeURIComponent(nonAscii!.id)}/`);
		expect(entries.some((e) => e.includes('%'))).toBe(false);
	});

	it('gives every entry a trailing slash except the sitemap', () => {
		for (const entry of entries) {
			if (entry === '/sitemap.xml') continue;
			expect(entry.endsWith('/'), entry).toBe(true);
		}
	});

	it('makes every entry an absolute path', () => {
		for (const entry of entries) expect(entry.startsWith('/'), entry).toBe(true);
	});
});
