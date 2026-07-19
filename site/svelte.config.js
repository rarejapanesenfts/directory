import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { buildPrerenderEntries } from './scripts/prerender-entries.js';

const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			// Emit a 404.html so GitHub Pages serves a branded not-found page for
			// unknown paths (it renders the +error page client-side).
			fallback: '404.html',
			strict: true
		}),
		paths: {
			base
		},
		prerender: {
			entries: buildPrerenderEntries(),
			handleHttpError: 'fail',
			handleMissingId: 'fail'
		}
	}
};

export default config;
