import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// allow importing the normalized JSON that lives outside site/ (../data/json)
			allow: [resolve(__dirname, '..')]
		}
	},
	test: {
		// Unit tests cover the pure modules under src/lib (plus the prerender-entry
		// generator), so nothing here needs a DOM. The few modules that read
		// `browser`/`base` are tested by mocking $app/* explicitly, which keeps the
		// tests independent of the environment vitest happens to run in.
		include: ['src/**/*.{test,spec}.{js,ts}', 'scripts/**/*.{test,spec}.{js,ts}'],
		environment: 'node'
	}
});
