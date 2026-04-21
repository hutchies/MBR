<script>
    // @ts-nocheck

    //import { data } from '$lib/data.js';
    import { paginate, LightPaginationNav } from 'svelte-paginate'
    import { parse } from './boolean.js';
    import { onMount } from "svelte";
    import { pb } from "./pb.js";
    import { tags, data, contributors, params} from './shared.svelte.js';
    import { path, resolve, match, params as elegua_params} from 'elegua';

    let result = '';

    let currentTag = false;
    let currentContributor = false;
    let fullText = '';

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
    
    function dumbQuotes(s){
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
        if(currentSearch == 'simple') return baseForm(allText(d)).includes(baseForm(fullText));
        if(currentSearch == 'citation'){
            return baseForm(`${d.author}. ${d.citation}`).includes(baseForm(fullText))
        }
        if(currentSearch != 'advanced'){
            return baseForm(joinPossArray(d[currentSearch]) || '').includes(baseForm(fullText))
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
        let re = baseForm(t.term).replaceAll(/\s+/g, ' ');
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
            bitsToHighlight = [{term: fullText}];
        }
        let text = origText;
        //le.log(bitsToHighlight)

        let bits = bitsToHighlight.filter(b => !b.filter || b.filter == where || (where == 'author' && b.filter == 'citation'))
        if(bits.length == 0) return origText;
        let bit = bits.map(b => `(${b.term})`).join('|');
        let t = baseForm(text);
        let re = new RegExp(baseForm(bit), 'ig')
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

    let sortByAuthor = (a,b) => a.author.localeCompare(b.author);
    let sortByDate = (a,b) => getDate(a.citation) - getDate(b.citation);
    let sortByDateReversed = (a,b) => getDate(b.citation) - getDate(a.citation);

    let filteredData;
    let tempFT;
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

    

    function filterData(fd, d, ct, cc, ft, cs, css){
        //console.log('filtering data', $data);
        filteredData = $data.filter(d => filterByOptions(d, currentTag, currentContributor, fullText)).sort(currentSort);
        currentPage = 1;
        //if(navigator && navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }

    function filterByName(dbn, fd, nf){
        //console.log('filtering by name', filteredData);
        dataByName = filteredData.filter(d => nameStartsWith(d, nameFilter));
        currentPage = 1;
    }

    $: filterData(filteredData, $data, currentTag, currentContributor, fullText, currentSort, currentSearch)
    let paginatedData = [];
    let currentPage = 1;
    let pageSize = 50;
    let dataByName = [];
    $: filterByName(dataByName, filteredData, nameFilter)
    $: paginatedData = paginate({ items: dataByName, pageSize, currentPage })

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

    function getInitials(data){
        let i = [];
        for(let d of data){
            let n = baseForm(d.author)[0].toUpperCase();
            if(!i.includes(n)){
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
        if(ClipboardItem.supports('text/html')){
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

    onMount(() => {
        //let p = new URLSearchParams(window.location.search);

        if(resolve($path, "/record/:id")){
            specificRecord = $elegua_params.id;
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
        if(up.has('searchType')){
            currentSearch = up.get('searchType')
        }
    });

    let specificRecord = '';

    function j(arr){
        if(!arr) return null;
        return {arr}
    }

    let sourceElements = {};

</script>

<details open class="filters">
    <summary>Filter/search records:</summary>
        <div class="form">
            <div class="input_block">
                Show results for tag: 
                <select bind:value={currentTag}>
                    <option value={false}>All tags</option>
                    {#each tags as t}
                        <option value={t}>{t}</option>
                    {/each}
                </select>
            </div>
            <div class="input_block">
                Show results for contributor: 
                <select bind:value={currentContributor}>
                        <option value={false}>All contributors</option>
                    {#each $contributors.sort(sortByLastName) as c}
                        <option value={c}>{c}</option>
                    {/each}
                </select>
            </div>
            <div class="input_block">
                Sort by:
                <select bind:value={currentSort}>
                    {#each Object.keys(sortTypes) as s}
                        <option value={sortTypes[s]}>{s}</option>
                    {/each}
                </select>
            </div>
            <div class="input_block">
                Show 
                <select bind:value={pageSize}>
                    {#each pageSizes as s}
                        {#if s == -1}
                            <option value={$data.length}>all</option>
                        {:else}
                            <option value={s}>{s}</option>
                        {/if}
                    {/each}
                </select>
                
                results per page
                
            </div>
            <div class="input_block">
                ({dataByName.length} items found of {$data.length} in database)
            </div>
        </div>
        <div class="form">
            <div class="input_block">
                Search records: 
                <input style="width: 20em;" bind:value={tempFT} on:change={e => {fullText = tempFT}}/>
            </div>
            <div class="input_block">
                Type of search:
                <select bind:value={currentSearch}>
                    {#each Object.keys(searchTypes) as k}
                        <option value={k}>{searchTypes[k]}</option>
                    {/each}
                </select>
            </div>
            
            <button on:click={e => {fullText = tempFT;}}>Search</button>
            {#if fullText}
                {#if searchError}
                    <span style="color: red;">Incorrect search syntax: check the rules for 'Advanced search'</span>
                {:else}
                    <div class="chip search chip_details" style="cursor: pointer; display: inline-flex;" on:click={e => {exportSearch()}}>
                        {#if copiedToClipboard == `search ${fullText}`}
                            Search copied to clipboard
                        {:else}
                            Share this search
                        {/if}
                    </div>
                {/if}
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
        {#if $params.admin && $params.logged_in}<button on:click={e => {$params.editRecord = 'new';}}>Add new entry</button>{/if}
        <div style="justify-self: flex-start;">Filter by author:</div>
        <div on:click={e => {nameFilter = false;}} class:selected={!nameFilter}>all</div>
        {#each getInitials(filteredData) as i}
        <div class:selected={nameFilter == i.toLowerCase()} on:click={e => {if(nameFilter != i.toLowerCase()) nameFilter = i.toLowerCase(); else nameFilter = false;}}>{i}</div>
        {/each}
    </div>
</details>


<hr />
<div class="main_list">
    {#each paginatedData as d}
        <details class="bib" open={specificRecord == d.record} on:click={e => {console.log(getDate(d.citation, true))}}><summary>
            <span bind:this={sourceElements[d.record]}><span class="author">{@html highlightMatch(d.author, 'author')}{#if !d.author.endsWith('.')}.{/if} </span>
                {@html highlightMatch(d.citation, 'citation')}
            </span>
            <!--<div class="chips">--> 
                {#each possibleAtts as a}
                    {#if d[a]}<div class="chip {a}">{a}</div>{/if}
                {/each}
        <!-- </div>--> 
        </summary>
            {#if $params.admin && $params.logged_in}
                <button style="font-size: 1.2em; margin-bottom: 0.2em;" on:click={e => {$params.editItem(d)}}>Edit item</button>
                <button style="font-size: 1.2em; margin-bottom: 0.2em;" on:click={e => {$params.deleteItem(d)}}>Delete item</button>
            {/if}
            <!--{#if d.annotation}
                {highlightMatch(d.annotation) || ''}
            {/if}-->
            {#each possibleAtts as a}
                {#if d[a]}
                    <div style="margin-bottom: 1em;">
                        <!--<strong>{upperInitial(a)}:</strong> -->
                        <div class="chip {a} chip_details">{upperInitial(a)}:</div>
                        {#if Array.isArray(d[a])}
                            <div>{@html highlightMatch(d[a].join('; '), a)}</div>
                        {:else}
                            <div>{@html highlightMatch(d[a], a)}</div>
                        {/if}
                    </div>
                {/if}
            {/each}
            <div style="margin-bottom: 1em; display: flex; gap: 1em;">
                <div class="chip record chip_details" style="cursor: pointer;" on:click={e => {exportLink(d.record)}}>
                    {#if copiedToClipboard == d.record}
                        Link copied to clipboard
                    {:else}
                        Click to copy link to this record
                    {/if}
                </div>
                <div class="chip link chip_details" style="cursor: pointer;" on:click={e => {exportCitation(d)}}>
                    {#if copiedToClipboard == `${d.record} citation`}
                        Citation copied to clipboard
                    {:else}
                        Click to copy citation to clipboard
                    {/if}
                </div>
                <div class="chip scholar chip_details" style="cursor: pointer;" on:click={e => {scholarSearch(d)}}>
                    Click to search for citation in Google Scholar
                </div>
            </div>
        </details>
    {/each}
</div>
{#if pageSize < filteredData.length}
    <hr />
    <div style="align-self: center;">
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
<style>

    .attribution {
        /*position: absolute;
        bottom: 5px;
        left: 5px;*/
        font-size: 0.8em;
        margin-bottom: 1em;
    }

    .main_list {
        flex-grow: 1;
        overflow-y: auto;
    }

    .chips {
        display: inline-flex;
        gap: 1em;
        align-items: center;
    }
    
    .input_block {
        display: inline-flex;
        gap: 0.5em;
        flex-wrap: nowrap;
        align-items: center;
    }
    
    .chip {
        display: inline-flex;
        flex-wrap: nowrap;
        align-items: center;
        justify-content: center;
        padding: 3px;
        color: white;
        background-color: black;
        font-family: sans-serif;
        font-size: 0.8em;
        border-radius: 5px;
        margin-left: 5px;
    }

    .chip_details {
        margin-bottom: 0.2em; 
        align-self: flex-start; 
        width: fit-content; 
        display: flex; 
        font-weight: bold; 
        margin-left: 0;
    }

    .annotation {
        background-color: green;
    }

    .contributors {
        background-color: blue;
    }

    .works {
        background-color: darkred;
    }

    .sources {
        background-color: sienna;
    }

    .link {
        background-color: purple;
    }

    .scholar {
        background-color: darkblue;
    }

    .search {
        background-color: green;
    }

    details.bib {
        border: 1px solid #aaaaaa;
        border-radius: 4px;
        padding: 0.5em 0.5em 0;
        margin: 0.2em;
        background-color: ivory;
    }

    details[open].bib {
        padding: 0.5em;
    }

    details[open].bib summary {
        border-bottom: 1px solid #aaaaaa;
        margin-bottom: 0.5em;
    }

    details.bib > summary {
        cursor: pointer;
        list-style: none;
        /*font-weight: bold;*/
        margin: -0.5em -0.5em 0;
        padding: 0.5em;
        background-color: white;
    }
    details.bib > summary::-webkit-details-marker {
        display: none;
    }

    .initials_list {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        align-items: center;
        gap: 1em;

    }
    .initials_list * {
        font-size: 1.2em;
        cursor: pointer;
    }

    .selected {
        font-weight: bold;
        color: darkred;
    }

    hr {
        width: 100%;
    }

    .form {
        margin-bottom: 0.5em;
        width: 100%;
    }

    .author {
        font-weight: bold;
    }

    .filters {
        background-color: ivory;
        padding: 0.2em 0 0.2em 0.2em;
        border: 1px solid black;
        border-radius: 0.5em;
        width: 100%;
    }
</style>