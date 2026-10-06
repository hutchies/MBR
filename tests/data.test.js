// Runs the parsers over the whole bundled bibliography so a change that
// breaks real records shows up here rather than on the site.
import { describe, expect, it } from 'vitest';
import data from '../src/lib/data.json';
import { parseCitation, toBibTeX, toRIS } from '../src/lib/citation.js';
import { buildRelatedIndex, relatedRecords } from '../src/lib/related.js';
import { getDate } from '../src/lib/search.js';

describe('bundled data', () => {
    it('has unique record numbers', () => {
        let ids = data.map(d => d.record);
        expect(new Set(ids).size).toBe(ids.length);
    });
    it('every record has an author, citation and tags', () => {
        for(let d of data){
            expect(d.author, `record ${d.record}`).toBeTruthy();
            expect(d.citation, `record ${d.record}`).toBeTruthy();
            expect(Array.isArray(d.tags), `record ${d.record}`).toBe(true);
        }
    });
    it('finds a plausible year for nearly every citation', () => {
        let years = data.map(d => getDate(d.citation));
        let missing = years.filter(y => y < 0).length;
        expect(missing / data.length).toBeLessThan(0.02);
        expect(years.filter(y => y > 0 && (y < 1500 || y > 2100))).toEqual([]);
    });
    it('parses every citation and gives nearly all of them a type and title', () => {
        let parsed = data.map(parseCitation);
        expect(parsed.every(p => p.title)).toBe(true);
        expect(parsed.filter(p => p.type == 'GEN').length / data.length).toBeLessThan(0.05);
    });
    it('exports every record', () => {
        for(let d of data){
            expect(toRIS(d, 'https://example.org')).toMatch(/^TY {2}- [A-Z]+\r\n[\s\S]*ER {2}- $/);
            expect(toBibTeX(d, 'https://example.org')).toMatch(/^@\w+\{[a-z0-9]+,\n[\s\S]*\n\}$/);
        }
    });
    it('builds related records for the whole set', () => {
        let index = buildRelatedIndex(data);
        let withWorks = data.filter(d => d.works || d.sources);
        let linked = withWorks.filter(d => relatedRecords(index, d).length).length;
        expect(linked / withWorks.length).toBeGreaterThan(0.8);
    });
});
