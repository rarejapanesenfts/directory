import { describe, it, expect } from 'vitest';
import { resolveImage } from './images';
import manifest from './data/images.json';

const entries = Object.entries(manifest as Record<string, { thumb: string; full: string }>);

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

	it('resolves every entry in the manifest', () => {
		for (const [source] of entries) {
			const resolved = resolveImage(source);
			expect(resolved, source).not.toBeNull();
			expect(resolved!.thumb, source).toMatch(/\.webp$/);
			expect(resolved!.full, source).toMatch(/\.webp$/);
		}
	});
});
