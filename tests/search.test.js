import { describe, expect, it } from 'vitest';
import { parse } from '../src/lib/boolean.js';
import {
    allText, attributedIndexLabels, baseForm, canonicalIndexLabel, escapeRegex,
    getDate, matchesQuery, splitCreatorTitle, stripHtml
} from '../src/lib/search.js';

const mahler = {
    record: 1,
    author: 'Hefling, Stephen E.',
    citation: '"Mahler\'s Todtenfeier and the Problem of Program Music." <em>19th-Century Music</em> 12 (Summer 1988): 27-53.',
    annotation: 'Mahler uses parody and irony throughout the Todtenfeier.',
    works: ['Mahler: Symphony No. 2 (30-45)'],
    sources: ['Beethoven: Symphony No. 3 (41)'],
    contributors: ['Andreas Giger'],
    tags: ['1800s', '1900s']
};
const ives = {
    record: 2,
    author: 'Burkholder, J. Peter',
    citation: '<em>All Made of Tunes: Charles Ives and the Uses of Musical Borrowing.</em> New Haven: Yale University Press, 1995.',
    annotation: 'Ives quotes hymn tunes and uses collage.',
    works: ['Ives: Symphony No. 4 (100)'],
    sources: ['Lowell Mason: Bethany (100)'],
    contributors: ['J. Peter Burkholder'],
    tags: ['1900s']
};
const records = [mahler, ives];

function search(q){
    let tree = parse(q);
    return records.filter(r => matchesQuery(tree, r)).map(r => r.record);
}

describe('baseForm', () => {
    it('folds case, accents and curly quotes', () => {
        expect(baseForm('Dvořák’s “New World”')).toBe('dvorak\'s "new world"');
    });
    it('treats empty input as empty', () => {
        expect(baseForm(undefined)).toBe('');
    });
});

describe('escapeRegex', () => {
    it('makes pasted citations safe to use as patterns', () => {
        let s = 'Notes 12 ([Month] 1954): (I) 25-40.';
        expect(new RegExp(escapeRegex(s)).test(s)).toBe(true);
    });
});

describe('stripHtml', () => {
    it('removes tags and decodes ampersands', () => {
        expect(stripHtml('<em>Music &amp;Letters</em>  55')).toBe('Music &Letters 55');
    });
});

describe('getDate', () => {
    it.each([
        ['"Title." <em>Journal</em> 84 (January 2006): 547-645.', 2006],
        ['"Title." In <em>Book</em>, ed. A. Editor, 55-64. Kassel: Bärenreiter-Verlag, 1954.', 1954],
        ['<em>Book 1850-1900.</em> Munich: Katzbichler, 1991.', 1991],
        ['"Title." Ph.D. diss., University of Pennsylvania, 1974.', 1974],
        ['"Title." <em>Proceedings</em> 96 (1969-70): 85-101.', 1969],
        ['No year here.', -1]
    ])('%s -> %i', (citation, year) => {
        expect(getDate(citation)).toBe(year);
    });
});

describe('allText', () => {
    it('includes author, citation and list fields', () => {
        let t = allText(mahler);
        expect(t).toContain('Hefling');
        expect(t).toContain('Beethoven');
        expect(t).toContain('Andreas Giger');
    });
});

describe('advanced search', () => {
    it('matches single terms on word boundaries', () => {
        expect(search('mahler')).toEqual([1]);
        expect(search('mahl')).toEqual([]);
    });
    it('supports wildcards', () => {
        expect(search('mahl*')).toEqual([1]);
        expect(search('*ollage')).toEqual([2]);
    });
    it('treats adjacent terms as AND', () => {
        expect(search('symphony parody')).toEqual([1]);
        expect(search('symphony AND collage')).toEqual([2]);
    });
    it('supports OR and grouping', () => {
        expect(search('parody OR collage')).toEqual([1, 2]);
        expect(search('symphony AND (irony OR hymn)')).toEqual([1, 2]);
        expect(search('mahler AND (irony OR hymn)')).toEqual([1]);
    });
    it('supports NOT', () => {
        expect(search('symphony NOT mahler')).toEqual([2]);
    });
    it('supports quoted phrases', () => {
        expect(search('"hymn tunes"')).toEqual([2]);
        expect(search('"tunes hymn"')).toEqual([]);
    });
    it('restricts to a field with a filter', () => {
        expect(search('works:beethoven')).toEqual([]);
        expect(search('sources:beethoven')).toEqual([1]);
        expect(search('contributor:giger')).toEqual([1]);
        expect(search('tag:1800s')).toEqual([1]);
        expect(search('author:burkholder')).toEqual([2]);
        expect(search('citation:yale')).toEqual([2]);
    });
    it('applies a filter to a whole group', () => {
        expect(search('sources:(mason OR beethoven)')).toEqual([1, 2]);
    });
    it('finds a single record by number', () => {
        expect(search('record:2')).toEqual([2]);
    });
    it('ignores accents in queries', () => {
        expect(search('mählér')).toEqual([1]);
    });
    it('records positive terms for highlighting, but not negated ones', () => {
        let bits = [];
        matchesQuery(parse('sources:beethoven NOT ives'), mahler, bits);
        expect(bits).toEqual([{term: '\\bbeethoven\\b', filter: 'sources'}]);
    });
    it('throws on malformed queries so the UI can fall back', () => {
        expect(() => parse('mahler AND (')).toThrow();
    });
});

describe('works and sources index labels', () => {
    it('drops page references', () => {
        expect(canonicalIndexLabel('Mahler: Symphony No. 2 (30-45).', 'works')).toBe('Mahler: Symphony No. 2');
    });
    it('carries the composer across a comma-separated run', () => {
        let labels = attributedIndexLabels(['Bartók: Suite, Op. 14 (350)', '<em>Rumanian Folk Dances</em> (352)'], 'works');
        expect(labels).toEqual(['Bartók: Suite, Op. 14', 'Bartók: Rumanian Folk Dances']);
    });
    it('splits creator from title', () => {
        expect(splitCreatorTitle('Handel: Israel in Egypt')).toEqual({creator: 'Handel', title: 'Israel in Egypt'});
        expect(splitCreatorTitle('a traditional tune')).toEqual({creator: 'Unattributed or General', title: 'a traditional tune'});
    });
});
