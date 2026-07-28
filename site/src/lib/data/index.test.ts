import { describe, it, expect } from 'vitest';
import {
	nfts,
	series,
	artists,
	getNft,
	getSeries,
	getArtist,
	seriesTitle,
	seriesLabel,
	joinCard,
	getCardsBySeries,
	getCardsByArtist,
	seriesByCollection
} from './index';

describe('lookups', () => {
	it('finds a card by id', () => {
		const sample = nfts[0];
		expect(getNft(sample.id)).toBe(sample);
	});

	it('finds a series by its collection-prefixed id', () => {
		const sample = series[0];
		expect(getSeries(sample.id)).toBe(sample);
	});

	it('finds an artist by id', () => {
		const sample = artists[0];
		expect(getArtist(sample.id)).toBe(sample);
	});

	it('returns undefined for unknown ids', () => {
		expect(getNft('no-such-card')).toBeUndefined();
		expect(getSeries('no-such/series')).toBeUndefined();
		expect(getArtist('no-such-artist')).toBeUndefined();
	});

	// The prerender crawler can hand back a decomposed form of a Japanese id
	// (だ -> た + combining dakuten), which must still resolve to the same record.
	it('matches ids regardless of unicode normalization', () => {
		const decomposable = artists.find((a) => a.id.normalize('NFD') !== a.id);
		expect(decomposable, 'expected at least one artist id with a dakuten').toBeDefined();

		expect(getArtist(decomposable!.id.normalize('NFD'))).toBe(decomposable);
		expect(getArtist(decomposable!.id.normalize('NFC'))).toBe(decomposable);
	});

	it('resolves every card reference', () => {
		for (const n of nfts) {
			expect(getSeries(n.seriesId), n.id).toBeDefined();
			expect(getArtist(n.artistId), n.id).toBeDefined();
		}
	});
});

describe('series labels', () => {
	it('uses the series name when it has one', () => {
		const s = { collectionName: 'Memorychain', name: 'Series 7' };
		expect(seriesTitle(s)).toBe('Series 7');
		expect(seriesLabel(s)).toBe('Memorychain — Series 7');
	});

	it('falls back to the collection name for unnamed series', () => {
		const s = { collectionName: 'Force of Will', name: '' };
		expect(seriesTitle(s)).toBe('Force of Will');
		expect(seriesLabel(s)).toBe('Force of Will');
	});

	it('never renders a dangling separator for the real data', () => {
		for (const s of series) {
			expect(seriesLabel(s), s.id).not.toMatch(/—\s*$/);
			expect(seriesTitle(s), s.id).not.toBe('');
		}
	});
});

describe('joinCard', () => {
	it('resolves the series and artist references', () => {
		const sample = nfts[0];
		const joined = joinCard(sample);

		expect(joined.id).toBe(sample.id);
		expect(joined.series?.id).toBe(sample.seriesId);
		expect(joined.artist?.id).toBe(sample.artistId);
	});

	it('keeps every original field', () => {
		const sample = nfts[0];
		const joined = joinCard(sample);
		expect(joined).toMatchObject(sample);
	});

	it('nulls out references that do not resolve', () => {
		const orphan = { ...nfts[0], seriesId: 'no-such/series', artistId: 'no-such-artist' };
		const joined = joinCard(orphan);

		expect(joined.series).toBeNull();
		expect(joined.artist).toBeNull();
	});
});

describe('reverse lookups', () => {
	it('returns the cards of a series and matches its nftCount', () => {
		for (const s of series) {
			const cards = getCardsBySeries(s.id);
			expect(cards.length, s.id).toBe(s.nftCount);
			expect(cards.every((n) => n.seriesId === s.id), s.id).toBe(true);
		}
	});

	it('returns the cards of an artist and matches their nftCount', () => {
		for (const a of artists) {
			const cards = getCardsByArtist(a.id);
			expect(cards.length, a.id).toBe(a.nftCount);
		}
	});

	it('accepts a decomposed id', () => {
		const decomposable = artists.find((a) => a.id.normalize('NFD') !== a.id)!;
		expect(getCardsByArtist(decomposable.id.normalize('NFD')).length).toBe(
			decomposable.nftCount
		);
	});

	it('returns an empty list for unknown ids', () => {
		expect(getCardsBySeries('no-such/series')).toEqual([]);
		expect(getCardsByArtist('no-such-artist')).toEqual([]);
	});
});

describe('seriesByCollection', () => {
	const groups = seriesByCollection();

	it('covers every series exactly once', () => {
		const grouped = groups.flatMap((g) => g.series);
		expect(grouped).toHaveLength(series.length);
		expect(new Set(grouped.map((s) => s.id)).size).toBe(series.length);
	});

	it('produces one group per distinct collection', () => {
		expect(groups).toHaveLength(new Set(series.map((s) => s.collectionId)).size);
		expect(new Set(groups.map((g) => g.collectionId)).size).toBe(groups.length);
	});

	it('keeps every series under its own collection', () => {
		for (const g of groups) {
			for (const s of g.series) {
				expect(s.collectionId, s.id).toBe(g.collectionId);
			}
		}
	});

	it('preserves first-seen order of collections and of series within them', () => {
		const firstSeen: string[] = [];
		for (const s of series) if (!firstSeen.includes(s.collectionId)) firstSeen.push(s.collectionId);
		expect(groups.map((g) => g.collectionId)).toEqual(firstSeen);

		for (const g of groups) {
			expect(g.series.map((s) => s.id)).toEqual(
				series.filter((s) => s.collectionId === g.collectionId).map((s) => s.id)
			);
		}
	});
});
