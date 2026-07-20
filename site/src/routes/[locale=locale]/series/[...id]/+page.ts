import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getSeries, getCardsBySeries } from '$lib/data';

export const load: PageLoad = ({ params }) => {
	// [...id] captures the full slug incl. the collection prefix, e.g.
	// "badger-capsule/series-1". With trailingSlash: 'always' the rest param
	// keeps the trailing '/', so strip it before looking up.
	const id = params.id.replace(/\/+$/, '');
	const s = getSeries(id);
	if (!s) throw error(404, `Unknown series: ${id}`);
	return { series: s, cards: getCardsBySeries(s.id) };
};
