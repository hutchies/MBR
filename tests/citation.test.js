import { describe, expect, it } from 'vitest';
import {
    bibtexKey, citationMeta, parseCitation, parseNames, recordsToRIS, toBibTeX, toRIS
} from '../src/lib/citation.js';

const BASE = 'https://example.org';

const article = {
    record: 48,
    author: 'Arewa, Olufunmilayo B.',
    citation: '"From J. C. Bach to Hip Hop: Musical Borrowing, Copyright, and Cultural Context." <em>North Carolina Law Review</em> 84 (January 2006): 547-645.',
    annotation: 'Current copyright laws do not adequately support 100% of hip-hop.',
    tags: ['General', 'Popular'],
    works: ['Biz Markie: Alone Again (580-81)'],
    sources: ["Gilbert O'Sullivan: Alone Again (Naturally) (580-81)"]
};
const chapter = {
    record: 7,
    author: 'Mann, Alfred',
    citation: '"Self Borrowing." In <em>Festa Musicologica: Essays in Honor of George J. Buelow</em>, ed. Thomas J. Mathiesen and Benito V. Rivera, 147-63. Stuyvesant, N.Y.: Pendragon, 1995.'
};
const book = {
    record: 9,
    author: 'Rathert, Wolfgang',
    citation: '<em>The Seen and Unseen: Studien zum Werk von Charles Ives.</em> Berliner musikwissenschaftliche Arbeiten, 38. Munich: Musikverlag Emil Katzbichler, 1991.'
};
const edited = {
    record: 10,
    author: 'Döhl, Frédéric, and Albrecht Riethmüller, eds',
    citation: '<em>Musik aus zweiter Hand.</em> Laaber: Laaber-Verlag, 2017.'
};
const thesis = {
    record: 11,
    author: 'Adams, Courtney S.',
    citation: '"The Three-Part Chanson during the Sixteenth Century." Ph.D. diss., University of Pennsylvania, 1974.'
};
const masters = {
    record: 12,
    author: 'Smith, Jane',
    citation: '"Fifteenth- and Sixteenth-Century Settings of \'Allez regretz.\'" M.M. dissertation, King\'s College, London, 1984.'
};

describe('parseNames', () => {
    it.each([
        ['Burkholder, J. Peter', ['Burkholder, J. Peter'], false],
        ['Roberts, John H.', ['Roberts, John H.'], false],
        ['Haar, James.', ['Haar, James'], false],
        ['Münzer, Georg, and Oscar Grohe', ['Münzer, Georg', 'Grohe, Oscar'], false],
        ['Döhl, Frédéric, and Albrecht Riethmüller, eds', ['Döhl, Frédéric', 'Riethmüller, Albrecht'], true],
        ['Smith, Ann, Bob Jones, and Carl Roe', ['Smith, Ann', 'Jones, Bob', 'Roe, Carl'], false],
        ['[Unsigned]', [], false]
    ])('%s', (raw, names, editors) => {
        expect(parseNames(raw)).toEqual({names, editors});
    });
});

describe('parseCitation', () => {
    it('reads a journal article', () => {
        expect(parseCitation(article)).toMatchObject({
            type: 'JOUR',
            title: 'From J. C. Bach to Hip Hop: Musical Borrowing, Copyright, and Cultural Context',
            container: 'North Carolina Law Review',
            volume: '84',
            startPage: '547',
            endPage: '645',
            year: '2006',
            authors: ['Arewa, Olufunmilayo B.']
        });
    });
    it('reads a chapter, expanding abbreviated page ranges', () => {
        expect(parseCitation(chapter)).toMatchObject({
            type: 'CHAP',
            title: 'Self Borrowing',
            container: 'Festa Musicologica: Essays in Honor of George J. Buelow',
            containerEditors: ['Mathiesen, Thomas J.', 'Rivera, Benito V.'],
            startPage: '147',
            endPage: '163',
            place: 'Stuyvesant, N.Y.',
            publisher: 'Pendragon',
            year: '1995'
        });
    });
    it('reads a book with a series', () => {
        expect(parseCitation(book)).toMatchObject({
            type: 'BOOK',
            title: 'The Seen and Unseen: Studien zum Werk von Charles Ives',
            series: 'Berliner musikwissenschaftliche Arbeiten, 38',
            place: 'Munich',
            publisher: 'Musikverlag Emil Katzbichler',
            year: '1991'
        });
    });
    it('treats "eds" authors of a book as editors', () => {
        expect(parseCitation(edited)).toMatchObject({
            type: 'BOOK',
            authors: [],
            editors: ['Döhl, Frédéric', 'Riethmüller, Albrecht']
        });
    });
    it('reads dissertations and theses', () => {
        expect(parseCitation(thesis)).toMatchObject({type: 'THES', thesisType: 'phd', school: 'University of Pennsylvania', year: '1974'});
        expect(parseCitation(masters)).toMatchObject({type: 'THES', thesisType: 'masters'});
    });
    it('keeps the full citation for anything it cannot place', () => {
        let c = parseCitation({record: 1, author: 'Anon', citation: 'Some odd thing without structure'});
        expect(c.type).toBe('GEN');
        expect(c.citation).toBe('Anon. Some odd thing without structure');
    });
});

describe('RIS', () => {
    it('writes a well-formed record', () => {
        let lines = toRIS(article, BASE).split('\r\n');
        expect(lines[0]).toBe('TY  - JOUR');
        expect(lines.at(-1)).toBe('ER  - ');
        expect(lines).toContain('AU  - Arewa, Olufunmilayo B.');
        expect(lines).toContain('T2  - North Carolina Law Review');
        expect(lines).toContain('SP  - 547');
        expect(lines).toContain('EP  - 645');
        expect(lines).toContain('KW  - Popular');
        expect(lines).toContain('UR  - https://example.org/record/48');
        expect(lines.every(l => /^[A-Z][A-Z0-9]  - /.test(l))).toBe(true);
    });
    it('uses ED for chapter editors and M3 for thesis type', () => {
        expect(toRIS(chapter, BASE)).toContain('ED  - Rivera, Benito V.');
        expect(toRIS(thesis, BASE)).toContain('M3  - Doctoral dissertation');
    });
    it('separates multiple records', () => {
        let ris = recordsToRIS([article, book], BASE);
        expect(ris.match(/^TY  - /gm)).toHaveLength(2);
        expect(ris.match(/^ER  - /gm)).toHaveLength(2);
    });
});

describe('BibTeX', () => {
    it('writes an article entry with escaped special characters', () => {
        let bib = toBibTeX(article, BASE);
        expect(bib.startsWith('@article{arewa2006mbr48,\n')).toBe(true);
        expect(bib).toContain('journal = {North Carolina Law Review}');
        expect(bib).toContain('pages = {547--645}');
        expect(bib).toContain('100\\% of hip-hop');
        expect(bib.trim().endsWith('}')).toBe(true);
    });
    it('keeps italics inside titles as \\emph', () => {
        let bib = toBibTeX({record: 3, author: 'Borrowdale, Robert J.', citation: '"The <em>Musices liber primus</em> of Diego Ortiz." Ph.D. diss., University of Southern California, 1952.'}, BASE);
        expect(bib).toContain('title = {The \\emph{Musices liber primus} of Diego Ortiz}');
        expect(bib.startsWith('@phdthesis{')).toBe(true);
    });
    it('uses the right entry types', () => {
        expect(toBibTeX(chapter, BASE)).toMatch(/^@incollection\{/);
        expect(toBibTeX(book, BASE)).toMatch(/^@book\{/);
        expect(toBibTeX(masters, BASE)).toMatch(/^@mastersthesis\{/);
    });
    it('builds ASCII keys that stay unique per record', () => {
        expect(bibtexKey(edited)).toBe('dohl2017mbr10');
    });
});

describe('citationMeta', () => {
    it('produces Highwire tags for reference manager browser plugins', () => {
        let meta = citationMeta(article, BASE);
        expect(meta).toContainEqual({name: 'citation_title', content: 'From J. C. Bach to Hip Hop: Musical Borrowing, Copyright, and Cultural Context'});
        expect(meta).toContainEqual({name: 'citation_journal_title', content: 'North Carolina Law Review'});
        expect(meta).toContainEqual({name: 'citation_publication_date', content: '2006'});
        expect(meta).toContainEqual({name: 'citation_firstpage', content: '547'});
    });
});
