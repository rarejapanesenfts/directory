// Build-time image pipeline (run via `bun run scripts/optimize-images.ts`).
//
// Reads data/json/nfts.json, processes the ~218 cards that have an
// `image.local` path, and writes optimized WebP into static/img/:
//   - a 400px-wide thumbnail (static first frame, for the grid)
//   - a max-1200px-wide "full" image (for the detail page; never upscaled)
//   - animated GIFs become animated WebP for the full variant; on failure the
//     original GIF is copied as-is.
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
const CACHE_DIR = resolve(root, '.image-cache');
const CACHE_FILE = resolve(CACHE_DIR, 'manifest.json');
const IMAGES_JSON = resolve(root, 'src/lib/data/images.json');

// Bump when encoder settings change to invalidate the cache.
const CONFIG_VERSION = 'v1';
const THUMB_WIDTH = 400;
const FULL_WIDTH = 1200;
const WEBP_QUALITY = 80;

type ImageEntry = { thumb: string; full: string; width: number; height: number };
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

async function main() {
	const nfts: Nft[] = JSON.parse(readFileSync(NFTS, 'utf-8'));
	const withImages = nfts.filter((n) => n.image?.local);

	mkdirSync(OUT_DIR, { recursive: true });
	mkdirSync(CACHE_DIR, { recursive: true });

	const cache: Record<string, CacheEntry> = existsSync(CACHE_FILE)
		? JSON.parse(readFileSync(CACHE_FILE, 'utf-8'))
		: {};

	const manifest: Record<string, ImageEntry> = {};
	const usedFiles = new Set<string>();
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
		const fullName = isGif ? `${slug}.webp` : `${slug}.webp`;
		const thumbPath = resolve(OUT_DIR, thumbName);
		const fullPath = resolve(OUT_DIR, fullName);
		usedFiles.add(thumbName);
		usedFiles.add(fullName);

		const hash = fileHash(input);
		const cached = cache[source];
		if (cached && cached.hash === hash && existsSync(thumbPath) && existsSync(fullPath)) {
			manifest[source] = cached.entry;
			skipped++;
			continue;
		}

		try {
			// full: animated for GIFs, static otherwise; never upscale.
			const fullInput = sharp(input, { animated: isGif });
			const meta = await fullInput.metadata();
			// For animated inputs, metadata().height is the full filmstrip height;
			// pageHeight is the per-frame height we want to report.
			const srcWidth = meta.width ?? FULL_WIDTH;
			const srcHeight = (meta.pageHeight ?? meta.height ?? srcWidth) as number;

			const fullTargetW = Math.min(FULL_WIDTH, srcWidth);
			await fullInput
				.resize({ width: fullTargetW, withoutEnlargement: true })
				.webp({ quality: WEBP_QUALITY })
				.toFile(fullPath);

			// thumb: always static (first frame), for a light grid.
			await sharp(input, { animated: false, pages: 1 })
				.resize({ width: THUMB_WIDTH, withoutEnlargement: true })
				.webp({ quality: WEBP_QUALITY })
				.toFile(thumbPath);

			const outW = fullTargetW;
			const outH = Math.round((srcHeight / srcWidth) * fullTargetW);
			const entry: ImageEntry = {
				thumb: `img/${thumbName}`,
				full: `img/${fullName}`,
				width: outW,
				height: outH
			};
			manifest[source] = entry;
			cache[source] = { hash, entry };
			processed++;
		} catch (err) {
			// Fallback: copy the original GIF verbatim so the card still shows.
			console.warn(`[optimize-images] encode failed for ${source}: ${(err as Error).message}`);
			if (isGif) {
				const gifName = `${slug}.gif`;
				copyFileSync(input, resolve(OUT_DIR, gifName));
				usedFiles.add(gifName);
				const entry: ImageEntry = {
					thumb: `img/${gifName}`,
					full: `img/${gifName}`,
					width: 0,
					height: 0
				};
				manifest[source] = entry;
				cache[source] = { hash, entry };
			}
			failed++;
		}
	}

	// Prune stale outputs no longer referenced.
	for (const f of readdirSync(OUT_DIR)) {
		if (!usedFiles.has(f)) rmSync(resolve(OUT_DIR, f));
	}

	// Emit manifests, keyed and sorted for deterministic diffs.
	const sortedManifest: Record<string, ImageEntry> = {};
	for (const k of Object.keys(manifest).sort()) sortedManifest[k] = manifest[k];
	writeFileSync(IMAGES_JSON, JSON.stringify(sortedManifest, null, '\t') + '\n');

	const sortedCache: Record<string, CacheEntry> = {};
	for (const k of Object.keys(cache).sort()) sortedCache[k] = cache[k];
	writeFileSync(CACHE_FILE, JSON.stringify(sortedCache, null, '\t') + '\n');

	console.log(
		`[optimize-images] ${withImages.length} inputs -> ${processed} encoded, ${skipped} cached, ${failed} fallback. Manifest: ${Object.keys(manifest).length} entries.`
	);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
