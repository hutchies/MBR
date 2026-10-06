import { describe, expect, it } from 'vitest';
import { buildRelatedIndex, relatedRecords } from '../src/lib/related.js';

const a = {record: 1, author: 'A', citation: 'a', works: ['Biz Markie: Alone Again (580)'], sources: ["Gilbert O'Sullivan: Alone Again (Naturally) (580)"]};
// Same piece, but as a source rather than a work.
const b = {record: 2, author: 'B', citation: 'b', works: ['Someone: Remix (1)'], sources: ['Biz Markie: Alone Again (3)']};
// Same composer, different piece.
const c = {record: 3, author: 'C', citation: 'c', works: ["Gilbert O'Sullivan: Clair (4)"]};
// Only an anonymous source in common with d.
const d = {record: 4, author: 'D', citation: 'd', sources: ['Anonymous: Chant (1)']};
const e = {record: 5, author: 'E', citation: 'e', sources: ['Anonymous: Hymn (2)']};
const gone = {record: 6, author: 'F', citation: 'f', deleted: true, works: ['Biz Markie: Alone Again (1)']};

const index = buildRelatedIndex([a, b, c, d, e, gone]);

describe('relatedRecords', () => {
    it('ranks shared pieces above shared composers, across works and sources', () => {
        let r = relatedRecords(index, a);
        expect(r.map(x => x.record.record)).toEqual([2, 3]);
        expect(r[0].pieces).toEqual(['Biz Markie: Alone Again']);
        expect(r[1].pieces).toEqual([]);
        expect(r[1].creators).toEqual(["Gilbert O'Sullivan"]);
    });
    it('never returns the record itself or deleted records', () => {
        let ids = relatedRecords(index, b).map(x => x.record.record);
        expect(ids).not.toContain(2);
        expect(ids).not.toContain(6);
    });
    it('ignores generic creators like Anonymous', () => {
        expect(relatedRecords(index, d)).toEqual([]);
    });
    it('returns nothing for records without works or sources', () => {
        expect(relatedRecords(index, {record: 99, citation: 'x'})).toEqual([]);
    });
});
