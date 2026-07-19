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
		grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
		gap: 1rem;
	}
	@media (min-width: 640px) {
		.grid {
			grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
		}
	}
</style>
