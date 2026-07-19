<script lang="ts">
	import { ui, t, type Locale } from '$lib/i18n';
	import { homeUrl, seriesUrl, artistUrl } from '$lib/urls';
	import { resolveImage } from '$lib/images';
	import Placeholder from '$lib/components/Placeholder.svelte';

	let { data } = $props();
	const locale = $derived(data.locale as Locale);
	const card = $derived(data.card);

	const img = $derived(resolveImage(card.image?.source));
	const description = $derived(t(card.description, locale));
	const issued = $derived(t(card.issued?.display, locale));
</script>

<svelte:head>
	<title>{card.name} — {ui(locale, 'siteTitle')}</title>
	{#if description}<meta name="description" content={description.slice(0, 160)} />{/if}
</svelte:head>

<nav class="crumbs">
	<a href={homeUrl(locale)}>← {ui(locale, 'backToList')}</a>
</nav>

<article class="detail">
	<div class="media">
		{#if img}
			<img src={img.full} width={img.width} height={img.height} alt={card.name} />
		{:else}
			<Placeholder name={card.name} />
		{/if}
	</div>

	<div class="info">
		<h1>{card.name}</h1>

		{#if card.artist}
			<p class="byline">
				<a href={artistUrl(locale, card.artist.id)}>{t(card.artist.name, locale)}</a>
			</p>
		{/if}

		<p class="desc">{description || ui(locale, 'noDescription')}</p>

		<dl class="facts">
			{#if card.series}
				<dt>{ui(locale, 'series')}</dt>
				<dd><a href={seriesUrl(locale, card.series.id)}>{card.series.collectionName} — {card.series.name}</a></dd>
			{/if}
			{#if issued}
				<dt>{ui(locale, 'issued')}</dt>
				<dd>{issued}</dd>
			{/if}
			{#if card.card != null}
				<dt>{ui(locale, 'card')}</dt>
				<dd>#{card.card}</dd>
			{/if}
			{#if card.totalSupply != null}
				<dt>{ui(locale, 'totalSupply')}</dt>
				<dd>{card.totalSupply.toLocaleString()}</dd>
			{/if}
		</dl>

		{#if card.chains?.length}
			<div class="chains">
				<h2>{ui(locale, 'links')}</h2>
				<ul>
					{#each card.chains as chain}
						<li>
							<a href={chain.url} target="_blank" rel="noopener noreferrer external">
								{chain.name} ↗
							</a>
						</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
</article>

<style>
	.crumbs {
		margin: 0.5rem 0 1.25rem;
		font-size: 0.9rem;
	}
	.detail {
		display: grid;
		grid-template-columns: 1fr;
		gap: 1.75rem;
		align-items: start;
	}
	@media (min-width: 760px) {
		.detail {
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		}
	}
	.media {
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
		background: var(--surface-2);
	}
	.media img {
		width: 100%;
		height: auto;
		display: block;
	}
	.info h1 {
		margin: 0 0 0.35rem;
		font-size: 1.8rem;
		overflow-wrap: anywhere;
	}
	.byline {
		margin: 0 0 1rem;
		color: var(--muted);
	}
	.desc {
		line-height: 1.65;
		white-space: pre-line;
	}
	.facts {
		display: grid;
		grid-template-columns: auto 1fr;
		gap: 0.35rem 1rem;
		margin: 1.5rem 0;
		font-size: 0.95rem;
	}
	.facts dt {
		color: var(--muted);
	}
	.facts dd {
		margin: 0;
		overflow-wrap: anywhere;
	}
	.chains h2 {
		font-size: 1rem;
		margin: 1.5rem 0 0.5rem;
	}
	.chains ul {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.chains a {
		display: inline-block;
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		font-size: 0.88rem;
		text-decoration: none;
	}
	.chains a:hover {
		border-color: var(--accent);
	}
</style>
