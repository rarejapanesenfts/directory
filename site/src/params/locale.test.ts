import { describe, it, expect } from 'vitest';
import { match } from './locale';

describe('locale param matcher', () => {
	it('matches the two supported locales', () => {
		expect(match('ja')).toBe(true);
		expect(match('en')).toBe(true);
	});

	it('rejects anything else, so unknown prefixes 404 instead of rendering', () => {
		for (const value of ['fr', '', 'JA', 'ja-JP', 'cards', 'en/']) {
			expect(match(value), value).toBe(false);
		}
	});
});
