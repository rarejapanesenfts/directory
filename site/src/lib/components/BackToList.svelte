<script lang="ts">
	import { onMount } from 'svelte';
	import { ui, type Locale } from '$lib/i18n';
	import { homeUrl } from '$lib/urls';
	import { recallQuery } from '$lib/search';

	// Detail pages are prerendered, so the link is emitted without a query
	// string and gets the reader's last search appended after hydration. That
	// way the "back to list" link lands on the same result set the reader came
	// from, exactly like the browser's Back button.
	let { locale }: { locale: Locale } = $props();

	let href = $state('');
	const fallback = $derived(homeUrl(locale));

	onMount(() => {
		const search = recallQuery();
		// With filters active, land on the list section rather than the hero.
		href = search ? `${homeUrl(locale)}${search}#cards` : homeUrl(locale);
	});
</script>

<nav class="crumbs">
	<a href={href || fallback}>← {ui(locale, 'backToList')}</a>
</nav>

<style>
	.crumbs {
		margin: 0.5rem 0 1.25rem;
		font-size: 0.9rem;
	}
</style>
