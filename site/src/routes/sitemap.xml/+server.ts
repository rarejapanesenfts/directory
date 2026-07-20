import { nfts, series, artists } from '$lib/data';
import { LOCALES } from '$lib/i18n';
import { SITE_URL } from '$lib/site';

export const prerender = true;

function urlset(): string[] {
	const paths: string[] = [];
	for (const loc of LOCALES) {
		paths.push(`/${loc}/`);
		for (const n of nfts) paths.push(`/${loc}/cards/${n.id}/`);
		for (const s of series) paths.push(`/${loc}/series/${s.id}/`);
		for (const a of artists) paths.push(`/${loc}/artists/${encodeURIComponent(a.id)}/`);
	}
	return paths;
}

export function GET() {
	const body =
		`<?xml version="1.0" encoding="UTF-8"?>\n` +
		`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
		urlset()
			.map((p) => `\t<url><loc>${SITE_URL}${p}</loc></url>`)
			.join('\n') +
		`\n</urlset>\n`;

	return new Response(body, {
		headers: { 'content-type': 'application/xml' }
	});
}
