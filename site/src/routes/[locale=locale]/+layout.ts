import type { LayoutLoad } from './$types';
import { isLocale, type Locale } from '$lib/i18n';
import { error } from '@sveltejs/kit';

export const load: LayoutLoad = ({ params }) => {
	if (!isLocale(params.locale)) throw error(404, 'Unknown locale');
	return { locale: params.locale as Locale };
};
