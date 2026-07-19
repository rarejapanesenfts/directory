import type { Handle } from '@sveltejs/kit';

// Runs at prerender time. Sets the document language from the URL's leading
// locale segment so each generated page has a correct <html lang>.
export const handle: Handle = ({ event, resolve }) => {
	const seg = event.url.pathname.split('/').filter(Boolean)[0];
	const lang = seg === 'en' ? 'en' : 'ja';
	return resolve(event, {
		transformPageChunk: ({ html }) => html.replace('%lang%', lang)
	});
};
