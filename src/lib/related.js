// Finds records that discuss the same pieces of music. A piece counts whether
// it appears as a work in one record and a source in another, since one item's
// borrowing work is often another item's source.

import { attributedIndexLabels, baseForm, splitCreatorTitle } from './search.js';

const SHARED_PIECE = 3;
const SHARED_CREATOR = 1;
// Sharing one of these says nothing about two records being related.
const GENERIC_CREATORS = new Set(['unattributed or general', 'anonymous', 'anon', 'anon.', 'traditional', 'trad.', 'various', 'unknown', 'folk song', 'chant', 'plainchant']);

function keysFor(record){
    let pieces = new Map();
    let creators = new Map();
    for(let mode of ['works', 'sources']){
        for(let label of attributedIndexLabels(record[mode], mode)){
            let key = baseForm(label);
            if(!pieces.has(key)) pieces.set(key, label);
            let {creator} = splitCreatorTitle(label);
            let ck = baseForm(creator || '');
            if(ck && !GENERIC_CREATORS.has(ck) && !creators.has(ck)) creators.set(ck, creator);
        }
    }
    return {pieces, creators};
}

export function buildRelatedIndex(records){
    let byPiece = new Map();
    let byCreator = new Map();
    let keys = new Map();
    for(let r of records){
        if(r.deleted) continue;
        let k = keysFor(r);
        keys.set(r.record, k);
        for(let p of k.pieces.keys()){
            if(!byPiece.has(p)) byPiece.set(p, []);
            byPiece.get(p).push(r);
        }
        for(let c of k.creators.keys()){
            if(!byCreator.has(c)) byCreator.set(c, []);
            byCreator.get(c).push(r);
        }
    }
    return {byPiece, byCreator, keys};
}

// Returns [{record, score, pieces: [label], creators: [name]}], best first.
export function relatedRecords(index, record, limit = 8){
    let own = index.keys.get(record.record) || keysFor(record);
    let scores = new Map();
    let entry = (r) => {
        if(!scores.has(r.record)) scores.set(r.record, {record: r, score: 0, pieces: [], creators: []});
        return scores.get(r.record);
    };
    for(let [key, label] of own.pieces){
        for(let r of index.byPiece.get(key) || []){
            if(r.record == record.record) continue;
            let e = entry(r);
            e.score += SHARED_PIECE;
            e.pieces.push(label);
        }
    }
    for(let [key, name] of own.creators){
        for(let r of index.byCreator.get(key) || []){
            if(r.record == record.record) continue;
            let e = entry(r);
            e.score += SHARED_CREATOR;
            e.creators.push(name);
        }
    }
    return [...scores.values()]
        .sort((a, b) => b.score - a.score || (a.record.author || '').localeCompare(b.record.author || ''))
        .slice(0, limit);
}
