<script lang="ts">
	// Deterministic placeholder for the ~428 cards with no local image.
	// Draws the card name's initials over a hue derived from the name, so
	// each card is visually distinct without any binary asset.
	let { name, aspect = '1 / 1' }: { name: string; aspect?: string } = $props();

	const initials = $derived(
		(name || '?')
			.replace(/[^A-Za-z0-9぀-ヿ一-龯]/g, '')
			.slice(0, 3)
			.toUpperCase() || '?'
	);

	const hue = $derived.by(() => {
		let h = 0;
		for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
		return h;
	});
</script>

<div
	class="placeholder"
	style={`aspect-ratio:${aspect};--ph-h:${hue}`}
	role="img"
	aria-label={name}
>
	<span>{initials}</span>
</div>

<style>
	.placeholder {
		display: grid;
		place-items: center;
		width: 100%;
		background: linear-gradient(
			135deg,
			hsl(var(--ph-h) 45% 32%),
			hsl(calc(var(--ph-h) + 40) 45% 20%)
		);
		color: hsl(var(--ph-h) 60% 88%);
		font-weight: 700;
		letter-spacing: 0.05em;
		font-size: clamp(1.4rem, 6cqw, 2.6rem);
		container-type: inline-size;
		user-select: none;
	}
	.placeholder span {
		font-size: clamp(1.4rem, 22cqw, 3rem);
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
	}
</style>
