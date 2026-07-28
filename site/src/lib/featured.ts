// Slides for the home-page series carousel: one series per collection, so the
// carousel reads as a tour of the archive instead of nine Memorychain series in
// a row. Picked at build time (this module only runs during prerender).

import { nfts, series, seriesLabel } from '$lib/data';
import { resolveImage } from '$lib/images';
import type { Nft, Series } from '$lib/data/types';

export type FeaturedSeries = {
	series: Series;
	label: string;
	/** Representative card — the first one in the series that has an image. */
	cover: Nft;
	count: number;
};

/**
 * One featured series per collection (the collection's largest series that has
 * at least one image), ordered by how much of the archive the collection is.
 */
export function featuredSeries(limit = 12): FeaturedSeries[] {
	const bySeries = new Map<string, Nft[]>();
	for (const n of nfts) {
		const list = bySeries.get(n.seriesId);
		if (list) list.push(n);
		else bySeries.set(n.seriesId, [n]);
	}

	const collections = new Map<string, { total: number; best: FeaturedSeries | null }>();
	for (const s of series) {
		const cards = bySeries.get(s.id) ?? [];
		const cover = cards.find((n) => resolveImage(n.image?.source));
		let group = collections.get(s.collectionId);
		if (!group) {
			group = { total: 0, best: null };
			collections.set(s.collectionId, group);
		}
		group.total += cards.length;
		if (!cover) continue;
		if (!group.best || cards.length > group.best.count) {
			group.best = { series: s, label: seriesLabel(s), cover, count: cards.length };
		}
	}

	return [...collections.values()]
		.filter((g): g is { total: number; best: FeaturedSeries } => g.best !== null)
		.sort((a, b) => b.total - a.total)
		.slice(0, limit)
		.map((g) => g.best);
}
