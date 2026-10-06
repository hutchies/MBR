// Turns the Chicago-style citation strings in the bibliography into structured
// fields, and from there into RIS and BibTeX for reference managers.
// The citations are free text, so parsing is best effort: anything we cannot
// place still travels with the export as a note carrying the full citation.

import { getDate, stripHtml } from './search.js';

const OPEN_QUOTE = `["“]`;
const CLOSE_QUOTE = `["”]`;

function clean(s){
    return stripHtml(s || '')
        .replaceAll('&nbsp;', ' ')
        .replaceAll('&lt;', '<')
        .replaceAll('&gt;', '>')
        .replaceAll('&quot;', '"')
        .replaceAll('&#39;', "'")
        .replace(/\s+/g, ' ')
        .trim();
}

function trimPunct(s){
    return (s || '').trim().replace(/^[\s,;:.]+|[\s,;:]+$/g, '').replace(/\.$/, '').trim();
}

function firstEm(s){
    let m = s.match(/<em>(.*?)<\/em>/);
    return m ? trimPunct(clean(m[1])) : '';
}

// "Surname, Given" stays; "Given Surname" is flipped to match it.
function invertName(name){
    name = name.trim();
    if(!name || name.includes(',')) return name;
    let parts = name.split(/\s+/);
    if(parts.length == 1) return name;
    return `${parts.pop()}, ${parts.join(' ')}`;
}

// Editors inside a citation are all in natural order: "ed. Thomas J. Mathiesen and Benito V. Rivera".
export function parseNaturalNames(raw){
    return clean(raw)
        .replace(/,?\s*(et al\.?)$/i, '')
        .split(/,\s*and\s+|\s+and\s+|\s+with\s+|,\s+/)
        .map(n => n.trim())
        .filter(Boolean)
        .map(invertName);
}

// Chicago lists the first name inverted and the rest in natural order:
// "Döhl, Frédéric, and Albrecht Riethmüller, eds".
export function parseNames(raw){
    // Drop a closing full stop, but not the one on a trailing initial ("Burkholder, J.").
    let s = clean(raw).replace(/([^A-Z\s])\.$/, '$1').trim();
    let editors = false;
    if(!s || /^\[.*\]$/.test(s)) return {names: [], editors};
    s = s.replace(/,?\s*\b(eds?|editors?|comps?)\.?$/i, () => { editors = true; return ''; }).trim();
    s = s.replace(/,?\s*(et al\.?)$/i, '').trim();
    let names = [];
    let m = s.match(/^([^,]+,\s*[^,]+?)(?:,\s*and\s+|\s+and\s+|,\s+)(.+)$/);
    if(m){
        names.push(m[1].trim());
        for(let n of m[2].split(/,\s*and\s+|\s+and\s+|,\s+/)){
            if(n.trim()) names.push(invertName(n));
        }
    }else if(s.includes(',')){
        names.push(s);
    }else{
        names.push(invertName(s));
    }
    return {names, editors};
}

// "Place: Publisher, 1991." at the end of books and chapters.
function imprint(s){
    let m = clean(s).match(/(?:^|[.,]\s+)([^.:,]+(?:,\s*[A-Z][a-zA-Z.]{1,5})?):\s*([^:]+?),\s*(\d{4}(?:[-/]\d{2,4})?)\s*[.)]?\s*$/);
    if(!m) return {};
    return {place: m[1].trim(), publisher: m[2].trim()};
}

function pageRange(s){
    let m = (s || '').match(/(\d+)\s*[-–]\s*(\d+)/);
    if(!m) return {};
    let [, start, end] = m;
    // Chicago abbreviates the end page: 121-36 means 121-136.
    if(end.length < start.length) end = start.slice(0, start.length - end.length) + end;
    return {startPage: start, endPage: end};
}

export function parseCitation(record){
    let raw = (record.citation || '').trim();
    let year = getDate(raw);
    let out = {
        type: 'GEN',
        title: '',
        year: year > 0 ? String(year) : '',
        citation: clean(`${record.author ? `${record.author}${record.author.trim().endsWith('.') ? '' : '.'} ` : ''}${raw}`)
    };

    let quoted = raw.match(new RegExp(`^${OPEN_QUOTE}(.+?)${CLOSE_QUOTE}(?=\\s|$)\\s*(.*)$`, 's'));
    if(quoted){
        out.title = trimPunct(clean(quoted[1]));
        let rest = quoted[2];
        let restText = clean(rest);
        if(/\b(diss\.|dissertation|thesis|D\.M\.A\. document)|^(M\.\s?Mus|M\.M\.|M\.A\.|Ph\.D\.)/i.test(restText)){
            out.type = 'THES';
            out.thesisType = /^(M\.|master)/i.test(restText) ? 'masters' : 'phd';
            let school = restText.match(/^[^,]*,\s*(.+?),\s*\d{4}/);
            if(school) out.school = school[1].trim();
        }else if(/^(Chap\.\s+)?in\s/i.test(restText)){
            out.type = 'CHAP';
            out.container = firstEm(rest);
            let eds = restText.match(/\b(?:ed\.|eds\.|edited by)\s+(.+?)(?:,\s*\d|\.\s+[A-Z][^.]*:|$)/);
            if(eds) out.containerEditors = parseNaturalNames(eds[1]);
            Object.assign(out, pageRange(restText.match(/,\s*(\d+\s*[-–]\s*\d+)\.\s/)?.[1]));
            Object.assign(out, imprint(rest));
        }else if(/^<em>/.test(rest.trim()) || /^[A-Z][^.]*\s\d+(,\s*no\.\s*\d+)?\s*\(/.test(restText)){
            out.type = 'JOUR';
            out.container = firstEm(rest) || trimPunct(restText.match(/^([^0-9(]+)/)?.[1]);
            let after = clean(rest.replace(/^.*?<\/em>/, ''));
            let vol = after.match(/^\s*([\d/\-–]+)/) || restText.match(/\s(\d+)(?:,\s*no\.|\s*\()/);
            if(vol) out.volume = vol[1];
            let issue = restText.match(/no\.\s*(\d+(?:[-/]\d+)?)/);
            if(issue) out.issue = issue[1];
            Object.assign(out, pageRange(restText.match(/\):\s*([\d\s\-–]+)/)?.[1]));
        }else{
            Object.assign(out, imprint(rest));
        }
    }else if(/^<em>/.test(raw)){
        out.type = 'BOOK';
        out.title = firstEm(raw);
        let rest = clean(raw.replace(/^<em>.*?<\/em>/, ''));
        let series = rest.match(/^([^.:]+?,\s*\d+)\.\s/);
        if(series) out.series = series[1].trim();
        Object.assign(out, imprint(raw));
    }else{
        out.title = trimPunct(clean(raw.split(/\.\s/)[0]));
    }

    let {names, editors} = parseNames(record.author);
    if(editors && (out.type == 'BOOK' || out.type == 'GEN')){
        out.editors = names;
        out.authors = [];
    }else{
        out.authors = names;
    }
    return out;
}

export function recordUrl(record, baseUrl){
    return `${baseUrl.replace(/\/$/, '')}/record/${record.record}`;
}

export function toRIS(record, baseUrl){
    let c = parseCitation(record);
    let lines = [];
    let add = (tag, value) => {
        if(value) lines.push(`${tag}  - ${String(value).replace(/\s+/g, ' ').trim()}`);
    };
    add('TY', c.type);
    (c.authors || []).forEach(a => add('AU', a));
    (c.editors || []).forEach(e => add('ED', e));
    (c.containerEditors || []).forEach(e => add('ED', e));
    add('TI', c.title);
    add('T2', c.container);
    add('T3', c.series);
    add('VL', c.volume);
    add('IS', c.issue);
    add('SP', c.startPage);
    add('EP', c.endPage);
    add('PY', c.year);
    add('CY', c.place);
    add('PB', c.publisher || c.school);
    if(c.type == 'THES') add('M3', c.thesisType == 'masters' ? "Master's thesis" : 'Doctoral dissertation');
    add('AB', clean(record.annotation));
    (record.tags || []).forEach(t => add('KW', t));
    add('N1', `Citation: ${c.citation}`);
    if(record.works?.length) add('N1', `Works: ${clean(record.works.join('; '))}`);
    if(record.sources?.length) add('N1', `Sources: ${clean(record.sources.join('; '))}`);
    add('UR', recordUrl(record, baseUrl));
    add('DB', 'Musical Borrowing and Reworking');
    add('ID', `mbr${record.record}`);
    lines.push('ER  - ');
    return lines.join('\r\n');
}

export function recordsToRIS(records, baseUrl){
    return records.map(r => toRIS(r, baseUrl)).join('\r\n\r\n') + '\r\n';
}

function bibEscape(s){
    // Keep <em> as \emph{} and escape everything else LaTeX treats specially.
    let parts = String(s || '').split(/(<em>|<\/em>)/);
    let out = '';
    for(let p of parts){
        if(p == '<em>') out += '\\emph{';
        else if(p == '</em>') out += '}';
        // Whitespace next to the italics is significant, so no trimming here.
        else out += p.replace(/<[^>]+>/g, '').replaceAll('&amp;', '&').replace(/\s+/g, ' ').replace(/[\\{}]/g, '').replace(/([&%$#_])/g, '\\$1').replace(/~/g, '\\textasciitilde{}').replace(/\^/g, '\\textasciicircum{}');
    }
    return out.replace(/\s+/g, ' ').trim();
}

function asciiKey(s){
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9]/g, '').toLowerCase();
}

export function bibtexKey(record, parsed = parseCitation(record)){
    let who = (parsed.authors?.[0] || parsed.editors?.[0] || 'anon').split(',')[0];
    return `${asciiKey(who) || 'anon'}${parsed.year || 'nd'}mbr${record.record}`;
}

export function toBibTeX(record, baseUrl){
    let c = parseCitation(record);
    let entry = {
        JOUR: 'article',
        CHAP: 'incollection',
        BOOK: 'book',
        THES: c.thesisType == 'masters' ? 'mastersthesis' : 'phdthesis',
        GEN: 'misc'
    }[c.type];
    let fields = [];
    let add = (name, value, raw = false) => {
        if(value) fields.push(`  ${name} = {${raw ? value : bibEscape(value)}}`);
    };
    let titleSource = c.type == 'GEN' ? c.title : (record.citation.match(new RegExp(`^${OPEN_QUOTE}(.+?)${CLOSE_QUOTE}(?=\\s|$)`, 's'))?.[1] || c.title);
    add('author', (c.authors || []).map(bibEscape).join(' and '), true);
    add('editor', [...(c.editors || []), ...(c.containerEditors || [])].map(bibEscape).join(' and '), true);
    add('title', trimPunct(bibEscape(titleSource)), true);
    if(c.type == 'JOUR') add('journal', c.container);
    if(c.type == 'CHAP') add('booktitle', c.container);
    add('series', c.series);
    add('volume', c.volume);
    add('number', c.issue);
    if(c.startPage) add('pages', `${c.startPage}--${c.endPage}`, true);
    add('year', c.year);
    add('address', c.place);
    add('publisher', c.type == 'THES' ? '' : c.publisher);
    add('school', c.school);
    add('abstract', record.annotation);
    add('keywords', (record.tags || []).join(', '));
    add('note', c.type == 'GEN' ? c.citation : `Musical Borrowing and Reworking, record ${record.record}`);
    add('url', recordUrl(record, baseUrl), true);
    return `@${entry}{${bibtexKey(record, c)},\n${fields.join(',\n')}\n}`;
}

export function recordsToBibTeX(records, baseUrl){
    return records.map(r => toBibTeX(r, baseUrl)).join('\n\n') + '\n';
}

// Highwire Press tags, which Zotero, Mendeley and Google Scholar read from the page.
export function citationMeta(record, baseUrl){
    let c = parseCitation(record);
    let meta = [['citation_title', c.title]];
    (c.authors || []).forEach(a => meta.push(['citation_author', a]));
    (c.editors || []).forEach(e => meta.push(['citation_editor', e]));
    if(c.year) meta.push(['citation_publication_date', c.year]);
    if(c.type == 'JOUR') meta.push(['citation_journal_title', c.container]);
    if(c.type == 'CHAP') meta.push(['citation_inbook_title', c.container]);
    if(c.type == 'THES') meta.push(['citation_dissertation_institution', c.school]);
    if(c.publisher) meta.push(['citation_publisher', c.publisher]);
    if(c.volume) meta.push(['citation_volume', c.volume]);
    if(c.issue) meta.push(['citation_issue', c.issue]);
    if(c.startPage) meta.push(['citation_firstpage', c.startPage], ['citation_lastpage', c.endPage]);
    meta.push(['citation_abstract_html_url', recordUrl(record, baseUrl)]);
    return meta.filter(([, v]) => v).map(([name, content]) => ({name, content}));
}

export function downloadText(text, filename, mime){
    let url = URL.createObjectURL(new Blob([text], {type: mime}));
    let a = document.createElement('a');
    a.href = url;
    a.download = filename;
    // Keep the router's global link handler from trying to navigate to the blob.
    a.addEventListener('click', e => e.stopPropagation());
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
