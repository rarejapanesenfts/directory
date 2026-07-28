import { describe, it, expect, vi } from 'vitest';

// During prerender there is no sessionStorage at all: the guards must short
// circuit before touching it, or the build would crash.
vi.mock('$app/environment', () => ({ browser: false }));

const { rememberQuery, recallQuery } = await import('./search');

describe('off the browser', () => {
	it('does not touch storage when remembering', () => {
		const setItem = vi.fn();
		vi.stubGlobal('sessionStorage', { setItem, getItem: vi.fn(), removeItem: vi.fn() });

		rememberQuery({ q: 'pepe', series: '', artist: '' });

		expect(setItem).not.toHaveBeenCalled();
		vi.unstubAllGlobals();
	});

	it('recalls an empty string without a global sessionStorage', () => {
		expect(recallQuery()).toBe('');
	});
});
