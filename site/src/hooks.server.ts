import type { Handle } from '@sveltejs/kit';
import { base } from '$app/paths';

// Runs at prerender time. Sets the document language from the URL's leading
// locale segment so each generated page has a correct <html lang>.
// event.url.pathname includes the configured base (e.g. "/directory/en/…"),
// so strip base first — otherwise every page's first segment is "directory"
// and all pages (including /en/) fall back to "ja".
export const handle: Handle = ({ event, resolve }) => {
	const seg = event.url.pathname.slice(base.length).split('/').filter(Boolean)[0];
	const lang = seg === 'en' ? 'en' : 'ja';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
