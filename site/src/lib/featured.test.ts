import { describe, it, expect } from 'vitest';
import { featuredSeries } from './featured';
import { series, seriesLabel } from './data';
import { resolveImage } from './images';

describe('featuredSeries', () => {
	const featured = featuredSeries();

	it('returns at least one slide', () => {
		expect(featured.length).toBeGreaterThan(0);
	});

	it('picks at most one series per collection', () => {
		const collections = featured.map((f) => f.series.collectionId);
		expect(new Set(collections).size).toBe(collections.length);
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

	it('orders collections by how much of the archive they are', () => {
		const totals = featured.map((f) =>
			series
				.filter((s) => s.collectionId === f.series.collectionId)
				.reduce((sum, s) => sum + s.nftCount, 0)
		);
		expect([...totals]).toEqual([...totals].sort((a, b) => b - a));
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
