import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// rememberQuery/recallQuery are no-ops off the browser, so pin `browser` to true
// rather than relying on whichever environment vitest runs in.
vi.mock('$app/environment', () => ({ browser: true }));

const { rememberQuery, recallQuery } = await import('./search');

const KEY = 'rjn:list-query';

function stubStorage(): Map<string, string> {
	const store = new Map<string, string>();
	vi.stubGlobal('sessionStorage', {
		getItem: (k: string) => store.get(k) ?? null,
		setItem: (k: string, v: string) => void store.set(k, v),
		removeItem: (k: string) => void store.delete(k)
	});
	return store;
}

beforeEach(() => {
	stubStorage();
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('rememberQuery / recallQuery', () => {
	it('round-trips an active query', () => {
		rememberQuery({ q: 'pepe', series: 'memorychain/series-7', artist: '' });
		expect(recallQuery()).toBe('?q=pepe&series=memorychain%2Fseries-7');
	});

	it('recalls an empty string when nothing was stored', () => {
		expect(recallQuery()).toBe('');
	});

	it('clears the stored query when the filters are reset', () => {
		rememberQuery({ q: 'pepe', series: '', artist: '' });
		expect(recallQuery()).not.toBe('');

		rememberQuery({ q: '', series: '', artist: '' });
		expect(recallQuery()).toBe('');
	});

	it('stores under a namespaced key', () => {
		const store = stubStorage();
		rememberQuery({ q: 'pepe', series: '', artist: '' });
		expect(store.get(KEY)).toBe('?q=pepe');
	});

	it('survives storage that throws (private mode / disabled storage)', () => {
		vi.stubGlobal('sessionStorage', {
			getItem: () => {
				throw new Error('denied');
			},
			setItem: () => {
				throw new Error('denied');
			},
			removeItem: () => {
				throw new Error('denied');
			}
		});

		expect(() => rememberQuery({ q: 'pepe', series: '', artist: '' })).not.toThrow();
		expect(recallQuery()).toBe('');
	});
});
