<script lang="ts">
	import type { Nft } from '$lib/data/types';
	import type { Locale } from '$lib/i18n';
	import CardTile from './CardTile.svelte';

	let { cards, locale }: { cards: Nft[]; locale: Locale } = $props();
</script>

<div class="grid">
	{#each cards as nft (nft.id)}
		<CardTile {nft} {locale} />
	{/each}
</div>

<style>
	.grid {
		display: grid;
		/* Small phones (down to 320px): always 2 columns. minmax(0,1fr) keeps
		   long names from blowing out the track. auto-fill takes over ≥480px. */
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}
	@media (min-width: 480px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
			gap: 1rem;
		}
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		}
	}
</style>
