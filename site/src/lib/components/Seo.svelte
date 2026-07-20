<script lang="ts">
	import { SITE_URL, SITE_NAME } from '$lib/site';
	import { LOCALES, type Locale } from '$lib/i18n';

	// `subpath` is the locale-independent path (base- and locale-less),
	// e.g. '/', '/cards/foo/', '/artists/%E3%81%BE%E3%82%8B/'. The component
	// derives absolute canonical/OGP/hreflang URLs (which must be absolute).
	let {
		title,
		description = '',
		locale,
		subpath,
		image
	}: {
		title: string;
		description?: string;
		locale: Locale;
		subpath: string;
		image?: string | null;
	} = $props();

	const url = (loc: Locale) => `${SITE_URL}/${loc}${subpath}`;
	const canonical = $derived(url(locale));
	const ogImage = $derived(
		image ? (image.startsWith('http') ? image : `${SITE_URL}/${image.replace(/^\//, '')}`) : null
	);
	const ogLocale = (loc: Locale) => (loc === 'ja' ? 'ja_JP' : 'en_US');
</script>

<svelte:head>
	<title>{title}</title>
	{#if description}<meta name="description" content={description} />{/if}
	<link rel="canonical" href={canonical} />

	{#each LOCALES as loc}
		<link rel="alternate" hreflang={loc} href={url(loc)} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={url('ja')} />

	<meta property="og:type" content="website" />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	{#if description}<meta property="og:description" content={description} />{/if}
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={ogLocale(locale)} />
	{#if ogImage}<meta property="og:image" content={ogImage} />{/if}

	<meta name="twitter:card" content={ogImage ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={title} />
	{#if description}<meta name="twitter:description" content={description} />{/if}
	{#if ogImage}<meta name="twitter:image" content={ogImage} />{/if}
</svelte:head>
