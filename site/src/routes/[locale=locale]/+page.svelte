<script lang="ts">
	import { nfts, series, artists, getSeries } from '$lib/data';
	import { ui, t, type Locale } from '$lib/i18n';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { data } = $props();
	const locale = $derived(data.locale as Locale);

	let query = $state('');
	let seriesId = $state('');
	let artistId = $state('');

	// Precompute a lowercase search haystack (name + series name) per card once.
	const haystacks = new Map<string, string>(
		nfts.map((n) => {
			const s = getSeries(n.seriesId);
			return [n.id, `${n.name} ${s?.name ?? ''} ${s?.collectionName ?? ''}`.toLowerCase()];
		})
	);

	const filtered = $derived.by(() => {
		const q = query.trim().toLowerCase();
		return nfts.filter((n) => {
			if (seriesId && n.seriesId !== seriesId) return false;
			if (artistId && n.artistId !== artistId) return false;
			if (q && !haystacks.get(n.id)?.includes(q)) return false;
			return true;
		});
	});
</script>

<Seo
	title={`${ui(locale, 'siteTitle')} — ${ui(locale, 'cards')}`}
	description={ui(locale, 'siteTagline')}
	{locale}
	subpath="/"
/>

<section class="intro">
	<h1>{ui(locale, 'cards')}</h1>
	<p class="lede">{ui(locale, 'siteTagline')}</p>
</section>

<FilterBar {locale} seriesList={series} artistList={artists} bind:query bind:seriesId bind:artistId />

<p class="count">{filtered.length} {ui(locale, 'results')}</p>

{#if filtered.length === 0}
	<p class="empty">{ui(locale, 'noResults')}</p>
{:else}
	<CardGrid cards={filtered} {locale} />
{/if}

<style>
	.intro h1 {
		margin: 0 0 0.25rem;
		font-size: 1.7rem;
	}
	.lede {
		margin: 0;
		color: var(--muted);
	}
	.count {
		color: var(--muted);
		font-size: 0.85rem;
		margin: 0 0 1rem;
	}
	.empty {
		padding: 2rem 0;
		color: var(--muted);
	}
</style>
