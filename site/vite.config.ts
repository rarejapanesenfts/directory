import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
	plugins: [sveltekit()],
	server: {
		fs: {
			// allow importing the normalized JSON that lives outside site/ (../data/json)
			allow: [resolve(__dirname, '..')]
		}
	}
});
