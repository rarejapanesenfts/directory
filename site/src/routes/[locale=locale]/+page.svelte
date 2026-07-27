<script lang="ts">
	import { onMount } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { nfts, series, artists, getSeries, seriesLabel } from '$lib/data';
	import { featuredSeries } from '$lib/featured';
	import { ui, type Locale } from '$lib/i18n';
	import { queryString, readQuery, rememberQuery } from '$lib/search';
	import CardGrid from '$lib/components/CardGrid.svelte';
	import FilterBar from '$lib/components/FilterBar.svelte';
	import SeriesCarousel from '$lib/components/SeriesCarousel.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { data } = $props();
	const locale = $derived(data.locale as Locale);

	const featured = featuredSeries();

	let query = $state('');
	let seriesId = $state('');
	let artistId = $state('');

	// This page is prerendered, so the query string only exists on the client:
	// read it once after hydration (initial render must match the prerendered
	// HTML), then keep the URL in sync as the reader types. That is what makes
	// "search → open a card → back" come back to the same result set.
	//
	// Everything here reads window.location rather than `page.url`: a shallow
	// replaceState() updates the address bar but not `page.url`, so on a Back
	// into this page `page.url` still carries the pre-search URL.
	let hydrated = $state(false);

	onMount(() => {
		const initial = readQuery(new URL(location.href));
		query = initial.q;
		seriesId = initial.series;
		artistId = initial.artist;
		hydrated = true;
	});

	$effect(() => {
		const current = { q: query, series: seriesId, artist: artistId };
		if (!hydrated) return;
		rememberQuery(current);
		// Replace (not push) so typing doesn't bury the previous page under one
		// history entry per keystroke. The hash, if any, is left alone.
		const next = `${location.pathname}${queryString(current)}${location.hash}`;
		if (next !== `${location.pathname}${location.search}${location.hash}`) {
			replaceState(next, page.state);
		}
	});

	// Precompute a lowercase search haystack (name + series name) per card once.
	const haystacks = new Map<string, string>(
		nfts.map((n) => {
			const s = getSeries(n.seriesId);
			return [n.id, `${n.name} ${s ? seriesLabel(s) : ''}`.toLowerCase()];
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
	title={`${ui(locale, 'siteTitle')} — ${ui(locale, 'siteTagline')}`}
	description={ui(locale, 'siteIntro')}
	{locale}
	subpath="/"
/>

<section class="hero">
	<h1>{ui(locale, 'siteTagline')}</h1>
	<p class="lede">{ui(locale, 'siteIntro')}</p>
	<dl class="stats">
		<div>
			<dt>{ui(locale, 'worksLabel')}</dt>
			<dd>{nfts.length}</dd>
		</div>
		<div>
			<dt>{ui(locale, 'series')}</dt>
			<dd>{series.length}</dd>
		</div>
		<div>
			<dt>{ui(locale, 'artists')}</dt>
			<dd>{artists.length}</dd>
		</div>
	</dl>
	<a class="cta" href="#cards">{ui(locale, 'browseCards')}</a>
</section>

<SeriesCarousel items={featured} {locale} />

<section id="cards" class="browse">
	<h2>{ui(locale, 'allCards')}</h2>

	<FilterBar
		{locale}
		seriesList={series}
		artistList={artists}
		bind:query
		bind:seriesId
		bind:artistId
	/>

	<p class="count">{filtered.length} {ui(locale, 'results')}</p>

	{#if filtered.length === 0}
		<p class="empty">{ui(locale, 'noResults')}</p>
	{:else}
		<CardGrid cards={filtered} {locale} />
	{/if}
</section>

<style>
	.hero {
		padding: 1.75rem 1.5rem 1.85rem;
		border: 1px solid var(--border);
		border-radius: 18px;
		background:
			radial-gradient(
				110% 140% at 100% 0%,
				color-mix(in srgb, var(--accent) 14%, transparent),
				transparent 60%
			),
			var(--surface);
	}
	.hero h1 {
		margin: 0 0 0.5rem;
		font-size: clamp(1.5rem, 4.5vw, 2.2rem);
		line-height: 1.25;
	}
	.lede {
		margin: 0;
		max-width: 58ch;
		color: var(--muted);
		line-height: 1.65;
	}
	.stats {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem 2.25rem;
		margin: 1.35rem 0 0;
	}
	.stats dt {
		font-size: 0.75rem;
		letter-spacing: 0.05em;
		color: var(--muted);
	}
	.stats dd {
		margin: 0.1rem 0 0;
		font-size: 1.35rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
	}
	.cta {
		display: inline-block;
		margin-top: 1.4rem;
		padding: 0.6rem 1.2rem;
		border-radius: 999px;
		background: var(--accent);
		color: var(--accent-fg);
		font-size: 0.9rem;
		font-weight: 600;
		text-decoration: none;
	}
	.cta:hover {
		filter: brightness(1.08);
	}

	/* Phones: keep the hero from eating the whole first screen — the carousel
	   should be visible (or nearly) without scrolling. */
	@media (max-width: 559px) {
		.hero {
			padding: 1.3rem 1.1rem 1.4rem;
			border-radius: 14px;
		}
		.hero h1 {
			font-size: clamp(1.3rem, 6vw, 1.65rem);
			margin-bottom: 0.4rem;
		}
		.lede {
			font-size: 0.9rem;
			line-height: 1.6;
		}
		.stats {
			gap: 0.9rem 1.6rem;
			margin-top: 1.05rem;
		}
		.stats dd {
			font-size: 1.2rem;
		}
		.cta {
			margin-top: 1.05rem;
			padding: 0.65rem 1.1rem;
		}
	}

	.browse {
		scroll-margin-top: 5rem;
	}
	.browse h2 {
		margin: 0;
		font-size: 1.15rem;
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
