import { describe, it, expect, vi, afterEach } from 'vitest';

// SITE_URL is captured at import time, so each case re-imports the module with a
// fresh env.
async function load(siteUrl?: string) {
	vi.resetModules();
	if (siteUrl === undefined) vi.stubEnv('PUBLIC_SITE_URL', '');
	else vi.stubEnv('PUBLIC_SITE_URL', siteUrl);
	return import('./site');
}

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

describe('SITE_URL', () => {
	it('defaults to the GitHub Pages project url', async () => {
		const { SITE_URL } = await load();
		expect(SITE_URL).toBe('https://rarejapanesenfts.github.io/directory');
	});

	it('can be overridden at build time', async () => {
		const { SITE_URL } = await load('https://rarejapanesenfts.com');
		expect(SITE_URL).toBe('https://rarejapanesenfts.com');
	});

	it('strips trailing slashes so paths concatenate cleanly', async () => {
		const { SITE_URL } = await load('https://example.test/');
		expect(SITE_URL).toBe('https://example.test');

		const { SITE_URL: multi } = await load('https://example.test///');
		expect(multi).toBe('https://example.test');
	});

	it('never ends with a slash', async () => {
		const { SITE_URL } = await load();
		expect(SITE_URL.endsWith('/')).toBe(false);
	});
});

describe('SITE_NAME', () => {
	it('is the site title used in OGP metadata', async () => {
		const { SITE_NAME } = await load();
		expect(SITE_NAME).toBe('Rare Japanese NFTs');
	});
});
