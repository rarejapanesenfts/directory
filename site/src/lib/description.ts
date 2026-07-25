// Card descriptions come from the old WordPress export as one plain-text blob.
// Some of them carry a trailing "アーティストからのコメント" section, which is a
// LABEL for a quote rather than part of the prose — the UI renders it as a
// labelled block, so we split it out here. The source text also still contains
// a few raw HTML entities (&nbsp;, &amp;) from the export, which would show up
// literally in a text node.

const MARKER = /^[ \t]*アーティストからのコメント[ \t]*[:：]?[ \t]*$/m;

const ENTITIES: Record<string, string> = {
	'&nbsp;': ' ',
	'&amp;': '&',
	'&lt;': '<',
	'&gt;': '>',
	'&quot;': '"',
	'&#039;': "'",
	'&#39;': "'"
};

function decode(text: string): string {
	return text.replace(/&(?:nbsp|amp|lt|gt|quot|#0?39);/g, (m) => ENTITIES[m] ?? m);
}

/** Drop blank/entity-only spacer lines and collapse runs of empty lines. */
function tidy(text: string): string {
	return decode(text)
		.split('\n')
		.map((line) => (line.trim() === '' ? '' : line.trimEnd()))
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export type ParsedDescription = {
	/** The prose, without the artist-comment section. */
	body: string;
	/** The artist's comment, without its label line. Empty when absent. */
	artistComment: string;
};

export function parseDescription(raw: string | null | undefined): ParsedDescription {
	if (!raw) return { body: '', artistComment: '' };
	const match = MARKER.exec(raw);
	if (!match) return { body: tidy(raw), artistComment: '' };
	return {
		body: tidy(raw.slice(0, match.index)),
		artistComment: tidy(raw.slice(match.index + match[0].length))
	};
}
