<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import BibDisplay from './lib/BibDisplay.svelte';
    //import { data as localData } from './lib/data.js';
    import { pb } from './lib/pb.js';
    import AdminView from './lib/AdminView.svelte';
    import { data, localDataReady, params } from './lib/shared.svelte.js';
    import { localDataLastUpdated } from './lib/data_meta.js';
    import { path, resolve } from 'elegua';
    import Home from './Home.svelte';
    import About from './About.svelte';
    import Ack from './Ack.svelte';

    //let data = localData;

    async function updateDB() {
        let promises = [];

        //const batch = pb.createBatch();


        let count = 0;
        for(let d of $data){
            try{
                let result = await pb.collection('borrowing').create({
                    ...d
                });
                count++;
                console.log(`Completed ${count} of ${$data.length}`);
            }catch(e){
                console.log(e);
            }
            
        }
        //console.log(batch);
       /* try{
            let result = await batch.send();
            alert('db updated');
        }catch(e){
            console.log('Error!', e)
        }*/
        
        
    }

	     async function loadData(){
        try{
            await localDataReady;
            // Deletions are soft, so they must come down too - otherwise a record
            // deleted after the bundled snapshot stays visible to every visitor forever.
            let remoteData = await pb.collection('borrowing').getFullList({
                filter: `updated>'${localDataLastUpdated}'`
            });
            $data = [...$data.filter(d => !remoteData.some(da => da.record == d.record)), ...remoteData];
            let loadEnd = performance.now();
            loaded = loadEnd - pageStartTime;
            if(!loaded) loaded = true;
        }catch(e){
            console.log('Unable to load remote data', e)
        }
    }
    loadData();

    //$: console.log('data updated', $data);

    let verbose = false;

    let loaded = false;
    let pageStartTime = performance.now();
    $: bibliographyRoute = $path == '/admin' || $path == '/browse' || ['/tags', '/contributors', '/works', '/sources'].includes($path) || resolve($path, /(record|search)\/(.+)/);

    onMount(() => {
        let p = new URLSearchParams(window.location.search);
        if(p.has('verbose')) verbose = true;
    })

    let elements = ['Home', 'Browse', 'About', 'Acknowledgements']


</script>
<svelte:head>
    <title>Musical Borrowing & Reworking: an annotated bibliography</title>
</svelte:head>
    <div class:admin_shell={$path == '/admin'} class="app_shell">
    {#if $path == '/admin'}
        <div class="admin_mode_banner noprint" role="status">Admin editing mode</div>
    {/if}
    <div id="header" class:compact_browse={bibliographyRoute} class="noprint">
            <div class="masthead">
                <div class="eyebrow">Annotated bibliography</div>
                <h1>Musical Borrowing and Reworking</h1>
                {#if bibliographyRoute}
                    <div class="sync_status" aria-live="polite">
                        {#if loaded}
                            Synced
                        {:else}
                            Syncing...
                        {/if}
                    </div>
                {/if}
                <p>Scholarship on quotation, paraphrase, modeling, allusion, sampling, and related musical reworkings.</p>
            </div>
        <div class="top">
            <nav class="nav" aria-label="Primary navigation">
                <a href="/" class:selected={$path == '/'}>Home</a>
                <a href="/browse" class:selected={$path == '/browse' || resolve($path, /(record|search)\/(.+)/)}>Browse</a>
                <a href="/tags" class:selected={$path == '/tags'}>Tags</a>
                <a href="/contributors" class:selected={$path == '/contributors'}>Contributors</a>
                <a href="/works" class:selected={$path == '/works' || $path == '/sources'}>Works/Sources</a>
                <a href="/about" class:selected={$path == '/about'}>About</a>
                <a href="/acknowledgements" class:selected={$path == '/acknowledgements'}>Acknowledgements</a>
            </nav>
            
        </div>
        
    </div>
    {#if bibliographyRoute}
        {#if $path == '/admin'}
                <AdminView />
            {/if}
            {#if verbose}
                <div>
                    Loading status: {loaded ? `loaded remote data in ${loaded} ms` : 'using local data'}.
                </div>
            {/if}
            <BibDisplay />
    {:else}
        <main>
            {#if $path === '/about'}
                <About />
            {:else if $path === '/acknowledgements'} 
                <Ack />
            {:else}
                <Home />
            {/if}
        </main>
    {/if}
    <div class="attribution">
        <img src="/by.png" alt="Creative Commons Attribution license" />
        <div class="attrib_text">
            <div>
                Data from the <a href="https://web.archive.org/web/20250507173203/https://chmtl.indiana.edu/borrowing/">CHTML Musical Borrowing & Reworking project</a> 
            </div>
            <div>
                Subject to a <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>
            </div>
        </div>
        
    </div>
    <div class="version" style={$path === '/admin' ? "visibility: visible;" : ''}>
        v0.16 (21 April 2026) 
    </div>
    </div>
<style>

    .version {
        position: absolute;
        bottom: 5px;
        left: 5px;
        font-size: 0.6em;
        font-style: italic;
        visibility: hidden;
    }

    .app_shell {
        display: contents;
    }

    .admin_mode_banner {
        position: sticky;
        top: 0;
        z-index: 80;
        display: block;
        margin: 0 -1.1rem;
        padding: 0.22rem 1.1rem;
        background: #7a2d22;
        color: #fffaf1;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.72rem;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-align: center;
        text-transform: uppercase;
        box-shadow: 0 1px 0 rgba(86, 34, 24, 0.2);
    }

    :global(body:has(.admin_shell)) {
        background:
            linear-gradient(180deg, rgba(122, 45, 34, 0.12), rgba(255, 255, 255, 0) 18rem),
            #f8eee7;
    }

    :global(body:has(.admin_shell) #app) {
        background: linear-gradient(90deg, rgba(122, 45, 34, 0.06), rgba(122, 45, 34, 0) 4rem);
    }

    :global(body:has(.admin_shell) #header.compact_browse) {
        border-bottom-color: #c69588;
    }

    :global(body:has(.admin_shell) .filters) {
        background: rgba(255, 250, 241, 0.86);
        border-bottom-color: #c69588;
    }

    :global(body:has(.admin_shell) details.bib) {
        border-top-color: #d7b2a7;
    }

    :global(#app) {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        min-height: 100vh;
        max-width: 1180px;
        padding: 0 1.1rem;
    }

    @media print {
         :global(#app) {
            height: auto;
            max-width: none;
            min-height: 0;
            padding: 0;
         }
    }

    #header {
        text-align: center;
        width: 100%;
        padding: 2rem 0 1.1rem;
        transition: padding 220ms ease, border-color 220ms ease;
    }

    #header.compact_browse {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.7rem 0 0.55rem;
        border-bottom: 1px solid #ded2c0;
    }

    .masthead {
        max-width: 840px;
        margin: 0 auto 1rem;
        transition: margin 220ms ease, max-width 220ms ease;
    }

    .compact_browse .masthead {
        margin: 0;
        text-align: left;
    }

    .eyebrow {
        color: #8b3f2a;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.74rem;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        max-height: 1.2rem;
        overflow: hidden;
        transition: opacity 180ms ease, max-height 220ms ease;
    }

    .masthead h1 {
        margin: 0.2rem 0 0.55rem;
        transition: font-size 220ms ease, line-height 220ms ease, margin 220ms ease;
    }

    .compact_browse .masthead h1 {
        margin: 0;
        font-size: 1.15rem;
        line-height: 1.2;
    }

    .masthead p {
        margin: 0 auto;
        max-width: 700px;
        color: #63594c;
        font-size: 1.02rem;
        max-height: 4rem;
        overflow: hidden;
        transition: opacity 180ms ease, transform 220ms ease, max-height 220ms ease, margin 220ms ease;
    }

    .compact_browse .eyebrow,
    .compact_browse .masthead p {
        max-height: 0;
        margin: 0;
        opacity: 0;
        transform: translateY(-0.2rem);
    }

    .top {
        display: flex;
        flex-wrap: nowrap;
        justify-content: center;
        width: 100%;
        transition: width 220ms ease;
    }

    .compact_browse .top {
        width: auto;
    }

    .nav {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.35rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.96rem;
        transition: font-size 220ms ease;
    }

    .compact_browse .nav {
        font-size: 0.84rem;
    }

    .nav > a {
        color: #4b4035;
        text-decoration: none;
        border-radius: 999px;
        padding: 0.38rem 0.72rem;
        transition: background-color 160ms ease, color 160ms ease, padding 220ms ease;
    }

    .compact_browse .nav > a {
        padding: 0.24rem 0.55rem;
    }

    .nav > a:hover {
        background: #eadcc7;
        color: #4b2519;
    }

    .attribution {
        align-self: center;
        margin: 1rem 0 1.2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5em;
        color: #6d6255;
    }

    .attribution img {
        height: 1.7rem;
        width: auto;
    }

    .sync_status {
        display: inline-flex;
        margin-top: 0.15rem;
        color: #74675b;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.68rem;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    .compact_browse .sync_status {
        margin-left: 0.45rem;
        vertical-align: middle;
    }

    .attrib_text {
        font-style: italic;
        font-size: 0.8em;
    }
    
    a.selected {
        background: #6c3526;
        color: #fffaf1;
        font-weight: 600;
    }

    main {
        flex-grow: 1;
        overflow-y: auto;
        max-width: 850px;
        width: 100%;
        margin: 0 auto;
        padding: 0.4rem 0 1.5rem;
        font-size: 1.03rem;
    }

    main :global(p) {
        margin: 0 0 1rem;
    }

    @media (max-width: 700px) {
        :global(#app) {
            padding: 0 0.7rem;
        }

        #header {
            padding-top: 1.25rem;
        }

        #header.compact_browse {
            align-items: center;
            flex-direction: column;
            gap: 0.35rem;
        }

        .attribution {
            align-items: flex-start;
        }
    }

</style>
