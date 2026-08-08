import { describe, it, expect } from 'vitest';
import { featuredSeries, FEATURED } from './featured';
import { getNft, getSeries, seriesLabel } from './data';
import { resolveImage } from './images';

describe('featuredSeries', () => {
	const featured = featuredSeries();

	it('returns every curated slide, in order', () => {
		expect(featured.map((f) => [f.cover.id, f.series.id])).toEqual(
			FEATURED.map(([cover, series]) => [cover, series])
		);
	});

	it('resolves each curated pair to real data', () => {
		for (const [cover, series] of FEATURED) {
			expect(getNft(cover), cover).toBeDefined();
			expect(getSeries(series), series).toBeDefined();
		}
	});

	it('always has a cover card with a resolvable image', () => {
		for (const f of featured) {
			expect(resolveImage(f.cover.image?.source), f.series.id).not.toBeNull();
		}
	});

	it('takes the cover from the featured series itself', () => {
		for (const f of featured) {
			expect(f.cover.seriesId, f.series.id).toBe(f.series.id);
		}
	});

	it('reports the card count of the series', () => {
		for (const f of featured) {
			expect(f.count, f.series.id).toBe(f.series.nftCount);
		}
	});

	it('labels each slide the same way the rest of the UI does', () => {
		for (const f of featured) {
			expect(f.label).toBe(seriesLabel(f.series));
		}
	});

	it('lists no series twice', () => {
		const ids = featured.map((f) => f.series.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('respects the limit', () => {
		expect(featuredSeries(3)).toHaveLength(3);
		expect(featuredSeries(1)).toHaveLength(1);
		expect(featuredSeries(0)).toHaveLength(0);
	});

	it('is deterministic across calls', () => {
		expect(featuredSeries().map((f) => `${f.series.id}:${f.cover.id}`)).toEqual(
			featured.map((f) => `${f.series.id}:${f.cover.id}`)
		);
	});
});
