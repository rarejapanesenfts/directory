import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { buildPrerenderEntries } from './scripts/prerender-entries.js';

const base = process.env.BASE_PATH ?? '';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),
	kit: {
		adapter: adapter({
			fallback: undefined,
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
