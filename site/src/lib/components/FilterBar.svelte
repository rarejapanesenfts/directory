<script lang="ts">
	import type { Series, Artist } from '$lib/data/types';
	import { ui, t, type Locale } from '$lib/i18n';

	let {
		locale,
		seriesList,
		artistList,
		query = $bindable(''),
		seriesId = $bindable(''),
		artistId = $bindable('')
	}: {
		locale: Locale;
		seriesList: Series[];
		artistList: Artist[];
		query?: string;
		seriesId?: string;
		artistId?: string;
	} = $props();
</script>

<div class="filter-bar">
	<input
		type="search"
		class="search"
		placeholder={ui(locale, 'searchPlaceholder')}
		aria-label={ui(locale, 'search')}
		bind:value={query}
	/>
	<select class="select" aria-label={ui(locale, 'series')} bind:value={seriesId}>
		<option value="">{ui(locale, 'allSeries')}</option>
		{#each seriesList as s (s.id)}
			<option value={s.id}>{s.collectionName} — {s.name}</option>
		{/each}
	</select>
	<select class="select" aria-label={ui(locale, 'artist')} bind:value={artistId}>
		<option value="">{ui(locale, 'allArtists')}</option>
		{#each artistList as a (a.id)}
			<option value={a.id}>{t(a.name, locale)}</option>
		{/each}
	</select>
</div>

<style>
	.filter-bar {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.6rem;
		margin: 1.25rem 0;
	}
	@media (min-width: 720px) {
		.filter-bar {
			grid-template-columns: 2fr 1fr 1fr;
		}
	}
	.search,
	.select {
		width: 100%;
		padding: 0.6rem 0.7rem;
		font-size: 0.95rem;
		background: var(--surface);
		color: var(--text);
		border: 1px solid var(--border);
		border-radius: 8px;
	}
	.search:focus,
	.select:focus {
		outline: 2px solid var(--accent);
		outline-offset: 1px;
	}
</style>
