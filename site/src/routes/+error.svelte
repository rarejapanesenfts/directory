<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';
</script>

<svelte:head>
	<title>{page.status} — Rare Japanese NFTs</title>
</svelte:head>

<div class="error wrap">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? 'Page not found'}</p>
	<p><a href={`${base}/ja/`}>← Rare Japanese NFTs</a></p>
</div>

<style>
	.error {
		text-align: center;
		padding: 4rem 1rem;
	}
	.error h1 {
		font-size: 3rem;
		margin: 0;
		color: var(--accent);
	}
</style>
