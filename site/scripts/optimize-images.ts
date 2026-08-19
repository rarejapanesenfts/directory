// Build-time image pipeline (run via `bun run scripts/optimize-images.ts`).
//
// Reads data/json/nfts.json, processes the ~645 cards that have an
// `image.local` path, and writes optimized WebP into static/img/:
//   - a 400px-wide thumbnail (static first frame, for the grid)
//   - a max-1200px-wide "full" image (for the detail page; never upscaled)
//   - animated GIFs become animated WebP for the full variant; on failure the
//     original GIF is copied as-is.
//
// It also writes a social-sharing (OGP) variant per card into static/og/, plus
// one site-wide default card. Those are deliberately NOT the `full` image:
// crawlers on X and LINE do not render WebP, and card art is portrait (~0.71)
// while `summary_large_image` center-crops to 1.91:1 — so the art has to be
// composited onto a 1200x630 JPEG canvas instead. See buildOgCard().
//
// Output filenames derive from the unique `image.source` (sanitized), never
// from the awkward on-disk paths (Japanese folder names, trailing spaces, etc).
//
// A content-hash cache in .image-cache/manifest.json lets unchanged inputs skip
// re-encoding. The per-source manifest is emitted to src/lib/data/images.json.
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import {
	mkdirSync,
	writeFileSync,
	readFileSync,
	existsSync,
	copyFileSync,
	rmSync,
	readdirSync
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, extname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const repoRoot = resolve(root, '..');

const NFTS = resolve(repoRoot, 'data/json/nfts.json');
const OUT_DIR = resolve(root, 'static/img');
// Separate directory on purpose: the prune pass below deletes anything in a
// directory it did not just write, so OG output must not share static/img.
const OG_OUT_DIR = resolve(root, 'static/og');
const CACHE_DIR = resolve(root, '.image-cache');
const CACHE_FILE = resolve(CACHE_DIR, 'manifest.json');
const IMAGES_JSON = resolve(root, 'src/lib/data/images.json');

// Bump when encoder settings change to invalidate the cache.
const CONFIG_VERSION = 'v2';
const THUMB_WIDTH = 400;
const FULL_WIDTH = 1200;
const WEBP_QUALITY = 80;

// OGP canvas. 1200x630 is the 1.91:1 size every major crawler renders
// unscaled; keep these in sync with OG_IMAGE_WIDTH/HEIGHT in src/lib/og.ts.
const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
// Box the card art is fitted into (never cropped), leaving room for the
// logomark in the bottom-left corner.
const OG_ART_MAX_WIDTH = 520;
const OG_ART_MAX_HEIGHT = 534;
const OG_FRAME_PAD = 10;
// 4:4:4 rather than the default 4:2:0: most of this art is pixel art with
// saturated red/black edges, which chroma subsampling smears badly.
const OG_JPEG = { quality: 78, mozjpeg: true, chromaSubsampling: '4:4:4' } as const;
const OG_DEFAULT_NAME = 'default.jpg';
/** Cells in the default card's collage. 6*3 divides 1200x630 exactly. */
const OG_COLLAGE_COLS = 6;
const OG_COLLAGE_ROWS = 3;
// Channel multipliers applied via linear() — 0.45 means "45% of the original
// channel value". Both are backdrops sitting behind the art or the logomark.
const OG_BACKDROP_DIM = 0.45;
const OG_COLLAGE_DIM = 0.4;

type ImageEntry = { thumb: string; full: string; og: string; width: number; height: number };
type CacheEntry = { hash: string; entry: ImageEntry };

type Nft = { image: { local: string | null; source: string } };

/** Sanitize an image.source filename into a URL/file-safe slug (no extension). */
function slugFromSource(source: string): string {
	const base = source.slice(0, source.length - extname(source).length);
	const slug = base
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '');
	return slug || 'img';
}

function fileHash(path: string): string {
	return createHash('sha1')
		.update(CONFIG_VERSION)
		.update(readFileSync(path))
		.digest('hex');
}

// --- OGP card composition -------------------------------------------------
//
// Every overlay below is drawn from plain SVG shapes — no <text> anywhere.
// librsvg resolves fonts through fontconfig, so a text node renders whatever
// (if anything) the build machine happens to have installed; the CI runner and
// a laptop would silently disagree. The share title is carried by <og:title>,
// which each platform renders itself, so the image only has to carry the art
// and the mark. Colors are the app.css palette (--accent / --accent-fg / --bg).
const ACCENT = '#b91c1c';
const ACCENT_FG = '#ffffff';
const SURFACE = '#faf8f5';

/** The BrandMark.svelte logomark (hinomaru over a card frame) at `size` px. */
function logomarkSvg(size: number): Buffer {
	return Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 32 32">` +
			`<rect width="32" height="32" rx="8" fill="${ACCENT}"/>` +
			`<circle cx="16" cy="14" r="6" fill="${ACCENT_FG}"/>` +
			`<rect x="7" y="23" width="18" height="2.5" rx="1.25" fill="${ACCENT_FG}" opacity="0.8"/>` +
			`</svg>`
	);
}

/** Rounded off-white plate placed behind the art so it reads as a card. */
function frameSvg(width: number, height: number): Buffer {
	return Buffer.from(
		`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
			`<rect width="${width}" height="${height}" rx="12" fill="${SURFACE}"/>` +
			`</svg>`
	);
}

/**
 * Blur the art out to fill the canvas. Downscaling before the blur (rather
 * than blurring at 1200x630) is what keeps this cheap across ~645 cards; the
 * result is indistinguishable once it is blurred and darkened anyway.
 */
async function blurredBackdrop(input: string): Promise<Buffer> {
	const seed = await sharp(input, { animated: false, pages: 1 })
		.resize(300, 158, { fit: 'cover', position: 'centre' })
		.blur(10)
		.toBuffer();
	return sharp(seed)
		.resize(OG_WIDTH, OG_HEIGHT, { fit: 'fill' })
		.linear(OG_BACKDROP_DIM, 0)
		.blur(8)
		.toBuffer();
}

/**
 * Compose one card's 1200x630 share image: blurred art as the backdrop, the
 * art itself fitted whole (never cropped) on a card plate in the middle, and
 * the logomark bottom-left.
 */
async function buildOgCard(input: string, outPath: string): Promise<void> {
	const backdrop = await blurredBackdrop(input);

	// `inside` fits the longest edge, so portrait art (the overwhelming
	// majority here) lands at full height with the backdrop showing either
	// side, and landscape art at full width.
	const art = await sharp(input, { animated: false, pages: 1 })
		.resize({
			width: OG_ART_MAX_WIDTH,
			height: OG_ART_MAX_HEIGHT,
			fit: 'inside',
			withoutEnlargement: false
		})
		.png()
		.toBuffer();
	const meta = await sharp(art).metadata();
	const artW = meta.width ?? OG_ART_MAX_WIDTH;
	const artH = meta.height ?? OG_ART_MAX_HEIGHT;

	const frameW = artW + OG_FRAME_PAD * 2;
	const frameH = artH + OG_FRAME_PAD * 2;
	const frameLeft = Math.round((OG_WIDTH - frameW) / 2);
	const frameTop = Math.round((OG_HEIGHT - frameH) / 2);

	const markSize = 64;
	await sharp(backdrop)
		.composite([
			{ input: frameSvg(frameW, frameH), left: frameLeft, top: frameTop },
			{ input: art, left: frameLeft + OG_FRAME_PAD, top: frameTop + OG_FRAME_PAD },
			{ input: logomarkSvg(markSize), left: 44, top: OG_HEIGHT - markSize - 44 }
		])
		.jpeg(OG_JPEG)
		.toFile(outPath);
}

/**
 * The share image for every page that has no art of its own (home, series,
 * artist, the `/` redirect). A darkened mosaic of card thumbnails with the
 * logomark centered — built from the images this run just produced, so it
 * needs no committed binary and stays in step with the collection.
 *
 * `thumbFiles` must arrive in a stable order: the sample is taken at even
 * strides so the same collection always yields the same picture.
 */
async function buildOgDefault(thumbFiles: string[], outPath: string): Promise<void> {
	const cells = OG_COLLAGE_COLS * OG_COLLAGE_ROWS;
	const cellW = OG_WIDTH / OG_COLLAGE_COLS;
	const cellH = OG_HEIGHT / OG_COLLAGE_ROWS;

	const picks: string[] = [];
	for (let i = 0; i < cells && thumbFiles.length > 0; i++) {
		picks.push(thumbFiles[Math.floor((i * thumbFiles.length) / cells) % thumbFiles.length]);
	}

	const tiles = await Promise.all(
		picks.map(async (file, i) => ({
			input: await sharp(resolve(OUT_DIR, file))
				.resize(cellW, cellH, { fit: 'cover', position: 'centre' })
				.png()
				.toBuffer(),
			left: (i % OG_COLLAGE_COLS) * cellW,
			top: Math.floor(i / OG_COLLAGE_COLS) * cellH
		}))
	);

	const mosaic = await sharp({
		create: { width: OG_WIDTH, height: OG_HEIGHT, channels: 3, background: ACCENT }
	})
		.composite(tiles)
		.png()
		.toBuffer();

	// linear(f, 0) rather than modulate({brightness}) or a translucent black
	// rect: it multiplies the channels outright, so the factor means exactly
	// what it reads as (measured: a 0.4 here lands the tiles at 0.41 of their
	// original channel means). The mosaic only exists to sit behind the mark,
	// so it is dimmed hard on purpose.
	const dimmed = await sharp(mosaic)
		.modulate({ saturation: 0.7 })
		.linear(OG_COLLAGE_DIM, 0)
		.toBuffer();

	const markSize = 200;
	await sharp(dimmed)
		.composite([
			{
				input: logomarkSvg(markSize),
				left: Math.round((OG_WIDTH - markSize) / 2),
				top: Math.round((OG_HEIGHT - markSize) / 2)
			}
		])
		.jpeg(OG_JPEG)
		.toFile(outPath);
}

async function main() {
	const nfts: Nft[] = JSON.parse(readFileSync(NFTS, 'utf-8'));
	const withImages = nfts.filter((n) => n.image?.local);

	mkdirSync(OUT_DIR, { recursive: true });
	mkdirSync(OG_OUT_DIR, { recursive: true });
	mkdirSync(CACHE_DIR, { recursive: true });

	const cache: Record<string, CacheEntry> = existsSync(CACHE_FILE)
		? JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
		: {};

	const manifest: Record<string, ImageEntry> = {};
	const usedFiles = new Set<string>();
	// Pruned independently of static/img — the two directories have separate
	// lifecycles and the default card has no source card behind it.
	const usedOgFiles = new Set<string>([OG_DEFAULT_NAME]);
	const seenSlugs = new Map<string, string>();

	let processed = 0;
	let skipped = 0;
	let failed = 0;

	for (const n of nfts) {
		if (!n.image?.local) continue;
		const source = n.image.source;
		const input = resolve(repoRoot, n.image.local);
		if (!existsSync(input)) {
			console.warn(`[optimize-images] input missing, skipping: ${n.image.local}`);
			continue;
		}

		// Guard against two sources sanitizing to the same slug.
		let slug = slugFromSource(source);
		const prior = seenSlugs.get(slug);
		if (prior && prior !== source) {
			slug = `${slug}-${createHash('sha1').update(source).digest('hex').slice(0, 6)}`;
		}
		seenSlugs.set(slug, source);

		const isGif = extname(input).toLowerCase() === '.gif';
		const thumbName = `${slug}-thumb.webp`;
		const fullName = `${slug}.webp`;
		const gifName = `${slug}.gif`;
		const ogName = `${slug}.jpg`;
		const thumbPath = resolve(OUT_DIR, thumbName);
		const fullPath = resolve(OUT_DIR, fullName);
		const ogPath = resolve(OG_OUT_DIR, ogName);

		const hash = fileHash(input);
		const cached = cache[source];
		if (cached && cached.hash === hash) {
			// Only trust the cache if the referenced outputs still exist on disk.
			const outputsExist =
				[cached.entry.thumb, cached.entry.full].every((p) =>
					existsSync(resolve(OUT_DIR, p.replace(/^img\//, '')))
				) && existsSync(resolve(OG_OUT_DIR, cached.entry.og.replace(/^og\//, '')));
			if (outputsExist) {
				manifest[source] = cached.entry;
				usedFiles.add(cached.entry.thumb.replace(/^img\//, ''));
				usedFiles.add(cached.entry.full.replace(/^img\//, ''));
				usedOgFiles.add(cached.entry.og.replace(/^og\//, ''));
				skipped++;
				continue;
			}
		}

		// Read real source dimensions up front so we can record accurate
		// width/height even if an encode step later fails.
		let srcWidth = FULL_WIDTH;
		let srcHeight = FULL_WIDTH;
		try {
			const meta = await sharp(input, { animated: isGif }).metadata();
			srcWidth = meta.width ?? FULL_WIDTH;
			// For animated inputs metadata().height is the whole filmstrip;
			// pageHeight is the per-frame height we actually want.
			srcHeight = (meta.pageHeight ?? meta.height ?? srcWidth) as number;
		} catch {
			/* keep defaults */
		}
		const fullTargetW = Math.min(FULL_WIDTH, srcWidth);
		const outW = fullTargetW;
		const outH = Math.round((srcHeight / srcWidth) * fullTargetW);

		let thumbOut = `img/${thumbName}`;
		let fullOut = `img/${fullName}`;
		let ogOut: string | null = `og/${ogName}`;
		let ok = true;

		// full: animated for GIFs, static otherwise; never upscale.
		try {
			await sharp(input, { animated: isGif })
				.resize({ width: fullTargetW, withoutEnlargement: true })
				.webp({ quality: WEBP_QUALITY })
				.toFile(fullPath);
			usedFiles.add(fullName);
		} catch (err) {
			ok = false;
			console.error(`[optimize-images] FULL encode FAILED for ${source}: ${(err as Error).message}`);
			// Fallback: copy the original GIF verbatim so the card still shows.
			if (isGif) {
				copyFileSync(input, resolve(OUT_DIR, gifName));
				usedFiles.add(gifName);
				fullOut = `img/${gifName}`;
			}
		}

		// thumb: always a static first frame, independent of the full encode,
		// so the grid never has to load a multi-MB animated GIF.
		try {
			await sharp(input, { animated: false, pages: 1 })
				.resize({ width: THUMB_WIDTH, withoutEnlargement: true })
				.webp({ quality: WEBP_QUALITY })
				.toFile(thumbPath);
			usedFiles.add(thumbName);
		} catch (err) {
			ok = false;
			console.error(`[optimize-images] THUMB encode FAILED for ${source}: ${(err as Error).message}`);
			thumbOut = fullOut; // last resort: reuse whatever the full asset is
		}

		// og: 1200x630 JPEG share card. Independent of the two encodes above so
		// a card whose WebP failed still gets a usable social preview.
		try {
			await buildOgCard(input, ogPath);
			usedOgFiles.add(ogName);
		} catch (err) {
			ok = false;
			console.error(`[optimize-images] OG encode FAILED for ${source}: ${(err as Error).message}`);
			// Leave og null: Seo.svelte falls back to the site-wide default card,
			// which is strictly better than pointing at a file that isn't there.
			ogOut = null;
		}

		const entry: ImageEntry = {
			thumb: thumbOut,
			full: fullOut,
			og: ogOut ?? `og/${OG_DEFAULT_NAME}`,
			width: outW,
			height: outH
		};
		manifest[source] = entry;
		if (ok) {
			cache[source] = { hash, entry };
			processed++;
		} else {
			// Don't cache a fallback: re-attempt every build so a fixed sharp /
			// input recovers automatically instead of being stuck permanently.
			delete cache[source];
			failed++;
		}
	}

	// The site-wide default share card. Rebuilt every run rather than cached:
	// it is one composite and its inputs are the whole collection, so there is
	// no single source file a content hash could key on.
	const collageThumbs = Object.keys(manifest)
		.sort()
		.map((k) => manifest[k].thumb.replace(/^img\//, ''))
		.filter((f) => f.endsWith('-thumb.webp') && existsSync(resolve(OUT_DIR, f)));
	try {
		await buildOgDefault(collageThumbs, resolve(OG_OUT_DIR, OG_DEFAULT_NAME));
	} catch (err) {
		console.error(`[optimize-images] OG default card FAILED: ${(err as Error).message}`);
		// Every page without art points at this file, so a missing default is a
		// build failure rather than something to paper over.
		throw err;
	}

	// Prune stale outputs no longer referenced.
	for (const f of readdirSync(OUT_DIR)) {
		if (!usedFiles.has(f)) rmSync(resolve(OUT_DIR, f));
	}
	for (const f of readdirSync(OG_OUT_DIR)) {
		if (!usedOgFiles.has(f)) rmSync(resolve(OG_OUT_DIR, f));
	}

	// Emit manifests, keyed and sorted for deterministic diffs.
	const sortedManifest: Record<string, ImageEntry> = {};
	for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
	writeFileSync(IMAGES_JSON, JSON.stringify(sortedManifest, null, '\t') + '\n');

	const sortedCache: Record<string, CacheEntry> = {};
	for (const k of Object.keys(cache).sort()) sortedCache[k] = cache[k];
	writeFileSync(CACHE_FILE, JSON.stringify(sortedCache, null, '\t') + '\n');

	console.log(
		`[optimize-images] ${withImages.length} inputs -> ${processed} encoded, ${skipped} cached, ${failed} fallback. Manifest: ${Object.keys(manifest).length} entries. OG: ${usedOgFiles.size} files.`
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
