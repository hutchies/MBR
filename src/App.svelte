<script>
    // @ts-nocheck
    import { onMount } from 'svelte';
    import BibDisplay from './lib/BibDisplay.svelte';
    //import { data as localData } from './lib/data.js';
    import { login, pb } from './lib/pb.js';
    import AdminView from './lib/AdminView.svelte';
    import { data, params } from './lib/shared.svelte.js';
    import { localDataLastUpdated } from './lib/data';
    import { path } from 'elegua';
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
            console.log(`deleted=false && updated>'${localDataLastUpdated}'`);
            let remoteData = await pb.collection('borrowing').getFullList({
                
                filter: `deleted=false && updated>'${localDataLastUpdated}'`
            });
            $data = [...$data.filter(d => !remoteData.some(da => da.record == d.record)), ...remoteData];
            let loadEnd = performance.now();
            console.log('synced with remote', data, remoteData);
            loaded = loadEnd - pageStartTime;
            if(!loaded) loaded = true;
        }catch(e){
            console.log('Unable to load remote data', e)
        }
    }
    loadData();

    $: console.log('data updated', $data);

    let verbose = false;

    let loaded = false;
    let pageStartTime = performance.now();

    onMount(() => {
        let p = new URLSearchParams(window.location.search);
        if(p.has('verbose')) verbose = true;
    })

    let elements = ['Home', 'Browse', 'About', 'Acknowledgements']


</script>
<svelte:head>
    <title>Musical Borrowing & Reworking: an annotated bibliography</title>
</svelte:head>
    <div id="header">
        <h1>Musical Borrowing and Reworking: an annotated bibliography</h1>
        <div class="top">
            <div class="nav">
                <a href="/" class:selected={$path == '/'}>Home</a>
                <a href="/db" class:selected={$path == '/browse'}>Browse</a>
                <a href="/about" class:selected={$path == '/about'}>About</a>
                <a href="/acknowledgements" class:selected={$path == '/acknowledgements'}>Acknowledgements</a>
            </div>
            <div class="attribution">
                <div>
                    Data from the <a href="https://web.archive.org/web/20250507173203/https://chmtl.indiana.edu/borrowing/">CHTML Musical Borrowing & Reworking project</a> 
                </div>
                <div>
                    Subject to a <a href="https://creativecommons.org/licenses/by/4.0/">Creative Commons Attribution 4.0 International License</a>
                </div>
            </div>
        </div>
        
    </div>
    <hr />
    {#if $path == '/admin' || $path == '/browse'}
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
            {#if $path === '/'}
                <Home />
            {:else if $path === '/about'}
                <About />
            {:else if $path === '/acknowledgements'} 
                <Ack />
            {/if}
        </main>
    {/if}
    
    <div class="version" style={$path === '/admin' ? "visibility: visible;" : ''}>
        v0.16 (21 April 2026) 
    </div>
<style>

    h1 {
        font-size: 1.7em;
        font-family: sans-serif;
        margin-top: 0.2em;
        margin-bottom: 0.2em;
    }
    

    .version {
        position: absolute;
        bottom: 5px;
        left: 5px;
        font-size: 0.6em;
        font-style: italic;
        visibility: hidden;
    }

    :global(#app) {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        height: calc(100vh - 16px);
    }

    hr {
        width: 100%;
    }

    #header {
        text-align: center;
        width: 100%;
    }

    .top {
        display: flex;
        flex-wrap: nowrap;
        justify-content: space-between;
        width: 100%;
    }

    .nav {
        display: flex;
        flex-wrap: wrap;
        gap: 1vmin;
        font-family: sans-serif;
        font-size: 1.2rem;
    }

    .nav > a {
        color: unset;
        text-decoration: unset;
    }

    .attribution {
        text-align: right;
        font-style: italic;
    }
    
    a.selected {
        font-weight: 500;
        color: blue;
    }

    main {
      overflow-y: auto;  
    }

</style>