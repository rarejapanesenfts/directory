import { describe, it, expect } from 'vitest';
import { readQuery, queryString, buildHaystacks, filterCards, type ListQuery } from './search';
import type { Nft } from './data/types';

const url = (search: string) => new URL(`https://example.test/ja/${search}`);

describe('readQuery', () => {
	it('defaults every field to an empty string', () => {
		expect(readQuery(url(''))).toEqual({ q: '', series: '', artist: '' });
	});

	it('reads the three supported params', () => {
		expect(readQuery(url('?q=pepe&series=memorychain/series-7&artist=aya'))).toEqual({
			q: 'pepe',
			series: 'memorychain/series-7',
			artist: 'aya'
		});
	});

	it('decodes percent-encoded values', () => {
		expect(readQuery(url(`?artist=${encodeURIComponent('だいふく')}`)).artist).toBe('だいふく');
	});

	it('ignores unrelated params', () => {
		expect(readQuery(url('?page=2#cards')).q).toBe('');
	});
});

describe('queryString', () => {
	it('returns an empty string when nothing is set', () => {
		expect(queryString({ q: '', series: '', artist: '' })).toBe('');
	});

	it('omits empty fields', () => {
		expect(queryString({ q: 'pepe', series: '', artist: '' })).toBe('?q=pepe');
	});

	it('serializes every set field', () => {
		const s = queryString({ q: 'pepe', series: 'memorychain/series-7', artist: 'aya' });
		expect(s.startsWith('?')).toBe(true);
		expect(readQuery(url(s))).toEqual({
			q: 'pepe',
			series: 'memorychain/series-7',
			artist: 'aya'
		});
	});

	it('round-trips non-ascii and reserved characters', () => {
		const query: ListQuery = { q: 'ねこ & いぬ', series: '', artist: 'だいふく' };
		expect(readQuery(url(queryString(query)))).toEqual({ ...query, series: '' });
	});
});

// Minimal fixtures: filtering must not depend on the real dataset. The series
// label part of the haystack is exercised by the real-data test below.
const card = (over: Partial<Nft>): Nft =>
	({
		id: 'X',
		name: 'X',
		slug: { en: null, ja: null },
		description: { en: null, ja: null },
		artistId: 'someone',
		seriesId: 'coll/series-1',
		card: null,
		issued: { date: null, display: { en: null, ja: null } },
		totalSupply: null,
		chains: [],
		image: { source: 'X.png', local: null },
		publishedAt: null,
		translationKey: null,
		...over
	}) as Nft;

const cards = [
	card({ id: 'PEPEBAZAAR', name: 'PEPEBAZAAR', artistId: 'aya', seriesId: 'coll/series-1' }),
	card({ id: 'NEMCAT', name: 'NEMCAT', artistId: 'aya', seriesId: 'coll/series-2' }),
	card({ id: 'BIGMAN', name: 'BIGMAN', artistId: 'くわ', seriesId: 'coll/series-1' })
];

const haystacks = new Map([
	['PEPEBAZAAR', 'pepebazaar collection — series 1'],
	['NEMCAT', 'nemcat collection — series 2'],
	['BIGMAN', 'bigman collection — series 1']
]);

const ids = (list: Nft[]) => list.map((n) => n.id);

describe('filterCards', () => {
	const empty: ListQuery = { q: '', series: '', artist: '' };

	it('returns everything when no filter is set', () => {
		expect(ids(filterCards(cards, haystacks, empty))).toEqual([
			'PEPEBAZAAR',
			'NEMCAT',
			'BIGMAN'
		]);
	});

	it('filters by series', () => {
		expect(ids(filterCards(cards, haystacks, { ...empty, series: 'coll/series-2' }))).toEqual([
			'NEMCAT'
		]);
	});

	it('filters by artist, including non-ascii ids', () => {
		expect(ids(filterCards(cards, haystacks, { ...empty, artist: 'くわ' }))).toEqual(['BIGMAN']);
	});

	it('matches the text query case-insensitively', () => {
		expect(ids(filterCards(cards, haystacks, { ...empty, q: 'PePe' }))).toEqual(['PEPEBAZAAR']);
	});

	it('matches on the series part of the haystack, not just the name', () => {
		expect(ids(filterCards(cards, haystacks, { ...empty, q: 'series 1' }))).toEqual([
			'PEPEBAZAAR',
			'BIGMAN'
		]);
	});

	it('ignores surrounding whitespace in the query', () => {
		expect(ids(filterCards(cards, haystacks, { ...empty, q: '  nemcat  ' }))).toEqual(['NEMCAT']);
	});

	it('combines filters with AND', () => {
		expect(
			ids(filterCards(cards, haystacks, { q: 'series 1', series: 'coll/series-1', artist: 'aya' }))
		).toEqual(['PEPEBAZAAR']);
	});

	it('returns an empty list when nothing matches', () => {
		expect(filterCards(cards, haystacks, { ...empty, q: 'nothing-here' })).toEqual([]);
	});

	it('drops cards missing from the haystack map once a query is typed', () => {
		expect(filterCards(cards, new Map(), { ...empty, q: 'pepe' })).toEqual([]);
	});

	it('does not mutate the input list', () => {
		const input = [...cards];
		filterCards(input, haystacks, { ...empty, q: 'pepe' });
		expect(input).toEqual(cards);
	});
});

describe('buildHaystacks (real data)', () => {
	it('lowercases name and series label together', async () => {
		const { nfts, getSeries, seriesLabel } = await import('./data');
		const built = buildHaystacks(nfts);

		expect(built.size).toBe(nfts.length);

		const sample = nfts[0];
		const s = getSeries(sample.seriesId);
		expect(built.get(sample.id)).toBe(
			`${sample.name} ${s ? seriesLabel(s) : ''}`.toLowerCase()
		);
		expect(built.get(sample.id)).toBe(built.get(sample.id)?.toLowerCase());
	});

	it('lets a card be found by its series name', async () => {
		const { nfts, getSeries, seriesLabel } = await import('./data');
		const built = buildHaystacks(nfts);
		const sample = nfts.find((n) => getSeries(n.seriesId)) as (typeof nfts)[number];
		const label = seriesLabel(getSeries(sample.seriesId)!);

		const hits = filterCards(nfts, built, { q: label, series: '', artist: '' });
		expect(hits.map((n) => n.id)).toContain(sample.id);
	});
});
