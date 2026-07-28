<script lang="ts">
	import { ui, t, type Locale } from '$lib/i18n';
	import { seriesTitle } from '$lib/data';
	import BackToList from '$lib/components/BackToList.svelte';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { data } = $props();
	const locale = $derived(data.locale as Locale);
	const series = $derived(data.series);
	const cards = $derived(data.cards);
	const description = $derived(t(series.description, locale));
</script>

<Seo
	title={`${seriesTitle(series)} — ${ui(locale, 'siteTitle')}`}
	description={description ||
		`${seriesTitle(series)} (${cards.length} ${ui(locale, 'results')})`}
	{locale}
	subpath={`/series/${series.id}/`}
/>

<BackToList {locale} />

<header class="page-head">
	<p class="label">{ui(locale, 'collection')}: {series.collectionName}</p>
	<h1>{seriesTitle(series)}</h1>
	{#if description}<p class="desc">{description}</p>{/if}
	<p class="count">{cards.length} {ui(locale, 'results')}</p>
</header>

<CardGrid {cards} {locale} />

<style>
	.page-head {
		margin-bottom: 1.5rem;
	}
	.page-head h1 {
		margin: 0.25rem 0 0.4rem;
		font-size: 1.7rem;
	}
	.desc {
		max-width: 60ch;
		line-height: 1.6;
	}
	.count {
		color: var(--muted);
		font-size: 0.85rem;
	}
</style>
