<script>

    import mammoth from "mammoth"
    import {data } from '$lib/data.js';
    import { paginate, LightPaginationNav } from 'svelte-paginate'
    import { parse } from '$lib/boolean.js';
    import { onMount } from "svelte";

    let tags = ['General','Monophony to 1300','Polyphony to 1300','1300s','1400s','1500s','1600s','1700s','1800s','1900s','2000s','Jazz','Popular','Film']

    let result = '';

    let currentTag = false;
    let currentContributor = false;
    let fullText = '';

    //let tags = Array.from(new Set(data.filter(d => d.tags).flatMap(d => d.tags)));
    let contributors = Array.from(new Set(data.filter(d => d.tags).flatMap(d => d.contributors)));

    function getDate(c){
        let d = c.match(/(\d\d\d\d)\)/);
        if(d && d[1]) return d[1];
        return -1;
    }

    function allText(d){
        let text = '';
        for(let a of ['citation', ...possibleAtts]){
            if(d[a]) text += `${joinPossArray(d[a])} `;
        }
        return text.trim();
    }

    function baseForm(s){
        return s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase()
    }

    function filterByOptions(d, t, c, ft){
        if(t && d.tags && !d.tags.includes(t)) return false;
        if(c && (!d.contributors || !d.contributors.includes(c))) return false;
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
        let record = d.record;
        if(currentSearch == 'simple') return baseForm(allText(d)).includes(baseForm(fullText));
        if(currentSearch != 'advanced'){
            return baseForm(joinPossArray(d[currentSearch]) || '').includes(baseForm(fullText))
        }
        d = baseForm(allText(d)); // Get it all together
        
        try{
            let t = parse(fullText);
            // If it works, work through tree
            return orMatches(t, {record, item: d});
        }catch(e){
            console.log('Error searching:', e);
            // Fall back to full text search
            return baseForm(allText(d)).includes(baseForm(fullText));
        }

    }

    function orMatches(t, {record, item}){
        if(t.record){
            // Only this record
            return record == t.record;
        }
        if(t.any_of){
            return t.any_of.some(e => andMatches(e, item));
        }/*else if(Array.isArray(t)){
            return andMatches(t, d);
        }*/else{
            console.log('malformed syntax!', t);
            //alert('malformed syntax!');
            return false;
        }
    }

    function andMatches(t, d){
        let failed = false;
        for(let e of t){
            if(!notMatches(e, d)) failed = true;
        }
        return !failed;
    }

    function notMatches(t, d){
        if(t.not){
            return !starMatches(t.not, d);
        }else{
            if(t.term) bitsToHighlight.push(t.term);
            return starMatches(t, d);
        }
    }

    function starMatches(t, d){
        if(t.any_of){
            // nested OR statement
            return t.any_of.some(e => andMatches(e, d));
        }
        let re = baseForm(t.term).replaceAll(/\s+/g, ' ');

        if(!t.blurStart) re = `\\b${re}`;
        if(!t.blurEnd) re = `${re}\\b`;
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
            bitsToHighlight = [fullText];
        }
        let text = origText;
        console.log(bitsToHighlight)
        for(let bit of bitsToHighlight){
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
        }
        return text;
        //return t.replace(re, (match, offset, string) => `<span style="background-color: yellow;">${origText.slice(offset, offset + match.length)}</span>`);
    }

    let filteredData;
    let tempFT;
    let currentSort;
    let currentSearch = 'simple';
    let searchTypes = {
        'simple': 'Simple (phrase in full text)',
        'advanced': 'Advanced...',
        'citation': 'Citation only',
        'annotation': 'Annotation only',
        'sources': 'Sources list only',
        'works': 'Works list only'
    }

    let pageSizes = [10, 25, 50, 100, -1]

    let sortByAuthor = (a,b) => a.citation.localeCompare(b.citation);
    let sortByDate = (a,b) => getDate(a.citation) - getDate(b.citation);

    function filterData(){
        filteredData = data.filter(d => filterByOptions(d, currentTag, currentContributor, fullText)).sort(sortByAuthor);
        currentPage = 1;
        //if(navigator && navigator.clipboard) navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    }

    function filterByName(){
        dataByName = filteredData.filter(d => nameStartsWith(d, nameFilter));
        currentPage = 1;
    }

    $: filterData(filteredData, data, currentTag, currentContributor, fullText, currentSort, currentSearch)
    let paginatedData = [];
    let currentPage = 1;
    let pageSize = 50;
    let dataByName = [];
    $: filterByName(dataByName, filteredData, nameFilter)
    $: paginatedData = paginate({ items: dataByName, pageSize, currentPage })

    function nameStartsWith(d, n){
        if(!n) return true;
        let norm = baseForm(d.citation);
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
            let n = baseForm(d.citation)[0].toUpperCase();
            if(!i.includes(n)){
                i.push(n)
            }
        }
        return i.sort((a,b) => a.localeCompare(b));
    }

    function getLastName(t){
        return t.split(' ').slice(-1)[0];
    }

    function sortByLastName(a,b){
        return getLastName(a).localeCompare(getLastName(b));
    }
    
    let nameFilter = false;

    let copiedToClipboard = false;

    async function exportLink(r){
        let toCopy = `${window.location.href.split('?')[0]}?record=${r}`;
        await navigator.clipboard.writeText(toCopy);
        copiedToClipboard = r;
    }

    async function exportSearch(){
        let p = new URLSearchParams();
        p.set('searchType', currentSearch);
        p.set('search', fullText);
        let toCopy = `${window.location.split('?')[0]}?${p.toString()}`;
        await navigator.clipboard.writeText(toCopy);
    }

    onMount(() => {
        let params = new URLSearchParams(window.location.search);

        if(params.has('record')){
            currentSearch = 'advanced';
            fullText = `record:${params.get('record')}`;
            tempFT = fullText;
            specificRecord = params.get('record');
        }
        if(params.has('search')){
            fullText = params.get('search');
            tempFT = fullText;
        }
        if(params.has('searchType')){
            currentSearch = params.get('searchType')
        }
    });

    let specificRecord = false;

</script>
<svelte:head>
    <title>Musical Borrowing & Reworking: an annotated bibliography</title>
</svelte:head>
    <h1>Musical Borrowing and Reworking: an annotated bibliography</h1>
        <div class="attribution">
            <div>
                Data from the <a href="https://web.archive.org/web/20250507173203/https://chmtl.indiana.edu/borrowing/">CHTML Musical Borrowing & Reworking project</a>. 
            </div>
            <div>
                Subject to a <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>
            </div>
        </div>
        <details open>
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
                        {#each contributors.sort(sortByLastName) as c}
                            <option value={c}>{c}</option>
                        {/each}
                    </select>
                </div>
                <div class="input_block">
                    Show 
                    <select bind:value={pageSize}>
                        {#each pageSizes as s}
                            {#if s == -1}
                                <option value={data.length}>all</option>
                            {:else}
                                <option value={s}>{s}</option>
                            {/if}
                        {/each}
                    </select>
                    
                    results per page
                    
                </div>
                <div class="input_block">
                    ({dataByName.length} items found of {data.length} in database)
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
            </div>
            {#if currentSearch == 'advanced'}
                <details class="bib" open={!specificRecord}><summary>Advanced search rules</summary>
                <ol>
                    <li>Any search terms not enclosed in quotation marks are assumed to be connected by the Boolean AND.</li>
                    <li>Enclosing a phrase in "quotation marks" will search for that exact phrase (including spaces).</li>
                    <li>Using NOT before a term will exclude results containing that term.</li>
                    <li>Using OR between terms will include results that match either or both those term.</li>
                    <li>You may combine AND, OR and NOT in a search: NOT has the highest priority, then AND, then OR.</li>
                    <li>Parentheses can be used to change this priority: for example, <code>mahler AND parody OR irony</code> is equivalent to <code>(mahler AND parody) OR irony</code>, but in this case you probably want <code>mahler AND (parody OR irony)</code>.</li>
                    <li>Searches ignore case and diacritics.</li>
                    <li>You may use * at the beginning <b>or</b> end of a term to allow partial matches. For example Schub* would match Schubert, Schubertian, Schubertiade, etc.; *iana would match Schumanniana, Beethoveniana, Kreisleriana, etc.</li>
                    <li>The syntax record:X selects a specific record by its internal reference number. This is used to make it easy to send links to a specific record.</li>
                </ol>
                </details>
            {/if}
            <hr />
            <div class="initials_list">
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
                <details class="bib" open={specificRecord == d.record} on:click={e => {console.log(d)}}><summary>
                    {@html highlightMatch(d.citation, 'citation')}
                <!--<div class="chips">--> 
                        {#each possibleAtts as a}
                            {#if d[a]}<div class="chip {a}">{a}</div>{/if}
                        {/each}
                <!-- </div>--> 
                </summary>
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
                    <div style="margin-bottom: 1em;">
                        <div class="chip record chip_details" style="cursor: pointer;" on:click={e => {exportLink(d.record)}}>
                            {#if copiedToClipboard == d.record}
                                Link copied to clipboard
                            {:else}
                                Click to copy link to this record
                            {/if}
                        </div>
                        <!--{#if copiedToClipboard == d.record}
                        <
                        {/if}-->
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
        <div class="version">
            v0.11 (9 Oct 2025)
        </div>
<style>

    h1 {
        font-size: 1.7em;
        font-family: sans-serif;
    }
    

    .version {
        position: absolute;
        bottom: 5px;
        left: 5px;
        font-size: 0.6em;
        font-style: italic;
        visibility: hidden;
    }

    .attribution {
        /*position: absolute;
        bottom: 5px;
        left: 5px;*/
        font-size: 0.8em;
        margin-bottom: 1em;
    }

    :global(body) {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        height: calc(100vh - 16px);
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
        font-weight: bold;
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
    }
</style>

