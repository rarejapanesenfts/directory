import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getArtist, getCardsByArtist } from '$lib/data';

export const load: PageLoad = ({ params }) => {
	const a = getArtist(params.id);
	if (!a) throw error(404, `Unknown artist: ${params.id}`);
	return { artist: a, cards: getCardsByArtist(a.id) };
};
