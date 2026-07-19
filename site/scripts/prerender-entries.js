// Generates the explicit list of prerender entry URLs from the normalized data.
// Loaded by svelte.config.js (Node context), so it reads the JSON with fs
// rather than through Vite's import pipeline.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(__dirname, '../../data/json');

/** @param {string} name */
function load(name) {
	return JSON.parse(readFileSync(resolve(dataDir, `${name}.json`), 'utf-8'));
}

const LOCALES = ['ja', 'en'];

/** @returns {string[]} */
export function buildPrerenderEntries() {
	const nfts = load('nfts');
	const series = load('series');
	const artists = load('artists');

	/** @type {string[]} */
	const entries = ['/', '/sitemap.xml'];

	for (const locale of LOCALES) {
		entries.push(`/${locale}/`);
		// nft ids are ascii slugs (single segment)
		for (const n of nfts) entries.push(`/${locale}/cards/${n.id}/`);
		// series ids contain '/' (e.g. "badger-capsule/series-1") -> real nested path
		// via the [...id] rest route. All segments are ascii slugs, no escaping needed.
		for (const s of series) entries.push(`/${locale}/series/${s.id}/`);
		// artist ids may contain non-ascii (e.g. Japanese). Entries must be RAW
		// (unencoded): SvelteKit encodes them itself and decodes params on the way
		// in. Pre-encoding here would be passed to load() still percent-encoded.
		for (const a of artists) entries.push(`/${locale}/artists/${a.id}/`);
	}

	return entries;
}
