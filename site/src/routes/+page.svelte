<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { SITE_URL } from '$lib/site';

	const target = `${base}/ja/`;

	onMount(() => {
		location.replace(target);
	});
</script>

<svelte:head>
	<title>Rare Japanese NFTs</title>
	<meta http-equiv="refresh" content={`0; url=${target}`} />
	<!-- Absolute canonical, consistent with every Seo-rendered page. -->
	<link rel="canonical" href={`${SITE_URL}/ja/`} />
</svelte:head>

<p>Redirecting to <a href={target}>{target}</a>…</p>
