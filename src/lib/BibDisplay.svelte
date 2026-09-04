<script>
    // @ts-nocheck

    //import { data } from '$lib/data.js';
    import { paginate, LightPaginationNav } from 'svelte-paginate'
    import { parse } from './boolean.js';
    import { onMount } from "svelte";
    import { pb } from "./pb.js";
    import { tags, data, contributors, localDataLoaded, params} from './shared.svelte.js';
    import { path, resolve, match, params as elegua_params} from 'elegua';

    let result = '';

    let currentTag = false;
    let currentContributor = false;
    let fullText = '';
    let adminIcons = {
        add: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"></path></svg>',
        close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4 6.4 5Z"></path></svg>',
        edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.3V20h2.7L17.8 8.9l-2.7-2.7L4 17.3ZM19.7 7a1 1 0 0 0 0-1.4l-1.3-1.3a1 1 0 0 0-1.4 0l-1 1L18.7 8l1-1Z"></path></svg>',
        view: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5c5 0 8.7 4.2 10 7-1.3 2.8-5 7-10 7s-8.7-4.2-10-7c1.3-2.8 5-7 10-7Zm0 2C8.5 7 5.7 9.6 4.3 12c1.4 2.4 4.2 5 7.7 5s6.3-2.6 7.7-5C18.3 9.6 15.5 7 12 7Zm0 2.2A2.8 2.8 0 1 1 12 14.8 2.8 2.8 0 0 1 12 9.2Z"></path></svg>',
        delete: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21c-1.1 0-2-.9-2-2V8h14v11c0 1.1-.9 2-2 2H7ZM9 4h6l1 2h4v2H4V6h4l1-2Zm0 6v8h2v-8H9Zm4 0v8h2v-8h-2Z"></path></svg>'
    }
    let exactPhrase = true;
    let showDeletedOnly = false;
    let dateStart = false;
    let dateEnd = false;
    let dateBoundsReady = false;
    let indexSearch = '';
    let indexSort = 'alpha';
    let indexPreview = false;

    //let tags = Array.from(new Set(data.filter(d => d.tags).flatMap(d => d.tags)));
    //let contributors = Array.from(new Set(data.filter(d => d.tags).flatMap(d => d.contributors)));

    function getDate(c, log = false){
        /*c = c.replaceAll('[', '');
        c = c.replaceAll(']', '');
        let d = c.match(/[^0-9](\d\d\d\d)(\.)?$/);
        if(d && d[1]) return parseInt(d[1]);
        d = c.match(/,\s(\d\d\d\d)$/);
        if(d && d[1]) return parseInt(d[1]);
        d = c.match(/(\d\d\d\d)\)/);
        if(d && d[1]) return parseInt(d[1]);
        d = c.match(/\((\d\d\d\d)/);
        if(d && d[1]) return parseInt(d[1]);
        d = c.match(/(\d\d)\d\d(\-|\/)(\d\d)((\.?$)|\))/);
        if(d && d[1]) return parseInt(`${d[1]}${d[3]}`);
        d = c.match(/\d\d\d\d(\-|\/)(\d\d\d\d)((\.?$)|\))/);
        if(d && d[1]) return parseInt(d[1]);
        
        return -1;*/
        let possible = [];
        let origC = c;
        c = c.replaceAll(/\"[^\"]+\"/g, ''); // Remove all quoted stuff
        c = c.replaceAll(/\“[^\”]+\”/g, ''); // Remove all quoted stuff
        c = c.replaceAll(/\'[^\'']+\'/g, ''); // Remove all quoted stuff
        c = c.replaceAll(/\<em\>(.+?)\<\/em\>/g, ''); // Remove all quoted stuff
        //if(log) console.log(c);
        c = c.replaceAll(/(\d\d)\)\:\s*[0-9\-]+/g, '$1'); // Remove page refs
        c = c.replaceAll(/[^0-9\-\/]+/g, ' ');
        c = c.trim();
        //if(log) console.log(c);
        let d = [...c.matchAll(/(\d\d)\d\d(\-|\/)(\d\d)/g)];
        if(log && d.length > 0 && parseInt(d[d.length - 1]) < 1500) console.log(d);
        if(d.length > 0) possible = [{
            index: d[d.length - 1].index,
            text: c,
            origC,
            res: parseInt(`${d[d.length - 1][0]}${d[d.length - 1][2]}`)
        }];
        d = [...c.matchAll(/(\d\d\d)\d(\-|\/)(\d)/g)];
        //if(log && d.length > 0 && parseInt(d[d.length - 1]) < 1500) console.log(d);
        if(d.length > 0) possible = [{
            index: d[d.length - 1].index,
            text: c,
            origC,
            res: parseInt(`${d[d.length - 1][0]}${d[d.length - 1][2]}`)
        }];
        d = [...c.matchAll(/\d\d\d\d($|[^\-\/])/g)];
        //if(log && d.length > 0 && parseInt(d[d.length - 1]) < 1500) console.log(d);
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

    function allText(d){
        let text = '';
        for(let a of ['author', 'citation', ...possibleAtts]){
            if(d[a]) text += `${joinPossArray(d[a])} `;
        }
        return text.trim();
    }
    
    function escapeRegex(s){
        return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    function dumbQuotes(s){
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

    function baseForm(s){
        return dumbQuotes(s).normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
    }

    function filterByOptions(d, t, c, ft){
        if(t && d.tags && !d.tags.includes(t)) return false;
        if(c &&  (!d.contributors || !d.contributors.includes(c))) return false;
        if(dateStart || dateEnd){
            let y = getDate(d.citation);
            let start = Math.min(parseInt(dateStart), parseInt(dateEnd));
            let end = Math.max(parseInt(dateStart), parseInt(dateEnd));
            if(y < 0) return false;
            if(start && y < start) return false;
            if(end && y > end) return false;
        }
        if(ft && !searchMatches(d)) return false;
        //if(ft && !baseForm(allText(d)).includes(baseForm(ft))) return false;
        return true;
    }

    function joinPossArray(a){
        if(!Array.isArray(a)) return a;
        return a.join(' ');
    }

    function searchMatches(d){
        bitsToHighlight = [];
        searchError = false;
        let record = d.record;
        if(currentSearch == 'simple'){
            let haystack = baseForm(allText(d));
            if(exactPhrase) return haystack.includes(baseForm(fullText));
            return baseForm(fullText).split(/\s+/).filter(Boolean).every(term => haystack.includes(term));
        }
        if(currentSearch == 'citation'){
            return baseForm(`${d.author}. ${d.citation}`).includes(baseForm(fullText))
        }
        if(currentSearch != 'advanced'){
            return baseForm(stripHtml(joinPossArray(d[currentSearch]) || '')).includes(baseForm(stripHtml(fullText)))
        }
        // move the below to starMatches so you can search sub-bits if need be
        //d = baseForm(allText(d));
        
        try{
            let t = parse(fullText);
            // If it works, work through tree
            return orMatches(t, {record, item: d});
        }catch(e){
            console.log('Error searching:', e);
            searchError = true;
            // Fall back to full text search
            return baseForm(allText(d)).includes(baseForm(fullText));
        }

    }

    let searchError = false;

    function orMatches(t, {record, item}, filter = false){
        if(t.record){
            // Only this record
            return record == t.record;
        }
        if(t.any_of){
            return t.any_of.some(e => andMatches(e, item, filter || t.filter));
        }/*else if(Array.isArray(t)){
            return andMatches(t, d);
        }*/else{
            console.log('malformed syntax!', t);
            //alert('malformed syntax!');
            return false;
        }
    }

    function andMatches(t, d, filter = false){
        let failed = false;
        for(let e of t){
            if(!notMatches(e, d, filter)) failed = true;
        }
        return !failed;
    }

    function notMatches(t, d, filter = false){
        if(t.not){
            return !starMatches(t.not, d, filter, true);
        }else{
            return starMatches(t, d, filter);
        }
    }

    function starMatches(t, d, filter = false, not = false){
        if(t.any_of){
            // nested OR statement
            return t.any_of.some(e => andMatches(e, d, t.filter || filter));
        }
        let re = escapeRegex(baseForm(t.term).replaceAll(/\s+/g, ' '));
        let f = t.filter || filter;
        if(['contributor','tag'].includes(f)){
            f = `${f}s`; // plural in db
        }
        if(f){
            if(f == 'citation'){
                d = baseForm(`${d.author} ${d.citation}`);
            }else{
                d = baseForm(joinPossArray(d[f]) || '');
            }
        }else{
            // Search all of it
            d = baseForm(allText(d));
            
        }

        if(!t.blurStart) re = `\\b${re}`;
        if(!t.blurEnd) re = `${re}\\b`;
        if(!not){
            let bit = {term: re};
            if(f){
                bit.filter = f;
            }
            bitsToHighlight.push(bit);
            
        }
        //console.log(t, d, re);
        let exp = new RegExp(re);

        return exp.test(d.replaceAll(/\s+/g, ' '));
    }

    function upperInitial(s){
        return `${s[0].toUpperCase()}${s.slice(1)}`
    }

    let possibleAtts = ['annotation', 'works', 'sources', 'contributors']
    let bitsToHighlight = [];
    
    function highlightMatch(origText, where){
        if(!fullText) return origText;
        //if(currentSearch == 'advanced') return origText;
        if(currentSearch != 'simple' && currentSearch != 'advanced' && currentSearch != where) return origText; // only the area you were looking
        
        if(currentSearch != 'advanced'){
            // Raw user input: escape it, or a stray bracket in a pasted citation kills the render.
            bitsToHighlight = exactPhrase
                ? [{term: escapeRegex(fullText)}]
                : fullText.split(/\s+/).filter(Boolean).map(term => ({term: escapeRegex(term)}));
        }
        let text = origText;
        //le.log(bitsToHighlight)

        let bits = bitsToHighlight.filter(b => !b.filter || b.filter == where || (where == 'author' && b.filter == 'citation'))
        if(bits.length == 0) return origText;
        let bit = bits.map(b => `(${b.term})`).join('|');
        let t = baseForm(text);
        let re;
        try{
            re = new RegExp(baseForm(bit), 'ig');
        }catch(e){
            return origText; // never let highlighting take down the list
        }
        let start = 0;
        let newString = '';

        for(let m of t.matchAll(re)){
            newString += text.slice(start, m.index);
            newString += `<span style="background-color: yellow;">${text.slice(m.index, m.index + m[0].length)}</span>`;
            start = m.index + m[0].length;
        }
        newString += text.slice(start); // To end
        text = newString;
        return text;
        //return t.replace(re, (match, offset, string) => `<span style="background-color: yellow;">${origText.slice(offset, offset + match.length)}</span>`);
    }

    let sortByAuthor = (a,b) => (a.author || '').localeCompare(b.author || '');
    let sortByDate = (a,b) => getDate(a.citation) - getDate(b.citation);
    let sortByDateReversed = (a,b) => getDate(b.citation) - getDate(a.citation);

    let filteredData;
    let tempFT = '';
    let searchTimer;
    let currentSort = sortByAuthor;
    let currentSearch = 'simple';
    let searchTypes = {
        'simple': 'Simple (phrase in full text)',
        'advanced': 'Advanced...',
        'author': 'Author name only',
        'citation': 'Citation only',
        'annotation': 'Annotation only',
        'sources': 'Sources list only',
        'works': 'Works list only'
    }

    let sortTypes = {
        'Author (A-Z)': sortByAuthor,
        'Publication date (old-new)': sortByDate,
        'Publication date (new-old)': sortByDateReversed
    }

    let pageSizes = [10, 25, 50, 100, -1]

    

    function filterData(fd, d, ct, cc, ft, cs, css, ds, de, edo, sdo){
        //console.log('filtering data', $data);
        filteredData = $data
            .filter(d => $path == '/admin' && showDeletedOnly ? d.deleted : !d.deleted)
            .filter(d => filterByOptions(d, currentTag, currentContributor, fullText))
            .sort(sortByDate)
            .sort(currentSort);
        currentPage = 1;
        //if(navigator && navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }

    function filterByName(dbn, fd, nf){
        //console.log('filtering by name', filteredData);
        dataByName = filteredData.filter(d => nameStartsWith(d, nameFilter));
        currentPage = 1;
    }

    $: filterData(filteredData, $data, currentTag, currentContributor, fullText, currentSort, currentSearch, dateStart, dateEnd, exactPhrase, showDeletedOnly)
    let paginatedData = [];
    let currentPage = 1;
    let pageSize = 50;
    let dataByName = [];
    $: filterByName(dataByName, filteredData, nameFilter)
    $: paginatedData = paginate({ items: dataByName, pageSize, currentPage })
    $: pageStart = dataByName.length ? ((currentPage - 1) * pageSize) + 1 : 0;
    $: pageEnd = Math.min(currentPage * pageSize, dataByName.length);
    $: pageSummary = !$localDataLoaded ? 'Loading local bibliography...' : dataByName.length ? `Showing ${pageStart}-${pageEnd} of ${dataByName.length}` : 'No records found';
    $: pageCount = Math.max(1, Math.ceil(dataByName.length / pageSize));
    $: pageOptions = Array.from({length: pageCount}, (_, i) => i + 1);
    $: dateBounds = getDateBounds($data);
    $: dateFilterActive = dateBounds.min && dateBounds.max && (parseInt(dateStart) != dateBounds.min || parseInt(dateEnd) != dateBounds.max);
    $: yearRangeMin = Math.min(parseInt(dateStart), parseInt(dateEnd));
    $: yearRangeMax = Math.max(parseInt(dateStart), parseInt(dateEnd));
    $: yearRangeStyle = `--start:${sliderPercent(yearRangeMin)}%; --end:${sliderPercent(yearRangeMax)}%;`;
    $: if(!dateBoundsReady && dateBounds.min && dateBounds.max){
        dateStart = dateBounds.min;
        dateEnd = dateBounds.max;
        dateBoundsReady = true;
    }
    function recordIdFromPath(routePath){
        let match = routePath.match(/^\/record\/([^/?#]+)/);
        return match ? decodeURIComponent(match[1]) : '';
    }

    $: indexMode = getIndexMode($path);
    let lastRoutePath = '';
    $: if($path != lastRoutePath){
        indexPreview = false;
        if(indexMode) indexSearch = '';
        lastRoutePath = $path;
    }
    $: recordRouteId = recordIdFromPath($path);
    $: isRecordDetail = !!recordRouteId;
    $: indexItems = getIndexItems(indexMode, $data, indexSearch, indexSort);
    $: groupedIndexItems = getGroupedIndexItems(indexMode, indexItems, indexSort);
    $: detailRecord = isRecordDetail ? $data.find(d => d.record == recordRouteId) : false;

    let savedPD;

    window.addEventListener('beforeprint', () => {
        $params.printing = true;
        savedPD = paginatedData;
        paginatedData = dataByName;
    })

     window.addEventListener('afterprint', () => {
        
        if(savedPD) paginatedData = savedPD;
        $params.printing = false;
    })

    function nameStartsWith(d, n){
        if(!n) return true;
        let norm = baseForm(d.author);
        if(norm.startsWith(n)) return true;
    }

    function debounce(func, timeout = 300){
        let timer;
        return (...args) => {
            clearTimeout(timer);
            timer = setTimeout(() => { func.apply(this, args); }, timeout);
        };
    }

    function queueSearch(){
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            fullText = tempFT.trim();
        }, 280);
    }

    function commitSearch(){
        clearTimeout(searchTimer);
        fullText = tempFT.trim();
    }

    function clearFilters(){
        currentTag = false;
        currentContributor = false;
        currentSearch = 'simple';
        tempFT = '';
        fullText = '';
        exactPhrase = true;
        nameFilter = false;
        searchError = false;
        showDeletedOnly = false;
        dateStart = dateBounds.min;
        dateEnd = dateBounds.max;
    }

    function clearSearch(){
        clearTimeout(searchTimer);
        tempFT = '';
        fullText = '';
        searchError = false;
    }

    function gotoPage(page){
        currentPage = Math.min(Math.max(parseInt(page), 1), pageCount);
    }

    function sliderPercent(value){
        if(!dateBounds.min || !dateBounds.max || dateBounds.min == dateBounds.max) return 0;
        return ((parseInt(value) - dateBounds.min) / (dateBounds.max - dateBounds.min)) * 100;
    }

    function getDateBounds(records){
        let years = records.map(d => getDate(d.citation)).filter(y => y > 0);
        return {
            min: years.length ? Math.min(...years) : false,
            max: years.length ? Math.max(...years) : false
        }
    }

    function getIndexMode(path){
        if(path == '/tags') return 'tags';
        if(path == '/contributors') return 'contributors';
        if(path == '/works') return 'works';
        if(path == '/sources') return 'sources';
        return false;
    }

    function stripHtml(s){
        if(!s) return '';
        return String(s).replaceAll(/<[^>]+>/g, '').replaceAll(/&amp;/g, '&').replaceAll(/\s+/g, ' ').trim();
    }

    function canonicalIndexLabel(value, mode){
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

    function parseCreatorTitle(value, fallbackCreator = ''){
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

    function splitCreatorTitle(value){
        let parsed = parseCreatorTitle(value);
        if(!parsed.attributed) return {creator: 'Unattributed or General', title: parsed.title};
        return {
            creator: parsed.creator,
            title: parsed.title
        }
    }

    function attributedIndexLabels(values, mode){
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

    function browseUrl(mode, value){
        let p = new URLSearchParams();
        if(mode == 'tags') p.set('tag', value);
        if(mode == 'contributors') p.set('contributor', value);
        if(mode == 'works' || mode == 'sources'){
            p.set('searchType', mode);
            p.set('search', stripHtml(value));
        }
        return `/browse?${p.toString()}`;
    }

    function sortIndexItems(items, mode, sort){
        if((mode == 'works' || mode == 'sources') && sort == 'records'){
            return items.sort((a,b) => b.count - a.count || a.label.localeCompare(b.label));
        }
        return items.sort((a,b) => a.label.localeCompare(b.label));
    }

    function getIndexItems(mode, records, filter, sort){
        if(!mode) return [];
        let counts = new Map();
        let activeRecords = records.filter(d => !d.deleted);
        let add = (value, record) => {
            if(!value) return;
            let clean = canonicalIndexLabel(value, mode);
            if(!clean) return;
            if(!counts.has(clean)) counts.set(clean, new Set());
            counts.get(clean).add(record.record);
        }
        for(let d of activeRecords){
            if(mode == 'tags') (d.tags || []).forEach(value => add(value, d));
            if(mode == 'contributors') (d.contributors || []).forEach(value => add(value, d));
            if(mode == 'works') attributedIndexLabels(d.works, mode).forEach(value => add(value, d));
            if(mode == 'sources') attributedIndexLabels(d.sources, mode).forEach(value => add(value, d));
        }
        let q = baseForm(filter || '');
        let items = [...counts.entries()]
            .map(([label, records]) => {
                let item = {label, count: records.size};
                if(mode == 'works' || mode == 'sources') item = {...item, ...splitCreatorTitle(label)};
                return item;
            })
            .filter(item => !q || baseForm(item.label).includes(q));
        return sortIndexItems(items, mode, sort);
    }

    function getGroupedIndexItems(mode, items, sort){
        if(mode != 'works' && mode != 'sources') return [];
        let groups = new Map();
        for(let item of items){
            let creator = item.creator || 'Unattributed or General';
            if(!groups.has(creator)) groups.set(creator, []);
            groups.get(creator).push(item);
        }
        let grouped = [...groups.entries()]
            .map(([creator, works]) => ({
                creator,
                count: works.reduce((total, work) => total + work.count, 0),
                works: sort == 'records'
                    ? works.sort((a,b) => b.count - a.count || a.title.localeCompare(b.title))
                    : works.sort((a,b) => a.title.localeCompare(b.title))
            }));
        if(sort == 'records') return grouped.sort((a,b) => b.count - a.count || a.creator.localeCompare(b.creator));
        return grouped.sort((a,b) => a.creator.localeCompare(b.creator));
    }

    function recordMatchesIndexItem(record, mode, label){
        if(mode == 'tags') return (record.tags || []).includes(label);
        if(mode == 'contributors') return (record.contributors || []).includes(label);
        if(mode == 'works' || mode == 'sources'){
            return attributedIndexLabels(record[mode], mode).some(value => canonicalIndexLabel(value, mode) == label);
        }
        return false;
    }

    function openIndexPreview(item){
        let records = $data
            .filter(d => !d.deleted)
            .filter(d => recordMatchesIndexItem(d, indexMode, item.label))
            .sort(sortByDate)
            .sort(sortByAuthor);
        indexPreview = {mode: indexMode, item, records};
    }

    function indexTitle(mode){
        if(mode == 'tags') return 'Browse by Tag';
        if(mode == 'contributors') return 'Browse by Contributor';
        if(mode == 'works') return 'Works Index';
        if(mode == 'sources') return 'Sources Index';
        return '';
    }

    function getInitials(data){
        let i = [];
        for(let d of data){
            let n = baseForm(d.author)[0]?.toUpperCase();
            if(n && !i.includes(n)){
                i.push(n)
            }
        }
        return i.sort((a,b) => a.localeCompare(b));
    }

    function getLastName(t){
        if(!t) return '';
        return t.split(' ').slice(-1)[0];
    }

    function sortByLastName(a,b){
        return getLastName(a).localeCompare(getLastName(b));
    }
    
    let nameFilter = false;

    let copiedToClipboard = false;

    async function exportLink(r){
        let toCopy = `${window.origin}/record/${r}`;
        await navigator.clipboard.writeText(toCopy);
        copiedToClipboard = r;
    }

    async function exportCitation(d){
        let rich = sourceElements[d.record]?.innerHTML;
        if(!rich) return;
        let plain = sourceElements[d.record]?.innerText || sourceElements[d.record]?.textContent;
        if(typeof ClipboardItem !== 'undefined' && ClipboardItem.supports?.('text/html')){
            let item = new ClipboardItem({
                'text/html': new Blob([rich], {type: 'text/html'}),
                'text/plain': new Blob([plain], {type: 'text/plain'})
            })
            await navigator.clipboard.write([item]);
        }else{
            await navigator.clipboard.writeText(plain);
        }
        copiedToClipboard = `${d.record} citation`;
    }

    function scholarSearch(d){
        let plain = sourceElements[d.record]?.innerText || sourceElements[d.record]?.textContent;
        let p = new URLSearchParams();
        p.set('q', plain);
        window.open(`https://scholar.google.com/scholar?${p.toString()}`, '_blank');
    }

    async function exportSearch(){
        let p = new URLSearchParams();
        p.set('searchType', currentSearch);
        //p.set('search', fullText);
        let toCopy = `${window.location.origin}/search/${encodeURIComponent(fullText)}?${p.toString()}`;
        await navigator.clipboard.writeText(toCopy);
        copiedToClipboard = `search ${fullText}`;
    }

    let advancedRulesHidden = false;
    let lastRouteKey = '';

    function applyRouteParams(){
        let routeKey = `${$path}${window.location.search}`;
        if(routeKey == lastRouteKey) return;
        lastRouteKey = routeKey;
        let routeRecord = recordIdFromPath($path);
        if(routeRecord){
            specificRecord = routeRecord;
            currentSearch = 'advanced';
            fullText = `record:${specificRecord}`;
            tempFT = fullText;
            //specificRecord = p.get('record');
            advancedRulesHidden = true;
        }
        if(resolve($path, /search\/([^?]+)/)){
            fullText = decodeURIComponent($match[1]);
            tempFT = fullText;
            advancedRulesHidden = true;
        }
        let up =  new URLSearchParams(window.location.search);
        if($path == '/browse'){
            currentTag = false;
            currentContributor = false;
            currentSearch = 'simple';
            tempFT = '';
            fullText = '';
        }
        if(up.has('tag')) currentTag = up.get('tag');
        if(up.has('contributor')) currentContributor = up.get('contributor');
        if(up.has('search')){
            fullText = up.get('search');
            tempFT = fullText;
        }
        if(up.has('searchType')){
            currentSearch = up.get('searchType')
        }
    }

    onMount(applyRouteParams);
    $: if($path) applyRouteParams();

    let specificRecord = '';

    function j(arr){
        if(!arr) return null;
        return {arr}
    }

    let sourceElements = {};

</script>

{#if indexMode}
    <main class="index_page">
        <div class="index_header">
            <div>
                <h2>{indexTitle(indexMode)}</h2>
                {#if indexMode == 'works' || indexMode == 'sources'}
                    <div class="index_switch">
                        <a href="/works" class:selected={indexMode == 'works'}>Works</a>
                        <a href="/sources" class:selected={indexMode == 'sources'}>Sources</a>
                    </div>
                {/if}
            </div>
            <div class="index_tools">
                {#if indexMode == 'works' || indexMode == 'sources'}
                    <label class="index_sort">
                        <span>Sort</span>
                        <select bind:value={indexSort}>
                            <option value="alpha">A-Z</option>
                            <option value="records">Most records</option>
                        </select>
                    </label>
                {/if}
                <label class="index_search">
                    <span>Filter this index</span>
                    <input bind:value={indexSearch} />
                </label>
            </div>
        </div>
        {#if indexMode == 'works' || indexMode == 'sources'}
            <div class="work_index">
                {#each groupedIndexItems as group}
                    <details class="creator_group" open={!!indexSearch}>
                        <summary>
                            <span>{group.creator}</span>
                            <span>{group.works.length} {group.works.length == 1 ? 'piece' : 'pieces'} · {group.count} {group.count == 1 ? 'record' : 'records'}</span>
                        </summary>
                        <div class="creator_works">
                            {#each group.works as item}
                                <div class="index_item work_item">
                                    <a class="index_link" href={browseUrl(indexMode, item.label)}>
                                        <span>{item.title}</span>
                                    </a>
                                    <button class="index_preview_button" type="button" on:click={() => openIndexPreview(item)}>
                                        <span class="preview_icon">{@html adminIcons.view}</span>
                                        <span>{item.count}</span>
                                        <span class="preview_hint">View records</span>
                                    </button>
                                </div>
                            {/each}
                        </div>
                    </details>
                {/each}
            </div>
        {:else}
            <div class="index_grid">
                {#each indexItems as item}
                    <div class="index_item">
                        <a class="index_link" href={browseUrl(indexMode, item.label)}>
                            <span>{item.label}</span>
                        </a>
                        <button class="index_preview_button" type="button" on:click={() => openIndexPreview(item)}>
                            <span class="preview_icon">{@html adminIcons.view}</span>
                            <span>{item.count}</span>
                            <span class="preview_hint">View records</span>
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
        {#if !indexItems.length}
            <div class="empty_state">
                <h2>No matching index entries</h2>
                <p>Try a broader index filter.</p>
            </div>
        {/if}
        {#if indexPreview}
            <div class="preview_scrim" role="presentation">
                <div class="record_preview" role="dialog" aria-modal="true" aria-labelledby="preview_title">
                    <div class="preview_header">
                        <div>
                            <h2 id="preview_title">{indexPreview.item.label}</h2>
                            <p>{indexPreview.records.length} {indexPreview.records.length == 1 ? 'record' : 'records'}</p>
                        </div>
                        <button type="button" class="preview_close" aria-label="Close preview" on:click={() => indexPreview = false}>
                            {@html adminIcons.close}
                        </button>
                    </div>
                    <div class="preview_records">
                        {#each indexPreview.records as record}
                            <details class="preview_record">
                                <summary>
                                    {#if record.author}<span class="author">{@html record.author}{#if !record.author.endsWith('.')}.{/if}</span>{/if}
                                    {@html record.citation}
                                </summary>
                                {#each possibleAtts as a}
                                    {#if record[a]}
                                        <section class="record_section">
                                            <div class="chip {a} chip_details">{upperInitial(a)}</div>
                                            {#if Array.isArray(record[a])}
                                                <div>{@html record[a].join('; ')}</div>
                                            {:else}
                                                <div>{@html record[a]}</div>
                                            {/if}
                                        </section>
                                    {/if}
                                {/each}
                                <div class="record_actions">
                                    <a class="chip record action_chip" href={`/record/${record.record}`}>Open record page</a>
                                </div>
                            </details>
                        {/each}
                    </div>
                </div>
            </div>
        {/if}
    </main>
{:else if isRecordDetail}
    <main class="record_detail">
        {#if detailRecord}
            <div class="detail_actions noprint">
                <a href="/browse">Back to Browse</a>
                <button type="button" on:click={() => window.print()}>Print record</button>
            </div>
            <article class="detail_record">
                <h2>{#if detailRecord.author}<span class="author">{@html detailRecord.author}{#if !detailRecord.author.endsWith('.')}.{/if}</span>{/if} {@html detailRecord.citation}</h2>
                {#each possibleAtts as a}
                    {#if detailRecord[a]}
                        <section class="record_section">
                            <div class="chip {a} chip_details">{upperInitial(a)}</div>
                            {#if Array.isArray(detailRecord[a])}
                                <div>{@html detailRecord[a].join('; ')}</div>
                            {:else}
                                <div>{@html detailRecord[a]}</div>
                            {/if}
                        </section>
                    {/if}
                {/each}
            </article>
        {:else if !$localDataLoaded}
            <div class="empty_state">
                <h2>Loading bibliography</h2>
                <p>The offline records are loading from the local app bundle.</p>
            </div>
        {:else}
            <div class="empty_state">
                <h2>Record not found</h2>
                <p>No record with that number is available.</p>
                <a href="/browse">Back to Browse</a>
            </div>
        {/if}
    </main>
{:else}
<details open class="filters noprint">
    <summary>
        <span class="summary_label">
            <span class="summary_chevron" aria-hidden="true">›</span>
            Search and filters
        </span>
        <span class="summary_tools">
            <span class="page_summary">{pageSummary}</span>
            {#if pageSize < dataByName.length}
                <span class="compact_pager" aria-label="Pagination">
                    <button type="button" aria-label="Previous page" disabled={currentPage <= 1} on:click={(e) => {e.preventDefault(); gotoPage(currentPage - 1)}}>‹</button>
                    <label>
                        Page
                        <select value={currentPage} on:click={(e) => e.preventDefault()} on:change={e => gotoPage(e.currentTarget.value)}>
                            {#each pageOptions as p}
                                <option value={p}>{p}</option>
                            {/each}
                        </select>
                        of {pageCount}
                    </label>
                    <button type="button" aria-label="Next page" disabled={currentPage >= pageCount} on:click={(e) => {e.preventDefault(); gotoPage(currentPage + 1)}}>›</button>
                </span>
            {/if}
        </span>
    </summary>
        <div class="form controls">
            <label class="input_block">
                <span>Tag</span>
                <select bind:value={currentTag}>
                    <option value={false}>All tags</option>
                    {#each tags as t}
                        <option value={t}>{t}</option>
                    {/each}
                </select>
            </label>
            <label class="input_block">
                <span>Contributor</span>
                <select bind:value={currentContributor}>
                        <option value={false}>All contributors</option>
                    {#each $contributors.sort(sortByLastName) as c}
                        <option value={c}>{c}</option>
                    {/each}
                </select>
            </label>
            <label class="input_block">
                <span>Sort</span>
                <select bind:value={currentSort}>
                    {#each Object.keys(sortTypes) as s}
                        <option value={sortTypes[s]}>{s}</option>
                    {/each}
                </select>
            </label>
            <label class="input_block compact">
                <span>Per page</span>
                <select bind:value={pageSize}>
                    {#each pageSizes as s}
                        {#if s == -1}
                            <option value={$data.length}>all</option>
                        {:else}
                            <option value={s}>{s}</option>
                        {/if}
                    {/each}
                </select>
            </label>
            {#if fullText || currentTag || currentContributor || nameFilter || currentSearch != 'simple' || !exactPhrase || showDeletedOnly || dateFilterActive}
                <button type="button" class="clear_button" on:click={clearFilters}>Clear filters</button>
            {/if}
        </div>
        <div class="form search_row">
            <label class="input_block search_input">
                <span>Search</span>
                <span class="search_box">
                    <input bind:value={tempFT} on:input={queueSearch} on:keydown={e => {if(e.key == 'Enter') commitSearch()}}/>
                    {#if tempFT || fullText}
                        <button type="button" class="search_clear" aria-label="Clear search" on:click={clearSearch}>×</button>
                    {/if}
                </span>
            </label>
            <label class="input_block">
                <span>Search type</span>
                <select bind:value={currentSearch}>
                    {#each Object.keys(searchTypes) as k}
                        <option value={k}>{searchTypes[k]}</option>
                    {/each}
                </select>
            </label>
            {#if currentSearch == 'simple'}
                <label class="check_block">
                    <input type="checkbox" bind:checked={exactPhrase} />
                    Exact phrase
                </label>
            {/if}
            
            <button type="button" on:click={commitSearch}>Search</button>
            {#if fullText}
                {#if searchError}
                    <span class="search_error">Advanced search could not parse "{fullText}". Try <code>mahler AND (parody OR irony)</code>.</span>
                {:else}
                    <button type="button" class="chip search action_chip" on:click={e => {exportSearch()}}>
                        {#if copiedToClipboard == `search ${fullText}`}
                            Search copied to clipboard
                        {:else}
                            Share this search
                        {/if}
                    </button>
                {/if}
            {/if}
        </div>
        <div class="form refine_row">
            {#if dateBounds.min && dateBounds.max}
                <div class="input_block year_range">
                    <span>Publication year</span>
                    <div class="range_shell" style={yearRangeStyle}>
                        <input aria-label="Publication year from" type="range" min={dateBounds.min} max={dateBounds.max} bind:value={dateStart} />
                        <input aria-label="Publication year to" type="range" min={dateBounds.min} max={dateBounds.max} bind:value={dateEnd} />
                    </div>
                    <div class="year_numbers">
                        <input aria-label="Publication year from" type="number" min={dateBounds.min} max={dateBounds.max} bind:value={dateStart} />
                        <span>to</span>
                        <input aria-label="Publication year to" type="number" min={dateBounds.min} max={dateBounds.max} bind:value={dateEnd} />
                    </div>
                </div>
            {/if}
            {#if $path == '/admin'}
                <label class="check_block">
                    <input type="checkbox" bind:checked={showDeletedOnly} />
                    Only deleted
                </label>
            {/if}
        </div>
        {#if currentSearch == 'advanced'}
            <details class="bib" open={!advancedRulesHidden}><summary>Advanced search rules (click to show/hide)</summary>
            <ol>
                <li>Any search terms not enclosed in quotation marks are assumed to be connected by the Boolean AND.</li>
                <li>Enclosing a phrase in "quotation marks" will search for that exact phrase (including spaces).</li>
                <li>Using NOT before a term will exclude results containing that term.</li>
                <li>Using OR between terms will include results that match either or both those term.</li>
                <li>You may combine AND, OR and NOT in a search: NOT has the highest priority, then AND, then OR.</li>
                <li>Parentheses can be used to change this priority: for example, <code>mahler AND parody OR irony</code> is equivalent to <code>(mahler AND parody) OR irony</code>, but in this case you probably want <code>mahler AND (parody OR irony)</code>.</li>
                <li>Searches ignore case and diacritics.</li>
                <li>You may use * at the beginning <b>or</b> end of a term to allow partial matches. For example Schub* would match Schubert, Schubertian, Schubertiade, etc.; *iana would match Schumanniana, Beethoveniana, Kreisleriana, etc.</li>
                <li>Preceding any term (or parenthesis) with 'author', 'works', 'annotation', etc. searches for that element <em>only</em> in the relevant place. So <code>irony works:(Mahler OR Schumann)</code> would search for 
                    records containing 'irony' which include either Mahler or Schumann in their works list.</li>
                <li>The syntax <code>record:X</code> selects a specific record by its internal reference number. This is used to make it easy to send links to a specific record.</li>
            </ol>
            </details>
            
        {/if}
    
	    <hr />
	    <div class="initials_list">
	        {#if $path == '/admin' && $params.logged_in}
                <button class="admin_add_entry" type="button" on:click={e => {$params.editRecord = 'new';}}>
                    <span class="admin_icon">{@html adminIcons.add}</span>
                    Add entry
                </button>
            {/if}
	        <div class="initials_label">Author</div>
	        <button type="button" class:selected={!nameFilter} on:click={e => {nameFilter = false;}}>All</button>
	        {#each getInitials(filteredData) as i}
	        <button type="button" class:selected={nameFilter == i.toLowerCase()} on:click={e => {if(nameFilter != i.toLowerCase()) nameFilter = i.toLowerCase(); else nameFilter = false;}}>{i}</button>
	        {/each}
	    </div>
	</details>

	<div class="main_list">
	<svelte:boundary>
    {#if dataByName.length}
    {#each paginatedData as d}
		        <details class="bib" open={specificRecord == d.record || $params.printing}><summary>
		            <span class="citation_text" bind:this={sourceElements[d.record]}>{#if d.author}<span class="author">{@html highlightMatch(d.author, 'author')}{#if !d.author.endsWith('.')}.{/if} </span>{/if}
		                {@html highlightMatch(d.citation, 'citation')}
		            </span>
	            <span class="record_badges">
	                {#each possibleAtts as a}
	                    {#if d[a] && !$params.printing}<span class="chip {a}">{a}</span>{/if}
	                {/each}
	            </span>
	         {#if $path == '/admin' && $params.logged_in}
                <span class="admin_actions">
                    <button class="admin_action edit" type="button" on:click={e => {$params.editItem(d)}}>
                        <span class="admin_icon">{@html adminIcons.edit}</span>
                        Edit
                    </button>
                    <button class="admin_action delete" type="button" on:click={e => {$params.deleteItem(d)}}>
                        <span class="admin_icon">{@html adminIcons.delete}</span>
                        Delete
                    </button>
                </span>
            {/if}
        </summary>
            
            <!--{#if d.annotation}
                {highlightMatch(d.annotation) || ''}
            {/if}-->
	            {#each possibleAtts as a}
	                {#if d[a]}
	                    <section class="record_section">
	                        <!--<strong>{upperInitial(a)}:</strong> -->
	                        <div class="chip {a} chip_details">{upperInitial(a)}</div>
	                        {#if Array.isArray(d[a])}
	                            <div>{@html highlightMatch(d[a].join('; '), a)}</div>
	                        {:else}
	                            <div>{@html highlightMatch(d[a], a)}</div>
	                        {/if}
	                    </section>
	                {/if}
	            {/each}
	            <div class="record_actions" style={$params.printing ? "display: none;" : ""}>
	                <button type="button" class="chip record action_chip" on:click={e => {exportLink(d.record)}}>
	                    {#if copiedToClipboard == d.record}
	                        Link copied to clipboard
	                    {:else}
	                        Copy link
	                    {/if}
	                </button>
	                <button type="button" class="chip link action_chip" on:click={e => {exportCitation(d)}}>
	                    {#if copiedToClipboard == `${d.record} citation`}
	                        Citation copied to clipboard
	                    {:else}
	                        Copy citation
	                    {/if}
	                </button>
	                <button type="button" class="chip scholar action_chip" on:click={e => {scholarSearch(d)}}>
	                    Google Scholar
	                </button>
	            </div>
		        </details>
	    {/each}
    {:else if !$localDataLoaded}
        <div class="empty_state">
            <h2>Loading bibliography</h2>
            <p>The offline records are loading from the local app bundle.</p>
        </div>
    {:else}
        <div class="empty_state">
            <h2>No matching records</h2>
            <p>Nothing matches the current combination of search text, filters, and author initial.</p>
            <button type="button" on:click={clearFilters}>Clear filters</button>
        </div>
    {/if}
    {#snippet failed(error, reset)}
        <div class="empty_state">
            <h2>Something went wrong displaying these records</h2>
            <p>{error?.message || error}</p>
            <button type="button" on:click={reset}>Try again</button>
        </div>
    {/snippet}
    </svelte:boundary>
</div>
{#if pageSize < dataByName.length}
    <hr />
    <div class="pagination_shell">
        <div class="page_summary">{pageSummary}</div>
        <LightPaginationNav
            totalItems="{dataByName.length}"
            pageSize="{pageSize}"
            currentPage="{currentPage}"
            limit="{1}"
            showStepOptions="{true}"
            on:setPage="{(e) => currentPage = e.detail.page}"
        />
    </div>
	{/if}
{/if}
	<style>
    .index_page,
    .record_detail {
        width: 100%;
        padding: 0.4rem 0 1rem;
    }

    .index_header {
        position: sticky;
        top: 0;
        z-index: 18;
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 1rem;
        margin: 0.4rem 0 0.8rem;
        padding-bottom: 0.6rem;
        border-bottom: 1px solid #ded2c0;
        background: rgba(251, 248, 242, 0.94);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    .index_header h2 {
        margin: 0;
    }

    .index_switch {
        display: flex;
        gap: 0.35rem;
        margin-top: 0.35rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.82rem;
        font-weight: 700;
    }

    .index_switch a {
        border: 1px solid #d8c8b2;
        border-radius: 999px;
        padding: 0.14rem 0.48rem;
        text-decoration: none;
    }

    .index_switch a.selected {
        background: #6c3526;
        color: #fffaf1;
    }

    .index_tools {
        display: flex;
        align-items: end;
        justify-content: flex-end;
        gap: 0.5rem;
    }

    .index_search,
    .index_sort {
        display: flex;
        flex-direction: column;
        gap: 0.2rem;
        color: #5c5146;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.76rem;
        font-weight: 700;
    }

    .index_search {
        min-width: min(20rem, 45vw);
    }

    .index_sort {
        min-width: 8.8rem;
    }

    .index_grid {
        column-width: 18rem;
        column-gap: 1.2rem;
    }

    .index_item {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 0.75rem;
        break-inside: avoid;
        padding: 0.22rem 0;
        border-bottom: 1px solid #eadfce;
        color: #2f2a25;
    }

    .index_link {
        min-width: 0;
        color: inherit;
        cursor: pointer;
        text-decoration: none;
    }

    .index_link:hover {
        color: #6c3526;
    }

    .index_preview_button {
        position: relative;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.22rem;
        min-width: 2rem;
        min-height: 1.45rem;
        border: 1px solid #d8c8b2;
        border-radius: 999px;
        background: #fffdf8;
        color: #6f6357;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        line-height: 1;
        padding: 0.12rem 0.4rem;
    }

    .index_preview_button:hover {
        background: #efe3d3;
        color: #4b2519;
    }

    .preview_icon {
        display: inline-flex;
        width: 0.85rem;
        height: 0.85rem;
        opacity: 0.72;
    }

    .preview_icon :global(svg) {
        width: 0.85rem;
        height: 0.85rem;
        fill: currentColor;
    }

    .preview_hint {
        position: absolute;
        right: calc(100% + 0.4rem);
        top: 50%;
        z-index: 3;
        width: max-content;
        max-width: 9rem;
        border: 1px solid #d8c8b2;
        border-radius: 6px;
        background: #fffdf8;
        color: #4b2519;
        font-size: 0.72rem;
        font-weight: 800;
        line-height: 1.1;
        padding: 0.28rem 0.42rem;
        box-shadow: 0 6px 16px rgba(47, 42, 37, 0.12);
        opacity: 0;
        pointer-events: none;
        transform: translate(0.25rem, -50%);
        transition: opacity 140ms ease, transform 140ms ease;
    }

    .index_preview_button:hover .preview_hint,
    .index_preview_button:focus-visible .preview_hint {
        opacity: 1;
        transform: translate(0, -50%);
    }

    .work_index {
        border-top: 1px solid #ded2c0;
    }

    .creator_group {
        border-bottom: 1px solid #ded2c0;
        padding: 0.28rem 0;
    }

    .creator_group > summary {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
        cursor: pointer;
        list-style: none;
        color: #4b2519;
        font-weight: 700;
    }

    .creator_group > summary::-webkit-details-marker {
        display: none;
    }

    .creator_group > summary span:last-child {
        flex: 0 0 auto;
        color: #6f6357;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.72rem;
    }

    .creator_works {
        margin: 0.25rem 0 0.3rem 1rem;
    }

    .work_item {
        padding: 0.16rem 0;
    }

    .detail_actions {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
        margin: 0.4rem 0 0.75rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.86rem;
        font-weight: 700;
    }

    .detail_record {
        border-top: 1px solid #ded2c0;
        padding-top: 0.7rem;
    }

    .detail_record h2 {
        margin: 0 0 0.8rem;
        color: #2f2a25;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 1.05rem;
        line-height: 1.45;
        padding-left: 1.2rem;
        text-indent: -1.2rem;
    }

    .preview_scrim {
        position: fixed;
        inset: 0;
        z-index: 90;
        display: grid;
        place-items: center;
        padding: 1.2rem;
        background: rgba(47, 42, 37, 0.28);
    }

    .record_preview {
        width: min(880px, 92vw);
        max-height: min(760px, 86vh);
        display: flex;
        flex-direction: column;
        border: 1px solid #d8c8b2;
        border-radius: 8px;
        background: #fffdf8;
        box-shadow: 0 20px 60px rgba(47, 42, 37, 0.22);
    }

    .preview_header {
        display: flex;
        align-items: start;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.78rem 0.85rem 0.72rem 0.95rem;
        border-bottom: 1px solid #eadfce;
    }

    .preview_header h2,
    .preview_header p {
        margin: 0;
    }

    .preview_header h2 {
        font-size: 1rem;
        line-height: 1.3;
    }

    .preview_header p {
        color: #6f6357;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
    }

    .preview_close {
        flex: 0 0 auto;
        display: inline-grid;
        place-items: center;
        width: 1.8rem;
        height: 1.8rem;
        border: 1px solid #d8c8b2;
        border-radius: 6px;
        background: transparent;
        color: #6f6357;
        padding: 0;
    }

    .preview_close:hover {
        background: #f3e5d2;
        color: #4b2519;
    }

    .preview_close :global(svg) {
        width: 1rem;
        height: 1rem;
        fill: currentColor;
    }

    .preview_records {
        overflow-y: auto;
        padding: 0.25rem 0.9rem 0.9rem;
    }

    .preview_record {
        border-bottom: 1px solid #eadfce;
        padding: 0.55rem 0;
    }

    .preview_record > summary {
        cursor: pointer;
        line-height: 1.42;
        padding-left: 1.2rem;
        text-indent: -1.2rem;
    }

	    .main_list {
	        width: 100%;
	        flex-grow: 1;
        overflow-y: auto;
        padding: 0 0 0.75rem;
    }

    .filters {
        width: 100%;
        margin: 0.35rem 0 0.5rem;
        padding: 0.45rem 0;
        border: 0;
        border-bottom: 1px solid #ded2c0;
        border-radius: 0;
        background: rgba(247, 242, 232, 0.92);
        box-shadow: none;
        position: sticky;
        top: 0;
        z-index: 20;
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
    }

    .filters > summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 0.7rem;
        cursor: pointer;
        color: #4b2519;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.78rem;
        font-weight: 700;
        margin-bottom: 0.35rem;
        text-transform: uppercase;
    }

    .filters > summary::-webkit-details-marker {
        display: none;
    }

    .summary_label {
        display: inline-flex;
        align-items: center;
        gap: 0.36rem;
        min-width: max-content;
    }

    .summary_chevron {
        display: inline-grid;
        place-items: center;
        width: 1.25rem;
        height: 1.25rem;
        border: 1px solid #d8c8b2;
        border-radius: 999px;
        color: #6c3526;
        font-size: 1rem;
        line-height: 0;
        padding-bottom: 0.08rem;
        transform: rotate(90deg);
        transition: transform 160ms ease, background-color 160ms ease;
    }

    .filters:not([open]) .summary_chevron {
        transform: rotate(0deg);
    }

    .filters > summary:hover .summary_chevron {
        background: #f3e5d2;
    }

    .summary_tools {
        display: inline-flex;
        align-items: center;
        justify-content: flex-end;
        gap: 0.55rem;
        color: #6f6357;
        text-transform: none;
        cursor: default;
    }

    .clear_button {
        flex: 0 0 auto;
        background: #fff8ee;
        color: #6c3526;
        border-color: #d9c5ad;
        min-height: 1.95rem;
        align-self: end;
        padding: 0.25rem 0.55rem;
    }

    .clear_button:hover {
        background: #f3e5d2;
    }

    .form {
        width: 100%;
        margin-bottom: 0.35rem;
    }

    .controls,
    .search_row,
    .refine_row {
        display: flex;
        flex-wrap: wrap;
        gap: 0.42rem;
        align-items: end;
    }

    .check_block {
        display: inline-flex;
        align-items: center;
        gap: 0.35rem;
        min-height: 1.95rem;
        color: #5c5146;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.76rem;
        font-weight: 700;
    }

    .check_block input {
        margin: 0;
    }
    
    .input_block {
        display: inline-flex;
        flex-direction: column;
        gap: 0.2rem;
        min-width: 8.5rem;
        color: #5c5146;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
    }

    .input_block select,
    .input_block input {
        min-height: 1.95rem;
        padding-top: 0.22rem;
        padding-bottom: 0.22rem;
    }

    .input_block.compact {
        min-width: 6.5rem;
    }

    .year_range {
        min-width: min(22rem, 100%);
    }

    .range_shell {
        position: relative;
        height: 1.95rem;
        display: flex;
        align-items: center;
    }

    .range_shell::before,
    .range_shell::after {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        height: 0.28rem;
        border-radius: 999px;
        pointer-events: none;
    }

    .range_shell::before {
        background: #e7d9c8;
    }

    .range_shell::after {
        left: var(--start);
        right: calc(100% - var(--end));
        background: #8b3f2a;
    }

    .range_shell input[type="range"] {
        position: absolute;
        inset: 0;
        width: 100%;
        margin: 0;
        background: transparent;
        pointer-events: none;
        appearance: none;
        -webkit-appearance: none;
    }

    .range_shell input[type="range"]::-webkit-slider-runnable-track {
        height: 0.28rem;
        background: transparent;
    }

    .range_shell input[type="range"]::-moz-range-track {
        height: 0.28rem;
        background: transparent;
    }

    .range_shell input[type="range"]::-webkit-slider-thumb {
        width: 1rem;
        height: 1rem;
        border: 2px solid #6c3526;
        border-radius: 999px;
        background: #fffdf8;
        box-shadow: 0 1px 4px rgba(47, 42, 37, 0.18);
        pointer-events: auto;
        appearance: none;
        -webkit-appearance: none;
        transform: translateY(-0.36rem);
    }

    .range_shell input[type="range"]::-moz-range-thumb {
        width: 0.85rem;
        height: 0.85rem;
        border: 2px solid #6c3526;
        border-radius: 999px;
        background: #fffdf8;
        box-shadow: 0 1px 4px rgba(47, 42, 37, 0.18);
        pointer-events: auto;
    }

    .year_numbers {
        display: flex;
        align-items: center;
        gap: 0.35rem;
    }

    .year_numbers input {
        width: 5.2rem;
    }

    .year_numbers span {
        color: #6f6357;
        font-size: 0.72rem;
    }

    .search_input {
        flex: 1 1 18rem;
    }

    .search_box {
        position: relative;
        display: flex;
        align-items: center;
    }

    .search_box input {
        width: 100%;
        padding-right: 2.2rem;
    }

    .search_clear {
        position: absolute;
        right: 0.25rem;
        width: 1.35rem;
        height: 1.35rem;
        min-height: 0;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: #eadfce;
        color: #6c3526;
        line-height: 1;
    }

    .search_clear:hover {
        background: #ddcdb8;
    }

    .search_error {
        color: #8c261d;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.9rem;
        font-weight: 700;
        max-width: 34rem;
    }

    .search_error code {
        color: #62261e;
        background: #f2e4d6;
        border-radius: 4px;
        padding: 0.05rem 0.22rem;
    }
    
    .chip {
        display: inline-flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: center;
        width: fit-content;
        border: 1px solid transparent;
        border-radius: 999px;
        padding: 0.12rem 0.42rem;
        color: #40372f;
        background-color: #eee3d1;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.66rem;
        font-weight: 700;
        line-height: 1.2;
        text-transform: capitalize;
    }

    .chip_details {
        margin-bottom: 0.28rem;
        align-self: flex-start;
        text-transform: none;
    }

    .annotation {
        background-color: #dcead8;
        border-color: #b7d0b1;
        color: #294a2a;
    }

    .contributors {
        background-color: #dce8ee;
        border-color: #b4c9d4;
        color: #27475a;
    }

    .works {
        background-color: #eadcdb;
        border-color: #d3b7b3;
        color: #673329;
    }

    .sources {
        background-color: #eadfcf;
        border-color: #d4bea2;
        color: #5e4024;
    }

    .record {
        background-color: #efe6d8;
        border-color: #d7c7b4;
        color: #3f352d;
    }

    .link {
        background-color: #e4deef;
        border-color: #c9bfe0;
        color: #443166;
    }

    .scholar,
    .search {
        background-color: #dce8ee;
        border-color: #b9cdd7;
        color: #263f50;
    }

    .action_chip {
        min-height: 1.75rem;
        cursor: pointer;
        text-transform: none;
        background: transparent;
        border-color: #d4c8b8;
        padding: 0.22rem 0.5rem;
    }

    .action_chip:hover {
        background: #f5ecdf;
        filter: none;
    }

    details.bib {
        border: 0;
        border-top: 1px solid #ded2c0;
        border-radius: 0;
        padding: 0;
        margin: 0;
        background-color: transparent;
        box-shadow: none;
        overflow: visible;
    }

    details[open].bib {
        padding: 0 0 0.7rem;
    }

    details[open].bib summary {
        border-bottom: 0;
        margin-bottom: 0.35rem;
        background: transparent;
    }

    details.bib > summary {
        cursor: pointer;
        list-style: none;
        padding: 0.62rem 0.2rem 0.55rem;
        background-color: transparent;
    }

    details.bib > summary::-webkit-details-marker {
        display: none;
    }

    .citation_text {
        display: block;
        color: #2f2a25;
        padding-left: 1.2rem;
        text-indent: -1.2rem;
        line-height: 1.46;
    }

    .record_badges {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.28rem;
        margin-top: 0.32rem;
        margin-left: 1.2rem;
    }

    .admin_actions {
        display: inline-flex;
        flex-wrap: wrap;
        gap: 0.3rem;
        margin: 0.32rem 0 0 1.2rem;
    }

    .admin_action {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
        min-height: 1.65rem;
        border: 1px solid #d8c8b2;
        border-radius: 999px;
        background: #fffdf8;
        color: #574b40;
        padding: 0.12rem 0.52rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.72rem;
        font-weight: 800;
    }

    .admin_icon {
        width: 0.88rem;
        height: 0.88rem;
    }

    .admin_icon {
        display: inline-flex;
    }

    .admin_icon :global(svg) {
        width: 0.88rem;
        height: 0.88rem;
        fill: currentColor;
    }

    .admin_action.edit {
        color: #27475a;
    }

    .admin_action.delete {
        color: #8c261d;
    }

    .admin_action:hover {
        background: #f5ecdf;
    }

    .record_section {
        display: grid;
        grid-template-columns: 7.2rem minmax(0, 1fr);
        gap: 0.65rem;
        margin: 0 0 0.55rem 1.2rem;
        padding-left: 0.7rem;
        border-left: 2px solid #eadfce;
    }

    .record_section > div:last-child {
        color: #3d3730;
        min-width: 0;
    }

    .record_actions {
        display: flex;
        flex-wrap: wrap;
        gap: 0.4rem;
        margin: 0.15rem 0 0 1.9rem;
    }

    .empty_state {
        max-width: 36rem;
        margin: 2rem auto;
        padding: 1.4rem;
        text-align: center;
        border-top: 1px solid #ddcfbd;
        border-bottom: 1px solid #ddcfbd;
        border-radius: 0;
        background: transparent;
        box-shadow: none;
    }

    .empty_state h2 {
        margin: 0 0 0.3rem;
    }

    .empty_state p {
        margin: 0 0 1rem;
        color: #6f6357;
    }

    .pagination_shell {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 0.55rem;
        color: #6f6357;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.8rem;
    }

    .pagination_shell {
        justify-content: center;
        margin: 0.85rem 0;
    }

    .page_summary {
        font-weight: 700;
        min-width: 12.5rem;
        text-align: right;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
    }

    .compact_pager {
        display: inline-flex;
        align-items: center;
        gap: 0.3rem;
        color: #5f554b;
        font-size: 0.78rem;
        font-weight: 700;
        text-transform: none;
    }

    .compact_pager label {
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }

    .compact_pager button,
    .compact_pager select {
        min-height: 1.65rem;
        border-color: #d8c8b2;
        background: #fffdf8;
        color: #574b40;
    }

    .compact_pager button {
        min-width: 1.65rem;
        padding: 0;
        line-height: 1;
    }

    .compact_pager select {
        padding: 0.05rem 0.32rem;
    }

    @media print {
        .index_header,
        .detail_actions {
            display: none !important;
        }

        .main_list {
            overflow: visible;
            padding: 0;
        }

        details.bib,
        details[open].bib,
        details[open].bib summary,
        details.bib > summary {
            border: 0;
            background: transparent;
            box-shadow: none;
        }

        details.bib {
            border-top: 1px solid #000;
            break-inside: auto;
            page-break-inside: auto;
        }

        details.bib:first-child {
            border-top: 0;
        }

        details.bib > summary {
            padding: 0.35rem 0 0.2rem;
        }

        .citation_text {
            padding-left: 0.25in;
            text-indent: -0.25in;
            line-height: 1.25;
            overflow-wrap: anywhere;
            word-break: normal;
        }

        .record_section {
            display: block;
            margin: 0 0 0.35rem 0.25in;
            padding-left: 0;
            border-left: 0;
            break-inside: auto;
            overflow-wrap: anywhere;
            word-break: normal;
        }

        .chip,
        .chip_details {
            display: block;
            border: 0;
            padding: 0;
            margin: 0 0 0.04rem;
            font-family: inherit;
            font-size: 1em;
            font-weight: bold;
            text-transform: none;
        }

        .record_badges,
        .record_actions {
            display: none;
        }

        .author {
            font-weight: bold;
        }

        :global(mark),
        :global(span[style*="background-color"]) {
            background: transparent !important;
        }
    }

    .initials_list {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 0.25rem;
        padding-top: 0.1rem;
    }

    .initials_label {
        color: #6a5f53;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.72rem;
        font-weight: 700;
        margin-right: 0.2rem;
    }

    .initials_list button {
        min-width: 1.65rem;
        min-height: 1.65rem;
        border-color: #d8c8b2;
        background: #fffdf8;
        color: #574b40;
        padding: 0.1rem 0.34rem;
        font-size: 0.8rem;
    }

    .initials_list button.selected {
        background: #6c3526;
        border-color: #6c3526;
        color: #fffaf1;
        font-weight: 700;
    }

    .initials_list .admin_add_entry {
        display: inline-flex;
        align-items: center;
        gap: 0.28rem;
        min-width: auto;
        border-color: #8b3f2a;
        background: #6c3526;
        color: #fffaf1;
        padding: 0.1rem 0.6rem;
        font-weight: 800;
    }

    .initials_list .admin_add_entry:hover {
        background: #7a2d22;
    }

    .selected {
        font-weight: bold;
        color: #6c3526;
    }

    hr {
        width: 100%;
        border: 0;
        border-top: 1px solid #e3d6c6;
    }

    .author {
        color: #4b2519;
        font-weight: bold;
    }

    @media (max-width: 720px) {
        .filters {
            padding: 0.65rem;
            max-height: 75vh;
            overflow-y: auto;
        }

        .input_block,
        .input_block.compact {
            flex: 1 1 100%;
            min-width: 0;
        }

        .clear_button {
            width: 100%;
        }

        .initials_list {
            justify-content: flex-start;
            flex-wrap: nowrap;
            overflow-x: auto;
            padding-bottom: 0.35rem;
        }

        .initials_label {
            position: sticky;
            left: 0;
            background: rgba(255, 252, 245, 0.95);
            padding-right: 0.35rem;
        }

        .record_section {
            display: block;
        }

        .chip_details {
            margin-bottom: 0.4rem;
        }

        .record_actions .action_chip {
            flex: 1 1 auto;
        }

        .filters > summary {
            align-items: flex-start;
            flex-direction: column;
        }

        .summary_tools {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.35rem;
        }

        .index_header {
            align-items: stretch;
            flex-direction: column;
        }

        .index_tools {
            align-items: stretch;
            flex-direction: column;
        }

        .index_sort,
        .index_search {
            min-width: 0;
        }

        .index_grid {
            column-width: auto;
        }

        .creator_group > summary {
            align-items: flex-start;
            flex-direction: column;
            gap: 0.15rem;
        }

        .creator_works {
            margin-left: 0.5rem;
        }
    }
</style>
