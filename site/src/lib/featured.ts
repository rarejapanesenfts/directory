// Slides for the home-page series carousel: a hand-picked tour of the archive.
// Each slide is a series plus the card chosen to represent it, so the covers are
// curated rather than "whichever card happens to come first". Resolved at build
// time (this module only runs during prerender).

import { getNft, getSeries, seriesLabel } from '$lib/data';
import { resolveImage } from '$lib/images';
import type { Nft, Series } from '$lib/data/types';

export type FeaturedSeries = {
	series: Series;
	label: string;
	/** Representative card for the series. */
	cover: Nft;
	count: number;
};

/**
 * The curated running order: [card id, series id]. The card must belong to the
 * series it fronts and must have an image — `featuredSeries()` drops any pair
 * that stops holding (a renamed id, a dropped image) rather than breaking the
 * build, and `featured.test.ts` fails so the list gets fixed.
 */
export const FEATURED: readonly (readonly [cover: string, series: string])[] = [
	['hairpepe', 'japanese-rarepepe/series-01'],
	['thegodtanu', 'memorychain/series-1'],
	['fwcfcintrosc', 'force-of-will'],
	['ccgbtcone', 'oasis-mining/series-2'],
	['bitgirlsi', 'bitgirls/special'],
	['pepejapan', 'japanese-rarepepe/series-06'],
	['dogecoincard', 'japanese-sog'],
	['bitcornect', 'japanese-corn/harvest-1']
];

/** The curated slides, in order, up to `limit`. */
export function featuredSeries(limit = FEATURED.length): FeaturedSeries[] {
	const slides: FeaturedSeries[] = [];
	for (const [coverId, seriesId] of FEATURED) {
		if (slides.length >= limit) break;
		const s = getSeries(seriesId);
		const cover = getNft(coverId);
		if (!s || !cover) continue;
		// Through getSeries() so the check is insensitive to id normalization,
		// same as every other lookup in the data layer.
		if (getSeries(cover.seriesId)?.id !== s.id) continue;
		if (!resolveImage(cover.image?.source)) continue;
		slides.push({ series: s, label: seriesLabel(s), cover, count: s.nftCount });
	}
	return slides;
}
