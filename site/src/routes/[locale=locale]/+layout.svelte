<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { ui, otherLocale, type Locale } from '$lib/i18n';
	import { homeUrl } from '$lib/urls';

	let { data, children } = $props();
	const locale = $derived(data.locale as Locale);

	// Language switch: keep the reader on the same entity, swapping only the
	// locale segment. `base` (from $app/paths) is a per-page RELATIVE prefix
	// when paths.relative is on, so we mirror the other URL builders:
	// `${base}/${locale}${rest}`. We pull `rest` (everything after the locale
	// segment) out of the absolute pathname, which already includes the real base.
	const otherUrl = $derived.by(() => {
		const other = otherLocale(locale);
		const rest = page.url.pathname.match(/\/(?:ja|en)(\/.*)?$/)?.[1] ?? '/';
		return `${base}/${other}${rest}`;
	});
</script>

<header class="site-header">
	<div class="wrap header-inner">
		<a class="brand" href={homeUrl(locale)}>
			<span class="brand-mark">日</span>
			<span class="brand-text">
				<strong>{ui(locale, 'siteTitle')}</strong>
				<small>{ui(locale, 'siteTagline')}</small>
			</span>
		</a>
		<nav class="lang">
			<a href={otherUrl} hreflang={otherLocale(locale)} rel="alternate">
				{otherLocale(locale) === 'ja' ? '日本語' : 'English'}
			</a>
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
