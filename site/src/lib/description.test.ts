import { describe, it, expect } from 'vitest';
import { parseDescription } from './description';

describe('parseDescription', () => {
	it('returns empty fields for missing input', () => {
		expect(parseDescription(null)).toEqual({ body: '', artistComment: '' });
		expect(parseDescription(undefined)).toEqual({ body: '', artistComment: '' });
		expect(parseDescription('')).toEqual({ body: '', artistComment: '' });
	});

	it('keeps prose as the body when there is no marker', () => {
		expect(parseDescription('ただの説明文です。')).toEqual({
			body: 'ただの説明文です。',
			artistComment: ''
		});
	});

	describe('artist comment marker', () => {
		it('splits the labelled section off the body', () => {
			const raw = ['カードの解説。', '', 'アーティストからのコメント', '', 'よろしく!'].join('\n');
			expect(parseDescription(raw)).toEqual({
				body: 'カードの解説。',
				artistComment: 'よろしく!'
			});
		});

		it('accepts a full-width or half-width colon after the label', () => {
			for (const label of ['アーティストからのコメント:', 'アーティストからのコメント：']) {
				expect(parseDescription(`本文\n${label}\nコメント`)).toEqual({
					body: '本文',
					artistComment: 'コメント'
				});
			}
		});

		it('tolerates surrounding whitespace on the label line', () => {
			expect(parseDescription('本文\n  アーティストからのコメント  \nコメント')).toEqual({
				body: '本文',
				artistComment: 'コメント'
			});
		});

		it('does not split when the label is part of a sentence', () => {
			const raw = 'ここにアーティストからのコメントが載っています。';
			expect(parseDescription(raw)).toEqual({ body: raw, artistComment: '' });
		});

		it('keeps a multi-line comment intact', () => {
			const raw = '本文\nアーティストからのコメント\n一行目\n二行目';
			expect(parseDescription(raw).artistComment).toBe('一行目\n二行目');
		});

		it('yields an empty comment when the label has no text after it', () => {
			expect(parseDescription('本文\nアーティストからのコメント\n')).toEqual({
				body: '本文',
				artistComment: ''
			});
		});
	});

	describe('entity decoding', () => {
		it('decodes the entities left in the WordPress export', () => {
			expect(parseDescription('A&nbsp;B &amp; C &lt;tag&gt; &quot;q&quot; &#039;s &#39;t').body).toBe(
				'A B & C <tag> "q" \'s \'t'
			);
		});

		it('decodes inside the artist comment too', () => {
			expect(parseDescription('本文\nアーティストからのコメント\nA &amp; B').artistComment).toBe(
				'A & B'
			);
		});

		it('leaves unknown entities alone', () => {
			expect(parseDescription('&copy; 2017').body).toBe('&copy; 2017');
		});
	});

	describe('whitespace tidying', () => {
		it('collapses runs of blank lines to a single blank line', () => {
			expect(parseDescription('一行目\n\n\n\n二行目').body).toBe('一行目\n\n二行目');
		});

		it('drops entity-only spacer lines', () => {
			expect(parseDescription('一行目\n&nbsp;\n二行目').body).toBe('一行目\n\n二行目');
		});

		it('trims leading and trailing whitespace', () => {
			expect(parseDescription('\n\n  本文  \n\n').body).toBe('本文');
		});

		it('strips trailing whitespace per line', () => {
			expect(parseDescription('一行目   \n二行目').body).toBe('一行目\n二行目');
		});
	});

	it('parses a realistic record end to end', () => {
		const raw = [
			'PEPEBAZAAR は 2017 年に発行されたカードです。&nbsp;',
			'',
			'',
			'発行元は Rare Pepe &amp; friends。',
			'アーティストからのコメント：',
			'',
			'描くのが楽しかったです。   ',
			''
		].join('\n');

		expect(parseDescription(raw)).toEqual({
			body: 'PEPEBAZAAR は 2017 年に発行されたカードです。\n\n発行元は Rare Pepe & friends。',
			artistComment: '描くのが楽しかったです。'
		});
	});
});
