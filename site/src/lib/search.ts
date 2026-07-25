// Search/filter state for the card list, kept in the URL so that opening a card
// and coming back (browser Back, or the "back to list" link) restores what the
// reader had typed. The list page is prerendered, so the query string can only
// be read on the client — see the onMount sync in the list page.

import { browser } from '$app/environment';

export type ListQuery = { q: string; series: string; artist: string };

export const EMPTY_QUERY: ListQuery = { q: '', series: '', artist: '' };

export function isEmptyQuery(query: ListQuery): boolean {
	return !query.q && !query.series && !query.artist;
}

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
