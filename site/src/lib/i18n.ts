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
		siteIntro:
			'Counterparty上で発行された日本発のクラシックNFTを、シリーズ・アーティストから辿れるアーカイブです。',
		allCards: 'すべての作品',
		browseCards: '作品を探す',
		featuredSeries: '注目のシリーズ',
		featuredSeriesLead: '各コレクションの代表作をピックアップ。',
		works: '作品',
		worksLabel: '作品',
		series: 'シリーズ',
		artists: 'アーティスト',
		artist: 'アーティスト',
		search: '検索',
		searchPlaceholder: '名前・シリーズで検索…',
		allSeries: '全シリーズ',
		allArtists: '全アーティスト',
		issued: '発行時期',
		totalSupply: '発行数',
		card: 'カード番号',
		links: 'リンク',
		noDescription: '解説はまだありません。',
		results: '件',
		noResults: '該当するカードがありません。',
		backToList: 'カード一覧へ',
		viewSeries: 'このシリーズを見る',
		viewArtist: 'このアーティストを見る',
		collection: 'コレクション',
		artistComment: 'アーティストからのコメント',
		details: '詳細',
		website: 'ウェブサイト',
		switchLanguage: 'English に切り替え',
		langLabel: 'EN',
		prevSlide: '前のシリーズ',
		nextSlide: '次のシリーズ',
		gotoSlide: '{n}番目のシリーズへ',
		notFound: 'ページが見つかりません',
		notFoundBody: 'お探しのページは存在しないか、移動しました。'
	},
	en: {
		siteTitle: 'Rare Japanese NFTs',
		siteTagline: 'A directory of classic Japanese NFTs',
		siteIntro:
			'An archive of classic Japanese NFTs issued on Counterparty, browsable by series and by artist.',
		allCards: 'All works',
		browseCards: 'Browse works',
		featuredSeries: 'Featured series',
		featuredSeriesLead: 'A pick from each collection.',
		works: 'works',
		worksLabel: 'Works',
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
		noDescription: 'No description yet.',
		results: 'results',
		noResults: 'No cards match your filters.',
		backToList: 'Back to cards',
		viewSeries: 'View this series',
		viewArtist: 'View this artist',
		collection: 'Collection',
		artistComment: "Artist's comment",
		details: 'Details',
		website: 'Website',
		switchLanguage: '日本語に切り替え / Switch to Japanese',
		langLabel: '日本語',
		prevSlide: 'Previous series',
		nextSlide: 'Next series',
		gotoSlide: 'Go to series {n}',
		notFound: 'Page not found',
		notFoundBody: 'The page you are looking for does not exist or has moved.'
	}
} as const;

export type UiKey = keyof (typeof UI)['ja'];

export function ui(locale: Locale, key: UiKey): string {
	return UI[locale][key];
}
