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
		series: seriesById.get(nft.seriesId) ?? null,
		artist: artistById.get(nft.artistId) ?? null
	};
}

export function getCardsBySeries(seriesId: string): Nft[] {
	return nfts.filter((n) => n.seriesId === seriesId);
}

export function getCardsByArtist(artistId: string): Nft[] {
	return nfts.filter((n) => n.artistId === artistId);
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
