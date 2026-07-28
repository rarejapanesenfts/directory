// Search/filter state for the card list, kept in the URL so that opening a card
// and coming back (browser Back, or the "back to list" link) restores what the
// reader had typed. The list page is prerendered, so the query string can only
// be read on the client — see the onMount sync in the list page.

import { browser } from '$app/environment';
import { getSeries, seriesLabel } from './data';
import type { Nft } from './data/types';

export type ListQuery = { q: string; series: string; artist: string };

export function readQuery(url: URL): ListQuery {
	return {
		q: url.searchParams.get('q') ?? '',
		series: url.searchParams.get('series') ?? '',
		artist: url.searchParams.get('artist') ?? ''
	};
}

/** Serialize to '?q=…&series=…' (empty string when nothing is set). */
export function queryString(query: ListQuery): string {
	const params = new URLSearchParams();
	if (query.q) params.set('q', query.q);
	if (query.series) params.set('series', query.series);
	if (query.artist) params.set('artist', query.artist);
	const s = params.toString();
	return s ? `?${s}` : '';
}

/**
 * Lowercase search haystack per card (name + series label), built once for the
 * whole list so typing doesn't re-resolve every card's series on each keystroke.
 * Keyed by nft id.
 */
export function buildHaystacks(cards: Nft[]): Map<string, string> {
	return new Map(
		cards.map((n) => {
			const s = getSeries(n.seriesId);
			return [n.id, `${n.name} ${s ? seriesLabel(s) : ''}`.toLowerCase()];
		})
	);
}

/**
 * Cards matching every active filter (empty fields match everything). The text
 * query is matched case-insensitively against the haystacks above; a card
 * missing from the map matches nothing.
 */
export function filterCards(
	cards: Nft[],
	haystacks: Map<string, string>,
	query: ListQuery
): Nft[] {
	const q = query.q.trim().toLowerCase();
	return cards.filter((n) => {
		if (query.series && n.seriesId !== query.series) return false;
		if (query.artist && n.artistId !== query.artist) return false;
		if (q && !haystacks.get(n.id)?.includes(q)) return false;
		return true;
	});
}

// Detail pages link back to the list with the reader's filters still applied.
// They are separate prerendered pages, so the state travels through
// sessionStorage (per-tab, cleared with the tab) rather than through the link.
const KEY = 'rjn:list-query';

export function rememberQuery(query: ListQuery): void {
	if (!browser) return;
	try {
		const s = queryString(query);
		if (s) sessionStorage.setItem(KEY, s);
		else sessionStorage.removeItem(KEY);
	} catch {
		// Private-mode / disabled storage: the URL still carries the state.
	}
}

/** The remembered query string ('' when there is none). */
export function recallQuery(): string {
	if (!browser) return '';
	try {
		return sessionStorage.getItem(KEY) ?? '';
	} catch {
		return '';
	}
}
