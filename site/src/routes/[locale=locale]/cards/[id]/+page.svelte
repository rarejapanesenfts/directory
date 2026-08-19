<script lang="ts">
	import { ui, t, type Locale } from '$lib/i18n';
	import { seriesUrl, artistUrl } from '$lib/urls';
	import { seriesLabel } from '$lib/data';
	import { resolveImage } from '$lib/images';
	import { parseDescription } from '$lib/description';
	import BackToList from '$lib/components/BackToList.svelte';
	import Placeholder from '$lib/components/Placeholder.svelte';
	import Seo from '$lib/components/Seo.svelte';

	let { data } = $props();
	const locale = $derived(data.locale as Locale);
	const card = $derived(data.card);

	const img = $derived(resolveImage(card.image?.source));
	// "アーティストからのコメント" is a label baked into the exported prose; split
	// it off so it can be rendered as one (and not as a stray line of body text).
	const description = $derived(parseDescription(t(card.description, locale)));
	const issued = $derived(t(card.issued?.display, locale));

	const seoDesc = $derived(
		description.body ||
			[card.series ? seriesLabel(card.series) : '', card.artist ? t(card.artist.name, locale) : '', issued]
				.filter(Boolean)
				.join(' · ')
	);
</script>

<Seo
	title={`${card.name} — ${ui(locale, 'siteTitle')}`}
	description={seoDesc.slice(0, 200)}
	{locale}
	subpath={`/cards/${card.id}/`}
	image={img?.og}
	imageAlt={card.name}
	ogType="article"
/>

<BackToList {locale} />

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

		<p class="desc">{description.body || ui(locale, 'noDescription')}</p>

		{#if description.artistComment}
			<figure class="comment">
				<figcaption class="label">{ui(locale, 'artistComment')}</figcaption>
				<blockquote>{description.artistComment}</blockquote>
			</figure>
		{/if}

		<section class="facts-block">
			<h2 class="label">{ui(locale, 'details')}</h2>
			<dl class="facts">
				{#if card.series}
					<div class="fact">
						<dt>{ui(locale, 'series')}</dt>
						<dd><a href={seriesUrl(locale, card.series.id)}>{seriesLabel(card.series)}</a></dd>
					</div>
				{/if}
				{#if issued}
					<div class="fact">
						<dt>{ui(locale, 'issued')}</dt>
						<dd>{issued}</dd>
					</div>
				{/if}
				{#if card.card != null}
					<div class="fact">
						<dt>{ui(locale, 'card')}</dt>
						<dd>#{card.card}</dd>
					</div>
				{/if}
				{#if card.totalSupply != null}
					<div class="fact">
						<dt>{ui(locale, 'totalSupply')}</dt>
						<dd>{card.totalSupply.toLocaleString()}</dd>
					</div>
				{/if}
			</dl>
		</section>

		{#if card.chains?.length}
			<div class="chains">
				<h2 class="label">{ui(locale, 'links')}</h2>
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
		margin: 0;
		line-height: 1.65;
		white-space: pre-line;
	}

	/* Artist comment: a labelled quote, not body copy. */
	.comment {
		margin: 1.5rem 0 0;
	}
	.comment blockquote {
		margin: 0.4rem 0 0;
		padding: 0.85rem 1rem;
		border-left: 3px solid var(--accent);
		border-radius: 0 10px 10px 0;
		background: var(--surface-2);
		line-height: 1.7;
		white-space: pre-line;
	}

	/* Facts: a full-width panel with the label on the left and the value on the
	   right, so the pair spans the column instead of huddling on the left edge. */
	.facts-block {
		margin: 1.75rem 0 0;
	}
	.facts {
		margin: 0.5rem 0 0;
		border: 1px solid var(--border);
		border-radius: 12px;
		background: var(--surface);
		overflow: hidden;
	}
	.fact {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.35rem 1.5rem;
		padding: 0.7rem 0.95rem;
	}
	.fact + .fact {
		border-top: 1px solid var(--border);
	}
	.fact dt {
		color: var(--muted);
		font-size: 0.82rem;
		white-space: nowrap;
	}
	.fact dd {
		margin: 0;
		text-align: right;
		font-size: 0.95rem;
		font-weight: 600;
		overflow-wrap: anywhere;
	}

	.chains {
		margin-top: 1.75rem;
	}
	.chains ul {
		list-style: none;
		padding: 0;
		margin: 0.5rem 0 0;
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
