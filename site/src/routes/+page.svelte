<script lang="ts">
	import { base } from '$app/paths';
	import { onMount } from 'svelte';
	import { ui } from '$lib/i18n';
	import Seo from '$lib/components/Seo.svelte';

	const target = `${base}/ja/`;

	onMount(() => {
		location.replace(target);
	});
</script>

<!-- The bare site root is the URL people paste when they share the directory
     itself, so it needs the full OGP set even though a reader never stops here.
     Seo emits the same <title> and absolute canonical (SITE_URL/ja/) this page
     used to hand-roll, plus the default share card. -->
<Seo
	title={`${ui('ja', 'siteTitle')} — ${ui('ja', 'siteTagline')}`}
	description={ui('ja', 'siteIntro')}
	locale="ja"
	subpath="/"
/>

<svelte:head>
	<meta http-equiv="refresh" content={`0; url=${target}`} />
</svelte:head>

<p>Redirecting to <a href={target}>{target}</a>…</p>
