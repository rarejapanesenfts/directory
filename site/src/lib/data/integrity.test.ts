// Guards the normalized JSON in data/json/, which scripts/convert.py regenerates
// from the WordPress export. The site reads these files directly, so a broken
// reference or a stale count is a broken page. Known data-quality gaps are
// tracked in data/ISSUES.md and deliberately NOT asserted here.
import { describe, it, expect } from 'vitest';
import { nfts, series, artists } from './index';
import type { Localized } from './types';

const seriesIds = new Set(series.map((s) => s.id));
const artistIds = new Set(artists.map((a) => a.id));

const expectLocalized = (value: Localized, label: string) => {
	expect(value, label).not.toBeNull();
	expect(Object.keys(value).sort(), label).toEqual(['en', 'ja']);
	for (const lang of ['en', 'ja'] as const) {
		const v = value[lang];
		if (v !== null) expect(typeof v, `${label}.${lang}`).toBe('string');
	}
};

describe('ids', () => {
	it('are unique within each file', () => {
		expect(new Set(nfts.map((n) => n.id)).size).toBe(nfts.length);
		expect(new Set(series.map((s) => s.id)).size).toBe(series.length);
		expect(new Set(artists.map((a) => a.id)).size).toBe(artists.length);
	});

	it('are non-empty', () => {
		for (const n of nfts) expect(n.id).toBeTruthy();
		for (const s of series) expect(s.id).toBeTruthy();
		for (const a of artists) expect(a.id).toBeTruthy();
	});

	// Lookups normalize to NFC; storing a decomposed id would still resolve, but
	// keeping the files canonical keeps diffs and URLs stable.
	it('are stored in NFC normal form', () => {
		for (const a of artists) expect(a.id, a.id).toBe(a.id.normalize('NFC'));
		for (const s of series) expect(s.id, s.id).toBe(s.id.normalize('NFC'));
		for (const n of nfts) expect(n.id, n.id).toBe(n.id.normalize('NFC'));
	});

	it('keep card and series ids url-safe', () => {
		for (const n of nfts) expect(n.id, n.id).toMatch(/^[A-Za-z0-9._-]+$/);
		// Series ids are 'collection/series' — ascii slugs on both sides.
		for (const s of series) expect(s.id, s.id).toMatch(/^[a-z0-9-]+(\/[a-z0-9-]+)?$/);
	});
});

describe('references', () => {
	it('point every card at an existing series', () => {
		for (const n of nfts) expect(seriesIds.has(n.seriesId), `${n.id} -> ${n.seriesId}`).toBe(true);
	});

	it('point every card at an existing artist', () => {
		for (const n of nfts) expect(artistIds.has(n.artistId), `${n.id} -> ${n.artistId}`).toBe(true);
	});

	it('prefix every series id with its collection id', () => {
		for (const s of series) {
			expect(s.collectionId, s.id).toBeTruthy();
			expect(s.id.startsWith(s.collectionId), s.id).toBe(true);
		}
	});

	it('give every collection id a single collection name', () => {
		const names = new Map<string, string>();
		for (const s of series) {
			const known = names.get(s.collectionId);
			if (known) expect(s.collectionName, s.collectionId).toBe(known);
			else names.set(s.collectionId, s.collectionName);
		}
	});

	it('leave no series or artist without cards', () => {
		for (const s of series) expect(s.nftCount, s.id).toBeGreaterThan(0);
		for (const a of artists) expect(a.nftCount, a.id).toBeGreaterThan(0);
	});
});

describe('denormalized counts', () => {
	it('match the actual number of cards per series', () => {
		for (const s of series) {
			expect(nfts.filter((n) => n.seriesId === s.id).length, s.id).toBe(s.nftCount);
		}
	});

	it('match the actual number of cards per artist', () => {
		for (const a of artists) {
			expect(nfts.filter((n) => n.artistId === a.id).length, a.id).toBe(a.nftCount);
		}
	});

	it('add up to the total card count', () => {
		expect(series.reduce((sum, s) => sum + s.nftCount, 0)).toBe(nfts.length);
		expect(artists.reduce((sum, a) => sum + a.nftCount, 0)).toBe(nfts.length);
	});
});

describe('card shape', () => {
	it('has a name and an image source', () => {
		for (const n of nfts) {
			expect(n.name, n.id).toBeTruthy();
			expect(n.image?.source, n.id).toBeTruthy();
		}
	});

	it('uses YYYY-MM for the sortable issue date', () => {
		for (const n of nfts) {
			if (n.issued.date === null) continue;
			expect(n.issued.date, n.id).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
		}
	});

	it('keeps localized fields well-formed', () => {
		for (const n of nfts) {
			expectLocalized(n.slug, `${n.id}.slug`);
			expectLocalized(n.description, `${n.id}.description`);
			expectLocalized(n.issued.display, `${n.id}.issued.display`);
		}
	});

	it('uses null rather than 0 for unknown numbers', () => {
		for (const n of nfts) {
			if (n.card !== null) expect(n.card, n.id).toBeGreaterThan(0);
			if (n.totalSupply !== null) expect(n.totalSupply, n.id).toBeGreaterThan(0);
		}
	});

	it('gives every chain link a name and an absolute url', () => {
		for (const n of nfts) {
			expect(Array.isArray(n.chains), n.id).toBe(true);
			for (const c of n.chains) {
				expect(c.name, n.id).toBeTruthy();
				expect(() => new URL(c.url), `${n.id}: ${c.url}`).not.toThrow();
				expect(c.url, n.id).toMatch(/^https?:\/\//);
			}
		}
	});
});

describe('series and artist shape', () => {
	it('keeps localized fields well-formed', () => {
		for (const s of series) expectLocalized(s.description, `${s.id}.description`);
		for (const a of artists) {
			expectLocalized(a.name, `${a.id}.name`);
			expectLocalized(a.bio, `${a.id}.bio`);
		}
	});

	it('gives every series a displayable heading', () => {
		for (const s of series) expect(s.name || s.collectionName, s.id).toBeTruthy();
	});

	it('gives every artist a displayable name in at least one language', () => {
		for (const a of artists) expect(a.name.ja || a.name.en, a.id).toBeTruthy();
	});

	// The artist page puts these straight into href, so a scheme-less value
	// would resolve relative to the artist page instead of leaving the site.
	// convert.py normalizes them; this keeps that guarantee.
	it('keeps artist links absolute when present', () => {
		for (const a of artists) {
			for (const [kind, url] of Object.entries(a.links)) {
				if (url === null) continue;
				expect(url, `${a.id}.${kind}`).toMatch(/^https?:\/\//);
				expect(() => new URL(url), `${a.id}.${kind}`).not.toThrow();
			}
		}
	});
});
