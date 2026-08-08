<script lang="ts">
	import { onMount } from 'svelte';
	import { t, ui, type Locale } from '$lib/i18n';
	import { seriesLabel, seriesTitle } from '$lib/data';
	import { artistUrl, seriesUrl } from '$lib/urls';
	import { resolveImage } from '$lib/images';
	import type { FeaturedSlide } from '$lib/featured';
	import Placeholder from './Placeholder.svelte';

	let { items, locale }: { items: FeaturedSlide[]; locale: Locale } = $props();

	// A slide fronts either a series or an artist; everything below the artwork
	// differs only in these strings. `title` is the heading, which leans on the
	// kicker above it for context ("Collection: Memorychain" / "Series 1");
	// `label` is the self-contained version, for the link's accessible name.
	function slideText(item: FeaturedSlide) {
		return item.kind === 'artist'
			? {
					key: `artist:${item.artist.id}`,
					href: artistUrl(locale, item.artist.id),
					kicker: ui(locale, 'artist'),
					title: t(item.artist.name, locale),
					label: t(item.artist.name, locale),
					cta: ui(locale, 'viewArtist')
				}
			: {
					key: `series:${item.series.id}`,
					href: seriesUrl(locale, item.series.id),
					kicker: `${ui(locale, 'collection')}: ${item.series.collectionName}`,
					title: seriesTitle(item.series),
					label: seriesLabel(item.series),
					cta: ui(locale, 'viewSeries')
				};
	}

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

	// While goTo() animates, the scroll position is mid-flight and must not be
	// allowed to redefine `index` — otherwise a second click reads a rolled-back
	// index (losing a slide) and the dots light up one by one along the way.
	let animating = false;
	let settleTimer: ReturnType<typeof setTimeout> | undefined;
	let syncQueued = false;

	function settle(ms = 160) {
		clearTimeout(settleTimer);
		settleTimer = setTimeout(() => {
			animating = false;
			syncIndex();
		}, ms);
	}

	/** Scroll handler: one layout read per frame, and none while animating. */
	function onScroll() {
		if (animating) {
			settle();
			return;
		}
		if (syncQueued) return;
		syncQueued = true;
		requestAnimationFrame(() => {
			syncQueued = false;
			syncIndex();
		});
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
		// Wrapping means travelling the whole track: smooth-scrolling that flies
		// past every slide, so the loop point jumps instead.
		const wraps =
			(index === kids.length - 1 && target === 0) || (index === 0 && target === kids.length - 1);
		index = target;
		animating = true;
		track.scrollTo({
			left: kids[target].offsetLeft,
			behavior: reduceMotion || wraps ? 'auto' : 'smooth'
		});
		// Released by the scroll handler once movement stops; this covers the case
		// where the track is already there and no scroll event ever fires.
		settle(700);
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
			clearTimeout(settleTimer);
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

		<div class="track" bind:this={track} onscroll={onScroll}>
			{#each items as item, i (slideText(item).key)}
				{@const img = resolveImage(item.cover.image?.source)}
				{@const text = slideText(item)}
				<a
					class="slide"
					href={text.href}
					aria-label={`${text.label} — ${item.count} ${ui(locale, 'works')}`}
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
						<p class="label">{text.kicker}</p>
						<h3>{text.title}</h3>
						<p class="meta">{item.count} {ui(locale, 'works')}</p>
						<span class="cta">{text.cta} →</span>
					</div>
				</a>
			{/each}
		</div>

		<div class="dots">
			{#each items as item, i (slideText(item).key)}
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
		/* 44px touch target on phones; trimmed once there's a pointer-sized UI. */
		width: 2.75rem;
		height: 2.75rem;
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
		/* The covers are portrait card scans shown whole, so on phones the box is
		   nearly square — a letterbox would shrink the artwork to a stamp. */
		aspect-ratio: 5 / 4;
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
		padding: 0.6rem;
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

	/* Narrow phones: the lead line wraps and squeezes the arrows, and swiping is
	   the natural gesture there anyway. The dots still work as controls. */
	@media (max-width: 479px) {
		.lead {
			display: none;
		}
		.cover {
			padding: 0.4rem;
		}
		.body {
			padding: 0.9rem 1rem 1.1rem;
		}
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
		.cover {
			padding: 0.9rem;
		}
		.body {
			justify-content: center;
			padding: 1.75rem 2rem;
		}
		.body h3 {
			font-size: 1.6rem;
		}
		.arrows button {
			width: 2.25rem;
			height: 2.25rem;
		}
	}

	.dots {
		display: flex;
		justify-content: center;
		flex-wrap: wrap;
		margin-top: 0.35rem;
	}
	/* The dot stays 8px; the button around it is a 32px touch target (nine of
	   them still fit on a 320px screen without wrapping). */
	.dot {
		display: grid;
		place-items: center;
		width: 2rem;
		height: 2rem;
		padding: 0;
		border: 0;
		background: none;
		cursor: pointer;
	}
	.dot::before {
		content: '';
		width: 0.5rem;
		height: 0.5rem;
		border-radius: 999px;
		background: var(--border);
		transition:
			background 0.15s ease,
			transform 0.15s ease;
	}
	.dot.active::before {
		background: var(--accent);
		transform: scale(1.25);
	}
</style>
