<script lang="ts">
	import { base } from '$app/paths';
	import { page } from '$app/state';
	import { ui, otherLocale, type Locale } from '$lib/i18n';

	let { locale }: { locale: Locale } = $props();

	const other = $derived(otherLocale(locale));

	// Keep the reader on the same entity, swapping only the locale segment.
	// `base` (from $app/paths) is a per-page RELATIVE prefix when paths.relative
	// is on, so we mirror the other URL builders: `${base}/${locale}${rest}`. We
	// pull `rest` (everything after the locale segment) out of the absolute
	// pathname, which already includes the real base.
	const href = $derived.by(() => {
		const rest = page.url.pathname.match(/\/(?:ja|en)(\/.*)?$/)?.[1] ?? '/';
		return `${base}/${other}${rest}`;
	});
</script>

<a
	class="locale-switch"
	{href}
	hreflang={other}
	rel="alternate"
	title={ui(locale, 'switchLanguage')}
	aria-label={ui(locale, 'switchLanguage')}
>
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		stroke-width="1.7"
		stroke-linecap="round"
		stroke-linejoin="round"
		aria-hidden="true"
		focusable="false"
	>
		<circle cx="12" cy="12" r="9" />
		<path d="M3.2 9.5h17.6M3.2 14.5h17.6" />
		<path d="M12 3c2.6 2.7 3.9 5.7 3.9 9s-1.3 6.3-3.9 9c-2.6-2.7-3.9-5.7-3.9-9S9.4 5.7 12 3z" />
	</svg>
	<span class="locale-switch-label">{ui(locale, 'langLabel')}</span>
</a>
