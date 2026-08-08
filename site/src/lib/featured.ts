// Slides for the home-page carousel: a hand-picked tour of the archive. Each
// slide pairs a card chosen to represent something with the page that something
// lives on — usually a series, but a slide can point at an artist instead when
// that is the better destination. Resolved at build time (this module only runs
// during prerender).

import { getArtist, getNft, getSeries } from '$lib/data';
import { resolveImage } from '$lib/images';
import type { Artist, Nft, Series } from '$lib/data/types';

/**
 * A slide, with its destination resolved. Locale-dependent text (the artist's
 * name, the CTA) is left to the component — this module only resolves data.
 */
export type FeaturedSlide = { cover: Nft; count: number } & (
	| { kind: 'series'; series: Series }
	| { kind: 'artist'; artist: Artist }
);

/** An entry in the curated list: a cover card plus the page it links to. */
export type FeaturedPick = { cover: string } & (
	| { series: string; artist?: never }
	| { artist: string; series?: never }
);

/**
 * The curated running order. The cover card must belong to the series (or the
 * artist) it fronts and must have an image — `featuredSlides()` drops any pick
 * that stops holding (a renamed id, a dropped image, a card reassigned to
 * another series) rather than breaking the build, and `featured.test.ts` fails
 * so the list gets fixed.
 */
export const FEATURED: readonly FeaturedPick[] = [
	{ cover: 'lovenft', series: 'badger-capsule/series-1' },
	{ cover: 'thegodtanu', series: 'memorychain/series-1' },
	{ cover: 'fwcfcintrosc', series: 'force-of-will' },
	{ cover: 'ccgbtcone', series: 'oasis-mining/series-2' },
	{ cover: 'bitgirlsi', artist: 'bitgirls' },
	{ cover: 'pepejapan', series: 'japanese-rarepepe/series-06' },
	{ cover: 'dogecoincard', series: 'japanese-sog' },
	{ cover: 'bitcornect', series: 'japanese-corn/harvest-1' }
];

/** The curated slides, in order, up to `limit`. */
export function featuredSlides(limit = FEATURED.length): FeaturedSlide[] {
	const slides: FeaturedSlide[] = [];
	for (const pick of FEATURED) {
		if (slides.length >= limit) break;
		const cover = getNft(pick.cover);
		if (!cover || !resolveImage(cover.image?.source)) continue;

		if (pick.artist !== undefined) {
			const artist = getArtist(pick.artist);
			// Through getArtist() so the check is insensitive to id normalization,
			// same as every other lookup in the data layer (artist ids are the ones
			// that actually carry non-ascii characters).
			if (!artist || getArtist(cover.artistId)?.id !== artist.id) continue;
			slides.push({ kind: 'artist', artist, cover, count: artist.nftCount });
		} else {
			const series = getSeries(pick.series);
			if (!series || getSeries(cover.seriesId)?.id !== series.id) continue;
			slides.push({ kind: 'series', series, cover, count: series.nftCount });
		}
	}
	return slides;
}
