<script lang="ts">
	import { page } from '$app/state';
	import { base } from '$app/paths';

	// 404.html is rendered client-side, so infer the reader's locale from the
	// URL and send them back to the matching home instead of always /ja/.
	const isEn = $derived(page.url?.pathname?.includes('/en/') ?? false);
	const locale = $derived(isEn ? 'en' : 'ja');
	const home = $derived(`${base}/${locale}/`);
	const label = $derived(isEn ? 'Rare Japanese NFTs' : 'Rare Japanese NFTs へ');
	const notFound = $derived(isEn ? 'Page not found' : 'ページが見つかりません');
</script>

<svelte:head>
	<title>{page.status} — Rare Japanese NFTs</title>
</svelte:head>

<div class="error wrap">
	<h1>{page.status}</h1>
	<p>{page.error?.message ?? notFound}</p>
	<p><a href={home}>← {label}</a></p>
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
