<script lang="ts">
	import type { Nft } from '$lib/data/types';
	import type { Locale } from '$lib/i18n';
	import { t } from '$lib/i18n';
	import { cardUrl } from '$lib/urls';
	import { resolveImage } from '$lib/images';
	import { getSeries } from '$lib/data';
	import Placeholder from './Placeholder.svelte';

	let { nft, locale }: { nft: Nft; locale: Locale } = $props();

	const img = $derived(resolveImage(nft.image?.source));
	const series = $derived(getSeries(nft.seriesId));
	const issued = $derived(t(nft.issued?.display, locale));
</script>

<a class="tile" href={cardUrl(locale, nft.id)}>
	<div class="thumb">
		{#if img}
			<img
				src={img.thumb}
				width={img.width}
				height={img.height}
				alt={nft.name}
				loading="lazy"
				decoding="async"
			/>
		{:else}
			<Placeholder name={nft.name} />
		{/if}
	</div>
	<div class="meta">
		<span class="name">{nft.name}</span>
		{#if series}<span class="series">{series.name}</span>{/if}
		{#if issued}<span class="issued">{issued}</span>{/if}
	</div>
</a>

<style>
	.tile {
		display: flex;
		flex-direction: column;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
		text-decoration: none;
		color: inherit;
		transition:
			transform 0.12s ease,
			border-color 0.12s ease,
			box-shadow 0.12s ease;
	}
	.tile:hover {
		transform: translateY(-2px);
		border-color: var(--accent);
		box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
	}
	.thumb {
		aspect-ratio: 1 / 1;
		background: var(--surface-2);
		overflow: hidden;
	}
	.thumb img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
	}
	.meta {
		display: flex;
		flex-direction: column;
		gap: 0.15rem;
		padding: 0.6rem 0.7rem 0.75rem;
	}
	.name {
		font-weight: 600;
		font-size: 0.95rem;
		line-height: 1.25;
		overflow-wrap: anywhere;
	}
	.series,
	.issued {
		font-size: 0.78rem;
		color: var(--muted);
	}
</style>
