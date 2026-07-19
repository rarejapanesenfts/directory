// Placeholder — replaced with the real sharp-based pipeline in phase 3.
// For now it just ensures an (empty) manifest exists so the data layer can
// import src/lib/data/images.json unconditionally.
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = resolve(__dirname, '../src/lib/data/images.json');

if (!existsSync(manifestPath)) {
	mkdirSync(dirname(manifestPath), { recursive: true });
	writeFileSync(manifestPath, '{}\n');
	console.log('[optimize-images] wrote empty manifest (placeholder)');
} else {
	console.log('[optimize-images] manifest already exists, skipping (placeholder)');
}
