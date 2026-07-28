<script lang="ts">
	import type { Series, Artist } from '$lib/data/types';
	import { seriesLabel } from '$lib/data';
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
			<option value={s.id}>{seriesLabel(s)}</option>
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
		margin: 1rem 0 1.25rem;
	}
	/* Phones: the two selects share a row under the search box, so the bar costs
	   two rows instead of three and the grid starts higher up. Below 360px the
	   option labels get too clipped to be worth it, so it stays stacked there. */
	@media (min-width: 360px) {
		.filter-bar {
			grid-template-columns: 1fr 1fr;
		}
		.search {
			grid-column: 1 / -1;
		}
	}
	/* Two selects sharing a phone-width row: shave the label so the default
	   "すべての…" options still fit. */
	@media (min-width: 360px) and (max-width: 719px) {
		.select {
			font-size: 0.9rem;
			padding-inline: 0.55rem;
		}
	}
	@media (min-width: 720px) {
		.filter-bar {
			grid-template-columns: 2fr 1fr 1fr;
		}
		.search,
		.select {
			font-size: 0.95rem;
		}
		.search {
			grid-column: auto;
		}
	}
	.search,
	.select {
		width: 100%;
		padding: 0.6rem 0.7rem;
		/* 16px: anything smaller makes iOS Safari zoom in on focus. */
		font-size: 1rem;
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
