<script lang="ts">
	import { ui, t, type Locale } from '$lib/i18n';
	import { homeUrl } from '$lib/urls';
	import CardGrid from '$lib/components/CardGrid.svelte';

	let { data } = $props();
	const locale = $derived(data.locale as Locale);
	const artist = $derived(data.artist);
	const cards = $derived(data.cards);
	const name = $derived(t(artist.name, locale));
	const bio = $derived(t(artist.bio, locale));

	type LinkDef = { href: string; label: string };
	const links = $derived.by((): LinkDef[] => {
		const out: LinkDef[] = [];
		if (artist.links?.twitter) out.push({ href: artist.links.twitter, label: 'Twitter / X' });
		if (artist.links?.opensea) out.push({ href: artist.links.opensea, label: 'OpenSea' });
		if (artist.links?.website) out.push({ href: artist.links.website, label: ui(locale, 'website') });
		return out;
	});
</script>

<svelte:head>
	<title>{name} — {ui(locale, 'siteTitle')}</title>
</svelte:head>

<nav class="crumbs">
	<a href={homeUrl(locale)}>← {ui(locale, 'backToList')}</a>
</nav>

<header class="page-head">
	<p class="kicker">{ui(locale, 'artist')}</p>
	<h1>{name}</h1>
	{#if bio}<p class="desc">{bio}</p>{/if}

	{#if links.length}
		<ul class="links">
			{#each links as l}
				<li>
					<a href={l.href} target="_blank" rel="noopener noreferrer external">{l.label} ↗</a>
				</li>
			{/each}
		</ul>
	{/if}

	<p class="count">{cards.length} {ui(locale, 'results')}</p>
</header>

<CardGrid {cards} {locale} />

<style>
	.crumbs {
		margin: 0.5rem 0 1.25rem;
		font-size: 0.9rem;
	}
	.page-head {
		margin-bottom: 1.5rem;
	}
	.kicker {
		margin: 0 0 0.25rem;
		font-size: 0.8rem;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--muted);
	}
	.page-head h1 {
		margin: 0 0 0.4rem;
		font-size: 1.7rem;
		overflow-wrap: anywhere;
	}
	.desc {
		max-width: 60ch;
		line-height: 1.6;
		white-space: pre-line;
	}
	.links {
		list-style: none;
		padding: 0;
		margin: 0.75rem 0 0;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.links a {
		display: inline-block;
		padding: 0.35rem 0.7rem;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		font-size: 0.85rem;
		text-decoration: none;
	}
	.links a:hover {
		border-color: var(--accent);
	}
	.count {
		color: var(--muted);
		font-size: 0.85rem;
		margin-top: 0.75rem;
	}
</style>
