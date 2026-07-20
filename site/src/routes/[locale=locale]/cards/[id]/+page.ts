import type { PageLoad } from './$types';
import { error } from '@sveltejs/kit';
import { getNft, joinCard } from '$lib/data';

export const load: PageLoad = ({ params }) => {
	const nft = getNft(params.id);
	if (!nft) throw error(404, `Unknown card: ${params.id}`);
	return { card: joinCard(nft) };
};
