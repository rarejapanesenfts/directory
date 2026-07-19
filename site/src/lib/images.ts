// Access to the optimized-image manifest produced by
// scripts/optimize-images.ts. Keyed by nft.image.source (unique across all
// 646 cards). Cards without a local image are absent from the manifest and
// fall back to the <Placeholder> component.
import manifest from './data/images.json';
import { asset } from './urls';
import type { ImageEntry } from './data/types';

const images = manifest as Record<string, ImageEntry>;

export type ResolvedImage = {
	thumb: string;
	full: string;
	width: number;
	height: number;
};

/** Resolve a card's image entry (base-aware URLs), or null if none exists. */
export function resolveImage(source: string | null | undefined): ResolvedImage | null {
	if (!source) return null;
	const entry = images[source];
	if (!entry) return null;
	return {
		thumb: asset(entry.thumb),
		full: asset(entry.full),
		width: entry.width,
		height: entry.height
	};
}
