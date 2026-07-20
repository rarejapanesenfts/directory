import type { Localized } from './data/types';

export type Locale = 'ja' | 'en';

export const LOCALES: Locale[] = ['ja', 'en'];

export function isLocale(value: string): value is Locale {
	return value === 'ja' || value === 'en';
}

export const otherLocale = (locale: Locale): Locale => (locale === 'ja' ? 'en' : 'ja');

/**
 * Resolve a localized value for the given locale. Falls back to the other
 * language when the requested one is null (descriptions/bios are null-heavy),
 * and returns '' when both are null so the UI can hide the field.
 */
export function t(value: Localized | null | undefined, locale: Locale): string {
	if (!value) return '';
	const primary = value[locale];
	if (primary != null && primary !== '') return primary;
	const fallback = value[otherLocale(locale)];
	return fallback ?? '';
}

/** Static UI strings (labels/nav). Kept tiny and inline — no i18n library. */
const UI = {
	ja: {
		siteTitle: 'Rare Japanese NFTs',
		siteTagline: '日本発クラシックNFTディレクトリ',
		cards: 'カード',
		series: 'シリーズ',
		artists: 'アーティスト',
		artist: 'アーティスト',
		search: '検索',
		searchPlaceholder: '名前・シリーズで検索…',
		allSeries: 'すべてのシリーズ',
		allArtists: 'すべてのアーティスト',
		issued: '発行時期',
		totalSupply: '発行数',
		card: 'カード番号',
		links: 'リンク',
		noImage: '画像なし',
		noDescription: '解説はまだありません。',
		noBio: '紹介文はまだありません。',
		results: '件',
		noResults: '該当するカードがありません。',
		backToList: 'カード一覧へ',
		viewSeries: 'このシリーズを見る',
		viewArtist: 'このアーティストを見る',
		collection: 'コレクション',
		website: 'ウェブサイト',
		notFound: 'ページが見つかりません',
		notFoundBody: 'お探しのページは存在しないか、移動しました。'
	},
	en: {
		siteTitle: 'Rare Japanese NFTs',
		siteTagline: 'A directory of classic Japanese NFTs',
		cards: 'Cards',
		series: 'Series',
		artists: 'Artists',
		artist: 'Artist',
		search: 'Search',
		searchPlaceholder: 'Search by name or series…',
		allSeries: 'All series',
		allArtists: 'All artists',
		issued: 'Issued',
		totalSupply: 'Total supply',
		card: 'Card no.',
		links: 'Links',
		noImage: 'No image',
		noDescription: 'No description yet.',
		noBio: 'No bio yet.',
		results: 'results',
		noResults: 'No cards match your filters.',
		backToList: 'Back to cards',
		viewSeries: 'View this series',
		viewArtist: 'View this artist',
		collection: 'Collection',
		website: 'Website',
		notFound: 'Page not found',
		notFoundBody: 'The page you are looking for does not exist or has moved.'
	}
} as const;

export type UiKey = keyof (typeof UI)['ja'];

export function ui(locale: Locale, key: UiKey): string {
	return UI[locale][key];
}
