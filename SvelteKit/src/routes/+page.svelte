<script>
    import BibDisplay from '$lib/BibDisplay.svelte'; 
    import { data as localData } from '$lib/data.js';
    import { pb } from '$lib/pb.js';
    
    let data = localData;
    //data = data.data;
    
    async function loadData(){
        try{
            let remoteData = await pb.collection('borrowing').getFullList();
            data = remoteData;
            console.log('synced with remote')
        }catch(e){
            console.log('Unable to load remote data', e)
        }
    }
    loadData();

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
        <hr />
        <BibDisplay data={data} />
        <div class="version">
            v0.14 (10 Oct 2025)
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

    :global(body) {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        height: calc(100vh - 16px);
    }

    hr {
        width: 100%;
    }

</style>