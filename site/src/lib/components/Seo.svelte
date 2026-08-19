<script lang="ts">
	import { SITE_URL, SITE_NAME } from '$lib/site';
	import { LOCALES, type Locale } from '$lib/i18n';
	import { ogImageUrl, OG_IMAGE_WIDTH, OG_IMAGE_HEIGHT, OG_IMAGE_TYPE } from '$lib/og';

	// `subpath` is the locale-independent path (base- and locale-less),
	// e.g. '/', '/cards/foo/', '/artists/%E3%81%BE%E3%82%8B/'. The component
	// derives absolute canonical/OGP/hreflang URLs (which must be absolute).
	//
	// `image` is a manifest-relative share card (`og/foo.jpg` from
	// resolveImage().og). Omitting it is fine and normal — it falls back to the
	// site-wide default card, so every page shares as summary_large_image.
	let {
		title,
		description = '',
		locale,
		subpath,
		image,
		imageAlt,
		ogType = 'website'
	}: {
		title: string;
		description?: string;
		locale: Locale;
		subpath: string;
		image?: string | null;
		imageAlt?: string;
		ogType?: 'website' | 'article';
	} = $props();

	const url = (loc: Locale) => `${SITE_URL}/${loc}${subpath}`;
	const canonical = $derived(url(locale));
	const ogImage = $derived(ogImageUrl(image));
	const ogAlt = $derived(imageAlt || title);
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

	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={SITE_NAME} />
	<meta property="og:title" content={title} />
	{#if description}<meta property="og:description" content={description} />{/if}
	<meta property="og:url" content={canonical} />
	<meta property="og:locale" content={ogLocale(locale)} />
	{#each LOCALES.filter((l) => l !== locale) as loc}
		<meta property="og:locale:alternate" content={ogLocale(loc)} />
	{/each}
	<!-- Declaring the dimensions lets a crawler lay the card out on its first
	     pass instead of holding the preview back until it has fetched the image. -->
	<meta property="og:image" content={ogImage} />
	<meta property="og:image:width" content={String(OG_IMAGE_WIDTH)} />
	<meta property="og:image:height" content={String(OG_IMAGE_HEIGHT)} />
	<meta property="og:image:type" content={OG_IMAGE_TYPE} />
	<meta property="og:image:alt" content={ogAlt} />

	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={title} />
	{#if description}<meta name="twitter:description" content={description} />{/if}
	<meta name="twitter:image" content={ogImage} />
	<meta name="twitter:image:alt" content={ogAlt} />
</svelte:head>
