// Static data layer. The three normalized JSON files are imported at build
// time (Vite resolves them via server.fs.allow -> repo root) and indexed into
// Maps. Every route's load() runs at prerender time, so this only executes
// during the build — nothing here ships to the client except the values a
// component actually references.
import nftsRaw from '../../../../data/json/nfts.json';
import seriesRaw from '../../../../data/json/series.json';
import artistsRaw from '../../../../data/json/artists.json';
import type { Nft, Series, Artist, JoinedNft } from './types';

export const nfts = nftsRaw as Nft[];
export const series = seriesRaw as Series[];
export const artists = artistsRaw as Artist[];

// Some artist ids contain non-ASCII characters. URL round-tripping through the
// prerender crawler can hand back a differently-normalized string, so index and
// look up by NFC-normalized key to stay match-insensitive to normalization.
const norm = (id: string) => id.normalize('NFC');

const nftById = new Map(nfts.map((n) => [norm(n.id), n]));
const seriesById = new Map(series.map((s) => [norm(s.id), s]));
const artistById = new Map(artists.map((a) => [norm(a.id), a]));

export function getNft(id: string): Nft | undefined {
	return nftById.get(norm(id));
}

export function getSeries(id: string): Series | undefined {
	return seriesById.get(norm(id));
}

export function getArtist(id: string): Artist | undefined {
	return artistById.get(norm(id));
}

/** Resolve a card's series/artist references into a display-ready object. */
export function joinCard(nft: Nft): JoinedNft {
	return {
		...nft,
		// Go through getSeries/getArtist so references resolve NFC-insensitively,
		// same as every other lookup (a raw get here would silently return null
		// on a normalization mismatch, dropping the artist/series link).
		series: getSeries(nft.seriesId) ?? null,
		artist: getArtist(nft.artistId) ?? null
	};
}

export function getCardsBySeries(seriesId: string): Nft[] {
	const key = norm(seriesId);
	return nfts.filter((n) => norm(n.seriesId) === key);
}

export function getCardsByArtist(artistId: string): Nft[] {
	const key = norm(artistId);
	return nfts.filter((n) => norm(n.artistId) === key);
}

/** All series grouped by their collection, preserving first-seen order. */
export function seriesByCollection(): { collectionId: string; collectionName: string; series: Series[] }[] {
	const groups = new Map<string, { collectionId: string; collectionName: string; series: Series[] }>();
	for (const s of series) {
		let g = groups.get(s.collectionId);
		if (!g) {
			g = { collectionId: s.collectionId, collectionName: s.collectionName, series: [] };
			groups.set(s.collectionId, g);
		}
		g.series.push(s);
	}
	return [...groups.values()];
}
