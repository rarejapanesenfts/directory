import { describe, it, expect, vi, afterEach } from 'vitest';

// og.ts reads SITE_URL, which site.ts captures at import time — so each case
// that cares about the host re-imports with a fresh env (same shape as
// site.test.ts).
async function load(siteUrl?: string) {
	vi.resetModules();
	vi.stubEnv('PUBLIC_SITE_URL', siteUrl ?? '');
	return import('./og');
}

afterEach(() => {
	vi.unstubAllEnvs();
	vi.resetModules();
});

describe('ogImageUrl', () => {
	it('falls back to the default card when there is no image', async () => {
		const { ogImageUrl, DEFAULT_OG_IMAGE } = await load();
		const expected = `https://rarejapanesenfts.github.io/directory/${DEFAULT_OG_IMAGE}`;

		expect(ogImageUrl(null)).toBe(expected);
		expect(ogImageUrl(undefined)).toBe(expected);
		expect(ogImageUrl('')).toBe(expected);
	});

	it('makes a manifest-relative path absolute', async () => {
		const { ogImageUrl } = await load();
		expect(ogImageUrl('og/batcorn.jpg')).toBe(
			'https://rarejapanesenfts.github.io/directory/og/batcorn.jpg'
		);
	});

	it('does not double the slash on a leading-slash path', async () => {
		const { ogImageUrl } = await load();
		expect(ogImageUrl('/og/batcorn.jpg')).toBe(
			'https://rarejapanesenfts.github.io/directory/og/batcorn.jpg'
		);
		expect(ogImageUrl('///og/batcorn.jpg')).toBe(
			'https://rarejapanesenfts.github.io/directory/og/batcorn.jpg'
		);
	});

	it('passes an already-absolute url through untouched', async () => {
		const { ogImageUrl } = await load();
		expect(ogImageUrl('https://cdn.example.test/a.jpg')).toBe('https://cdn.example.test/a.jpg');
		expect(ogImageUrl('http://cdn.example.test/a.jpg')).toBe('http://cdn.example.test/a.jpg');
	});

	it('follows a PUBLIC_SITE_URL override', async () => {
		const { ogImageUrl } = await load('https://rarejapanesenfts.com');
		expect(ogImageUrl('og/batcorn.jpg')).toBe('https://rarejapanesenfts.com/og/batcorn.jpg');
	});

	it('always returns an absolute url — crawlers do not resolve relative ones', async () => {
		const { ogImageUrl } = await load();
		for (const input of [null, '', 'og/a.jpg', '/og/a.jpg']) {
			expect(ogImageUrl(input), String(input)).toMatch(/^https?:\/\//);
		}
	});

	it('ignores $app/paths base — SITE_URL already carries it', async () => {
		// Guards the one mistake this module exists to prevent: running the path
		// through asset() as well would yield .../directory/directory/og/a.jpg.
		vi.doMock('$app/paths', () => ({ base: '/directory' }));
		const { ogImageUrl } = await load();
		expect(ogImageUrl('og/a.jpg')).toBe('https://rarejapanesenfts.github.io/directory/og/a.jpg');
		vi.doUnmock('$app/paths');
	});
});

describe('OG image constants', () => {
	it('describe the 1.91:1 canvas the optimizer renders', async () => {
		const { OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE } = await load();
		expect(OG_IMAGE_WIDTH).toBe(1200);
		expect(OG_IMAGE_HEIGHT).toBe(630);
		expect(OG_IMAGE_TYPE).toBe('image/jpeg');
		// Every major crawler wants ~1.91:1; drifting off it reintroduces the
		// center-cropping this whole pipeline exists to avoid. 1200/630 is
		// 1.9048, so this is a band rather than an equality.
		const ratio = OG_IMAGE_WIDTH / OG_IMAGE_HEIGHT;
		expect(ratio).toBeGreaterThan(1.85);
		expect(ratio).toBeLessThan(1.95);
	});

	it('points the default card at a jpeg, not the webp assets', async () => {
		const { DEFAULT_OG_IMAGE } = await load();
		expect(DEFAULT_OG_IMAGE).toBe('og/default.jpg');
		expect(DEFAULT_OG_IMAGE.startsWith('/')).toBe(false);
	});
});
