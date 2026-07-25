<script lang="ts">
	import { onMount } from 'svelte';
	import { ui, type Locale } from '$lib/i18n';
	import { seriesUrl } from '$lib/urls';
	import { resolveImage } from '$lib/images';
	import type { FeaturedSeries } from '$lib/featured';
	import Placeholder from './Placeholder.svelte';

	let { items, locale }: { items: FeaturedSeries[]; locale: Locale } = $props();

	// The track is a scroll-snap container, so it swipes natively and works
	// without JS; the buttons/auto-advance just drive scrollTo() on top of it.
	let track: HTMLDivElement | undefined = $state();
	let index = $state(0);
	let reduceMotion = $state(false);
	let paused = $state(false);

	const AUTO_MS = 6000;

	function slides(): HTMLElement[] {
		return track ? (Array.from(track.children) as HTMLElement[]) : [];
	}

	function syncIndex() {
		const kids = slides();
		if (!track || kids.length === 0) return;
		const left = track.scrollLeft;
		let best = 0;
		let bestDist = Infinity;
		kids.forEach((kid, i) => {
			const dist = Math.abs(kid.offsetLeft - left);
			if (dist < bestDist) {
				bestDist = dist;
				best = i;
			}
		});
		index = best;
	}

	function goTo(i: number) {
		const kids = slides();
		if (!track || kids.length === 0) return;
		const target = ((i % kids.length) + kids.length) % kids.length;
		track.scrollTo({ left: kids[target].offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
		index = target;
	}

	onMount(() => {
		const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
		reduceMotion = mq.matches;
		const onChange = (e: MediaQueryListEvent) => (reduceMotion = e.matches);
		mq.addEventListener('change', onChange);

		// Auto-advance, unless the reader is interacting with it (hover/focus/
		// touch) or has asked for reduced motion.
		const timer = setInterval(() => {
			if (!paused && !reduceMotion && !document.hidden) goTo(index + 1);
		}, AUTO_MS);

		return () => {
			clearInterval(timer);
			mq.removeEventListener('change', onChange);
		};
	});
</script>

{#if items.length}
	<section
		class="carousel"
		aria-roledescription="carousel"
		aria-label={ui(locale, 'featuredSeries')}
		onpointerenter={() => (paused = true)}
		onpointerleave={() => (paused = false)}
		onfocusin={() => (paused = true)}
		onfocusout={() => (paused = false)}
	>
		<div class="head">
			<div>
				<h2>{ui(locale, 'featuredSeries')}</h2>
				<p class="lead">{ui(locale, 'featuredSeriesLead')}</p>
			</div>
			<div class="arrows">
				<button type="button" aria-label={ui(locale, 'prevSlide')} onclick={() => goTo(index - 1)}>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path
							d="M15 5 8 12l7 7"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
				<button type="button" aria-label={ui(locale, 'nextSlide')} onclick={() => goTo(index + 1)}>
					<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
						<path
							d="m9 5 7 7-7 7"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						/>
					</svg>
				</button>
			</div>
		</div>

		<div class="track" bind:this={track} onscroll={syncIndex}>
			{#each items as item, i (item.series.id)}
				{@const img = resolveImage(item.cover.image?.source)}
				<a
					class="slide"
					href={seriesUrl(locale, item.series.id)}
					aria-label={`${item.label} — ${item.count} ${ui(locale, 'works')}`}
				>
					<div class="art">
						{#if img}
							<!-- Blurred copy behind the artwork: the covers are tall card
							     scans, so they are shown whole (contain) over a backdrop
							     rather than cropped to the slide's letterbox. -->
							<img class="backdrop" src={img.thumb} alt="" aria-hidden="true" loading="lazy" />
							<img
								class="cover"
								src={img.full}
								width={img.width}
								height={img.height}
								alt=""
								loading={i === 0 ? 'eager' : 'lazy'}
								decoding="async"
							/>
						{:else}
							<div class="art-fallback"><Placeholder name={item.cover.name} /></div>
						{/if}
					</div>
					<div class="body">
						<p class="label">{ui(locale, 'collection')}: {item.series.collectionName}</p>
						<h3>{item.series.name || item.series.collectionName}</h3>
						<p class="meta">{item.count} {ui(locale, 'works')}</p>
						<span class="cta">{ui(locale, 'viewSeries')} →</span>
					</div>
				</a>
			{/each}
		</div>

		<div class="dots">
			{#each items as item, i (item.series.id)}
				<button
					type="button"
					class="dot"
					class:active={i === index}
					aria-label={ui(locale, 'gotoSlide').replace('{n}', String(i + 1))}
					aria-current={i === index ? 'true' : undefined}
					onclick={() => goTo(i)}
				></button>
			{/each}
		</div>
	</section>
{/if}

<style>
	.carousel {
		margin: 1.5rem 0 2.5rem;
	}
	.head {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 0.75rem;
	}
	.head h2 {
		margin: 0;
		font-size: 1.15rem;
	}
	.lead {
		margin: 0.15rem 0 0;
		color: var(--muted);
		font-size: 0.85rem;
	}
	.arrows {
		display: flex;
		gap: 0.4rem;
		flex-shrink: 0;
	}
	.arrows button {
		display: grid;
		place-items: center;
		width: 2.1rem;
		height: 2.1rem;
		padding: 0;
		border: 1px solid var(--border);
		border-radius: 999px;
		background: var(--surface);
		color: var(--text);
		cursor: pointer;
	}
	.arrows button:hover {
		border-color: var(--accent);
		color: var(--accent);
	}
	.arrows svg {
		width: 1.1rem;
		height: 1.1rem;
	}

	.track {
		position: relative;
		display: grid;
		grid-auto-flow: column;
		grid-auto-columns: 100%;
		gap: 1rem;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scrollbar-width: none;
		-ms-overflow-style: none;
		overscroll-behavior-x: contain;
	}
	.track::-webkit-scrollbar {
		display: none;
	}

	.slide {
		scroll-snap-align: start;
		display: grid;
		grid-template-rows: auto auto;
		border: 1px solid var(--border);
		border-radius: 16px;
		overflow: hidden;
		background: var(--surface);
		color: inherit;
		text-decoration: none;
		transition: border-color 0.15s ease;
	}
	.slide:hover {
		border-color: var(--accent);
	}
	/* Absolute positioning keeps the artwork's own (often 3:4) intrinsic size
	   from dictating how tall the slide gets. */
	.art {
		position: relative;
		background: var(--surface-2);
		overflow: hidden;
		aspect-ratio: 16 / 10;
	}
	.art img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		display: block;
	}
	.backdrop {
		object-fit: cover;
		transform: scale(1.15);
		filter: blur(26px) saturate(1.15) brightness(0.95);
	}
	.cover {
		object-fit: contain;
		padding: 0.9rem;
	}
	.art-fallback {
		position: absolute;
		inset: 0;
		display: grid;
		place-items: center;
		overflow: hidden;
	}
	.body {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
		padding: 1rem 1.1rem 1.2rem;
	}
	.body h3 {
		margin: 0;
		font-size: 1.25rem;
		overflow-wrap: anywhere;
	}
	.meta {
		margin: 0;
		color: var(--muted);
		font-size: 0.85rem;
		overflow-wrap: anywhere;
	}
	.cta {
		margin-top: 0.35rem;
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--accent);
	}

	@media (min-width: 720px) {
		.slide {
			grid-template-rows: none;
			grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
			align-items: stretch;
			height: clamp(260px, 30vw, 360px);
		}
		.art {
			aspect-ratio: auto;
			height: 100%;
		}
		.body {
			justify-content: center;
			padding: 1.75rem 2rem;
		}
		.body h3 {
			font-size: 1.6rem;
		}
	}

	.dots {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		gap: 0.4rem;
		margin-top: 0.85rem;
	}
	.dot {
		width: 0.5rem;
		height: 0.5rem;
		padding: 0;
		border: 0;
		border-radius: 999px;
		background: var(--border);
		cursor: pointer;
	}
	.dot.active {
		background: var(--accent);
		transform: scale(1.25);
	}
</style>
