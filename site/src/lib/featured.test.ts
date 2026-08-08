import { describe, it, expect } from 'vitest';
import { featuredSlides, FEATURED } from './featured';
import { getArtist, getNft, getSeries } from './data';
import { resolveImage } from './images';

describe('featuredSlides', () => {
	const featured = featuredSlides();

	it('returns every curated pick, in order', () => {
		expect(featured.map((f) => f.cover.id)).toEqual(FEATURED.map((p) => p.cover));
	});

	it('resolves each curated pick to real data', () => {
		for (const pick of FEATURED) {
			expect(getNft(pick.cover), pick.cover).toBeDefined();
			if (pick.artist !== undefined) expect(getArtist(pick.artist), pick.artist).toBeDefined();
			else expect(getSeries(pick.series), pick.series).toBeDefined();
		}
	});

	it('links each slide to the page its pick names', () => {
		featured.forEach((f, i) => {
			const pick = FEATURED[i];
			if (f.kind === 'artist') expect(f.artist.id, pick.cover).toBe(pick.artist);
			else expect(f.series.id, pick.cover).toBe(pick.series);
		});
	});

	it('always has a cover card with a resolvable image', () => {
		for (const f of featured) {
			expect(resolveImage(f.cover.image?.source), f.cover.id).not.toBeNull();
		}
	});

	it('takes the cover from the series or artist it fronts', () => {
		for (const f of featured) {
			if (f.kind === 'artist') expect(f.cover.artistId, f.cover.id).toBe(f.artist.id);
			else expect(f.cover.seriesId, f.cover.id).toBe(f.series.id);
		}
	});

	it('reports the card count of the series or artist', () => {
		for (const f of featured) {
			const expected = f.kind === 'artist' ? f.artist.nftCount : f.series.nftCount;
			expect(f.count, f.cover.id).toBe(expected);
		}
	});

	it('shows no cover twice', () => {
		const ids = featured.map((f) => f.cover.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('respects the limit', () => {
		expect(featuredSlides(3)).toHaveLength(3);
		expect(featuredSlides(1)).toHaveLength(1);
		expect(featuredSlides(0)).toHaveLength(0);
	});

	it('is deterministic across calls', () => {
		expect(featuredSlides().map((f) => f.cover.id)).toEqual(featured.map((f) => f.cover.id));
	});
});
