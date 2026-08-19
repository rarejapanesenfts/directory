import { describe, it, expect } from 'vitest';
import { resolveImage } from './images';
import manifest from './data/images.json';

const entries = Object.entries(
	manifest as Record<string, { thumb: string; full: string; og: string }>
);

describe('resolveImage', () => {
	it('returns null without a source', () => {
		expect(resolveImage(null)).toBeNull();
		expect(resolveImage(undefined)).toBeNull();
		expect(resolveImage('')).toBeNull();
	});

	it('returns null for a card that has no optimized image', () => {
		expect(resolveImage('NOT-IN-THE-MANIFEST.png')).toBeNull();
	});

	it('resolves a known manifest entry', () => {
		const [source, entry] = entries[0];
		const resolved = resolveImage(source);

		expect(resolved).not.toBeNull();
		expect(resolved!.thumb).toBe(`/${entry.thumb}`);
		expect(resolved!.full).toBe(`/${entry.full}`);
		expect(resolved!.width).toBeGreaterThan(0);
		expect(resolved!.height).toBeGreaterThan(0);
	});

	it('keeps rawFull base-less for absolute OGP urls', () => {
		const [source, entry] = entries[0];
		const resolved = resolveImage(source)!;

		expect(resolved.rawFull).toBe(entry.full);
		expect(resolved.rawFull.startsWith('/')).toBe(false);
	});

	it('keeps og base-less too, so ogImageUrl can join it onto SITE_URL', () => {
		const [source, entry] = entries[0];
		const resolved = resolveImage(source)!;

		expect(resolved.og).toBe(entry.og);
		expect(resolved.og.startsWith('/')).toBe(false);
	});

	it('resolves every entry in the manifest', () => {
		for (const [source] of entries) {
			const resolved = resolveImage(source);
			expect(resolved, source).not.toBeNull();
			expect(resolved!.thumb, source).toMatch(/\.webp$/);
			expect(resolved!.full, source).toMatch(/\.webp$/);
		}
	});

	it('gives every entry a jpeg share card', () => {
		// JPEG rather than the WebP above is the point: X and LINE do not render
		// a WebP og:image at all.
		for (const [source] of entries) {
			expect(resolveImage(source)!.og, source).toMatch(/^og\/[^/]+\.jpg$/);
		}
	});

	it('gives each card its own share card', () => {
		// The default card is the one legitimate duplicate — a card whose OG
		// encode failed falls back to it.
		const cards = entries.map(([, e]) => e.og).filter((og) => og !== 'og/default.jpg');
		expect(new Set(cards).size).toBe(cards.length);
	});
});
