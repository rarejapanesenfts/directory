<script lang="ts">
	// Logomark: a hinomaru rising over a card frame — "classic Japanese NFT
	// cards" without leaning on a bare kanji glyph, which read as a stray
	// character rather than a logo. Purely decorative; the wordmark next to it
	// carries the accessible name. The size lives in CSS (app.css shrinks it on
	// small phones); the attributes below just reserve layout space.
</script>

<svg
	class="brand-mark"
	width="32"
	height="32"
	viewBox="0 0 32 32"
	aria-hidden="true"
	focusable="false"
>
	<rect width="32" height="32" rx="8" fill="currentColor" />
	<circle cx="16" cy="14" r="6" fill="var(--accent-fg)" />
	<rect x="7" y="23" width="18" height="2.5" rx="1.25" fill="var(--accent-fg)" opacity="0.8" />
</svg>

<style>
	.brand-mark {
		display: block;
		color: var(--accent);
		flex-shrink: 0;
	}
</style>
