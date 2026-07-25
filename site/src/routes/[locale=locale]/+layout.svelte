<script lang="ts">
	import { ui, type Locale } from '$lib/i18n';
	import { homeUrl } from '$lib/urls';
	import BrandMark from '$lib/components/BrandMark.svelte';
	import LocaleSwitch from '$lib/components/LocaleSwitch.svelte';

	let { data, children } = $props();
	const locale = $derived(data.locale as Locale);
</script>

<header class="site-header">
	<div class="wrap header-inner">
		<a class="brand" href={homeUrl(locale)}>
			<BrandMark />
			<span class="brand-text">
				<strong>{ui(locale, 'siteTitle')}</strong>
				<small>{ui(locale, 'siteTagline')}</small>
			</span>
		</a>
		<nav class="lang">
			<LocaleSwitch {locale} />
		</nav>
	</div>
</header>

<main class="wrap">
	{@render children()}
</main>

<footer class="site-footer">
	<div class="wrap">
		<p>Rare Japanese NFTs — {ui(locale, 'siteTagline')}</p>
	</div>
</footer>
