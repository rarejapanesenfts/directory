<script lang="ts">
	import { ui, t, type Locale } from '$lib/i18n';
	import { homeUrl } from '$lib/urls';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { data } = $props();
	const locale = $derived(data.locale as Locale);
	const series = $derived(data.series);
	const cards = $derived(data.cards);
	const description = $derived(t(series.description, locale));
</script>

<Seo
	title={`${series.name} — ${ui(locale, 'siteTitle')}`}
	description={description ||
		`${series.collectionName} — ${series.name} (${cards.length} ${ui(locale, 'results')})`}
	{locale}
	subpath={`/series/${series.id}/`}
/>

<nav class="crumbs">
	<a href={homeUrl(locale)}>← {ui(locale, 'backToList')}</a>
</nav>

<header class="page-head">
	<p class="kicker">{ui(locale, 'collection')}: {series.collectionName}</p>
	<h1>{series.name}</h1>
	{#if description}<p class="desc">{description}</p>{/if}
	<p class="count">{cards.length} {ui(locale, 'results')}</p>
</header>

<CardGrid {cards} {locale} />

<style>
	.crumbs {
		margin: 0.5rem 0 1.25rem;
		font-size: 0.9rem;
	}
	.page-head {
		margin-bottom: 1.5rem;
	}
	.kicker {
		margin: 0 0 0.25rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.page-head h1 {
		margin: 0 0 0.4rem;
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
