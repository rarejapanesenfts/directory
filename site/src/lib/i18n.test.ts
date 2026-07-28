import { describe, it, expect } from 'vitest';
import { isLocale, otherLocale, t, ui, LOCALES, type UiKey } from './i18n';

describe('isLocale', () => {
	it('accepts the two supported locales', () => {
		expect(isLocale('ja')).toBe(true);
		expect(isLocale('en')).toBe(true);
	});

	it('rejects anything else', () => {
		expect(isLocale('fr')).toBe(false);
		expect(isLocale('')).toBe(false);
		expect(isLocale('JA')).toBe(false);
		expect(isLocale('ja-JP')).toBe(false);
	});
});

describe('otherLocale', () => {
	it('swaps the locale', () => {
		expect(otherLocale('ja')).toBe('en');
		expect(otherLocale('en')).toBe('ja');
	});
});

describe('t', () => {
	it('returns the requested language when present', () => {
		expect(t({ ja: 'ねこ', en: 'cat' }, 'ja')).toBe('ねこ');
		expect(t({ ja: 'ねこ', en: 'cat' }, 'en')).toBe('cat');
	});

	it('falls back to the other language when the requested one is null', () => {
		expect(t({ ja: null, en: 'cat' }, 'ja')).toBe('cat');
		expect(t({ ja: 'ねこ', en: null }, 'en')).toBe('ねこ');
	});

	it('treats an empty string as missing and falls back', () => {
		expect(t({ ja: '', en: 'cat' }, 'ja')).toBe('cat');
	});

	it('returns an empty string when both languages are missing', () => {
		expect(t({ ja: null, en: null }, 'ja')).toBe('');
		expect(t({ ja: '', en: '' }, 'en')).toBe('');
	});

	it('tolerates null/undefined values', () => {
		expect(t(null, 'ja')).toBe('');
		expect(t(undefined, 'en')).toBe('');
	});
});

describe('ui', () => {
	// Key parity between ja/en is enforced by the UiKey type at compile time, so
	// this only checks that no entry is an empty placeholder.
	const KEYS: UiKey[] = [
		'siteTitle',
		'siteTagline',
		'siteIntro',
		'allCards',
		'browseCards',
		'featuredSeries',
		'featuredSeriesLead',
		'works',
		'worksLabel',
		'series',
		'artists',
		'artist',
		'search',
		'searchPlaceholder',
		'allSeries',
		'allArtists',
		'issued',
		'totalSupply',
		'card',
		'links',
		'noDescription',
		'results',
		'noResults',
		'backToList',
		'viewSeries',
		'collection',
		'artistComment',
		'details',
		'website',
		'switchLanguage',
		'langLabel',
		'prevSlide',
		'nextSlide',
		'gotoSlide',
		'notFound',
		'notFoundBody'
	];

	it('returns locale-specific strings', () => {
		expect(ui('ja', 'artists')).toBe('アーティスト');
		expect(ui('en', 'artists')).toBe('Artists');
	});

	it('has a non-empty string for every key in every locale', () => {
		for (const locale of LOCALES) {
			for (const key of KEYS) {
				expect(ui(locale, key), `${locale}.${key}`).toBeTruthy();
			}
		}
	});

	it('keeps the {n} placeholder in the slide label', () => {
		for (const locale of LOCALES) {
			expect(ui(locale, 'gotoSlide')).toContain('{n}');
		}
	});
});
