<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';

	const target = `${base}/ja/`;

	onMount(() => {
		location.replace(target);
	});
</script>

<svelte:head>
	<title>Rare Japanese NFTs</title>
	<meta http-equiv="refresh" content={`0; url=${target}`} />
	<link rel="canonical" href={target} />
</svelte:head>

<p>Redirecting to <a href={target}>{target}</a>…</p>
