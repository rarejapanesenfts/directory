// Data schema for the normalized JSON in ../../../../data/json/.
// Mirrors the schema documented in the repository README.

export type Localized = { en: string | null; ja: string | null };

export type Chain = { name: string; url: string };

export type Nft = {
	id: string;
	name: string;
	slug: Localized;
	description: Localized;
	artistId: string;
	seriesId: string;
	card: number | null;
	issued: {
		date: string | null;
		display: Localized;
	};
	totalSupply: number | null;
	chains: Chain[];
	image: {
		source: string;
		local: string | null;
	};
	publishedAt: string | null;
	translationKey: string | null;
};

export type Series = {
	id: string;
	collectionId: string;
	collectionName: string;
	name: string;
	description: Localized;
	nftCount: number;
};

export type Artist = {
	id: string;
	name: Localized;
	links: {
		twitter: string | null;
		opensea: string | null;
		website: string | null;
	};
	cpAddress: string | null;
	bio: Localized;
	nftCount: number;
};

/** A card with its series/artist references resolved, for display. */
export type JoinedNft = Nft & {
	series: Series | null;
	artist: Artist | null;
};

/** Image manifest entry produced by scripts/optimize-images.ts. */
export type ImageEntry = {
	thumb: string;
	full: string;
	width: number;
	height: number;
};
