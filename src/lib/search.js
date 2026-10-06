// Pure search, date and index helpers shared by the browse UI and the tests.
// Nothing in here touches Svelte state - keep it that way so it stays testable.

// Record fields searched alongside author and citation.
export const SEARCH_FIELDS = ['annotation', 'works', 'sources', 'contributors'];

// Best guess at the publication year from a Chicago-style citation, or -1.
export function getDate(c){
    let possible = [];
    let origC = c;
    c = c.replaceAll(/\"[^\"]+\"/g, ''); // Remove all quoted stuff
    c = c.replaceAll(/\“[^\”]+\”/g, ''); // Remove all quoted stuff
    c = c.replaceAll(/\'[^\'']+\'/g, ''); // Remove all quoted stuff
    c = c.replaceAll(/\<em\>(.+?)\<\/em\>/g, ''); // Remove all quoted stuff
    c = c.replaceAll(/(\d\d)\)\:\s*[0-9\-]+/g, '$1'); // Remove page refs
    c = c.replaceAll(/[^0-9\-\/]+/g, ' ');
    c = c.trim();
    let d = [...c.matchAll(/(\d\d)\d\d(\-|\/)(\d\d)/g)];
    if(d.length > 0) possible = [{
        index: d[d.length - 1].index,
        text: c,
        origC,
        res: parseInt(`${d[d.length - 1][0]}${d[d.length - 1][2]}`)
    }];
    d = [...c.matchAll(/(\d\d\d)\d(\-|\/)(\d)/g)];
    if(d.length > 0) possible = [{
        index: d[d.length - 1].index,
        text: c,
        origC,
        res: parseInt(`${d[d.length - 1][0]}${d[d.length - 1][2]}`)
    }];
    d = [...c.matchAll(/\d\d\d\d($|[^\-\/])/g)];
    if(d.length > 0) possible = [{
        index: d[d.length - 1].index,
        text: c,
        origC,
        res: parseInt(d[d.length - 1])
    }, ...possible];
    if(possible.length > 0){
        let max = Math.max(...possible.map(p => p.index));
        return possible.find(p => p.index == max).res;
    }
    return -1;
}

export function escapeRegex(s){
    return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function dumbQuotes(s){
    if(!s) return '';
    s = s.replace(/”/g,"\"");
    s = s.replace(/“/g,"\"");
    s = s.replace(/“/g,"\"");
    s = s.replace(/”/g,"\"");
    s = s.replace(/‘/g,"'");
    s = s.replace(/’/g,"'");
    s = s.replace(/‘/g,"'");
    s = s.replace(/’/g,"'");
    return s;
}

export function baseForm(s){
    return dumbQuotes(s).normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export function joinPossArray(a){
    if(!Array.isArray(a)) return a;
    return a.join(' ');
}

export function stripHtml(s){
    if(!s) return '';
    return String(s).replaceAll(/<[^>]+>/g, '').replaceAll(/&amp;/g, '&').replaceAll(/\s+/g, ' ').trim();
}

export function canonicalIndexLabel(value, mode){
    let clean = stripHtml(value);
    if(mode == 'works' || mode == 'sources'){
        clean = clean
            .replace(/\s*\([^)]*\d[^)]*\)\.?$/g, '')
            .replace(/\s*\[[^\]]*\d[^\]]*\]\.?$/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    return clean;
}

export function parseCreatorTitle(value, fallbackCreator = ''){
    let clean = canonicalIndexLabel(value, 'works');
    let genericHeads = ['work', 'works', 'source', 'sources'];
    let parts = clean.split(/:\s+/);
    if(parts.length > 1){
        let creator = parts.shift().trim();
        let title = parts.join(': ').trim();
        if(genericHeads.includes(baseForm(creator)) && title.includes(':')){
            return parseCreatorTitle(title, fallbackCreator);
        }
        if(!genericHeads.includes(baseForm(creator))){
            return {creator, title, attributed: true};
        }
        return {creator: fallbackCreator || 'Unattributed or General', title, attributed: !!fallbackCreator};
    }
    let commaAttribution = clean.match(/^([A-ZÀ-Þ][^,;:]{1,48}),\s+(.+)$/);
    if(commaAttribution){
        return {
            creator: commaAttribution[1].trim(),
            title: commaAttribution[2].trim(),
            attributed: true
        }
    }
    if(fallbackCreator) return {creator: fallbackCreator, title: clean, attributed: true};
    return {creator: 'Unattributed or General', title: clean, attributed: false};
}

export function splitCreatorTitle(value){
    let parsed = parseCreatorTitle(value);
    if(!parsed.attributed) return {creator: 'Unattributed or General', title: parsed.title};
    return {
        creator: parsed.creator,
        title: parsed.title
    }
}

export function attributedIndexLabels(values, mode){
    let currentCreator = '';
    let labels = [];
    for(let value of values || []){
        let clean = canonicalIndexLabel(value, mode);
        if(!clean) continue;
        if(mode == 'works' || mode == 'sources'){
            let parsed = parseCreatorTitle(clean, currentCreator);
            if(parsed.attributed){
                currentCreator = parsed.creator;
                labels.push(`${parsed.creator}: ${parsed.title}`);
            }else{
                labels.push(parsed.title);
            }
        }else{
            labels.push(clean);
        }
    }
    return labels;
}

export function allText(d){
    let text = '';
    for(let a of ['author', 'citation', ...SEARCH_FIELDS]){
        if(d[a]) text += `${joinPossArray(d[a])} `;
    }
    return text.trim();
}

// Walks a tree from the boolean grammar (boolean.pegjs). Every positive term
// that gets tested is pushed onto `highlights` so the UI can mark it up.
export function matchesQuery(tree, item, highlights = []){
    return orMatches(tree, item, highlights);
}

function orMatches(t, item, highlights, filter = false){
    if(t.record){
        // Only this record
        return item.record == t.record;
    }
    if(t.any_of){
        return t.any_of.some(e => andMatches(e, item, highlights, filter || t.filter));
    }
    console.log('malformed syntax!', t);
    return false;
}

function andMatches(t, d, highlights, filter = false){
    let failed = false;
    for(let e of t){
        if(!notMatches(e, d, highlights, filter)) failed = true;
    }
    return !failed;
}

function notMatches(t, d, highlights, filter = false){
    if(t.not){
        return !starMatches(t.not, d, highlights, filter, true);
    }
    return starMatches(t, d, highlights, filter);
}

function starMatches(t, d, highlights, filter = false, not = false){
    if(t.any_of){
        // nested OR statement
        return t.any_of.some(e => andMatches(e, d, highlights, t.filter || filter));
    }
    let re = escapeRegex(baseForm(t.term).replaceAll(/\s+/g, ' '));
    let f = t.filter || filter;
    if(['contributor','tag'].includes(f)){
        f = `${f}s`; // plural in db
    }
    let text;
    if(f == 'citation'){
        text = baseForm(`${d.author} ${d.citation}`);
    }else if(f){
        text = baseForm(joinPossArray(d[f]) || '');
    }else{
        // Search all of it
        text = baseForm(allText(d));
    }

    if(!t.blurStart) re = `\\b${re}`;
    if(!t.blurEnd) re = `${re}\\b`;
    if(!not){
        let bit = {term: re};
        if(f) bit.filter = f;
        highlights.push(bit);
    }
    return new RegExp(re).test(text.replaceAll(/\s+/g, ' '));
}
