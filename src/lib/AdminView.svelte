<script>
    // @ts-nocheck

    import Dialog from "./Dialog.svelte";
    import MultiSelect from 'svelte-multiselect';
    import { login, pb } from "./pb";
    import { data, tags as tagsList, contributors as contribList, params} from "./shared.svelte";
    import { onMount } from "svelte";
    import ListEdit from "./ListEdit.svelte";
    //import { data } from "./data";

    let nextRecord = 1;
    $: if($data.length) nextRecord = Math.max(...$data.map(d => d.record)) + 1;

    let error = '';

    let user = '';
    let pwd = '';
    
    let logging_in = false;
    
    async function logMeIn(){
        try{
            logging_in = true;
            await login(user, pwd);
            $params.logged_in = true;
        }catch(e){
            error = e.toString();
        }
        logging_in = false;
    }

    let author, citation, contributors, annotation, works, sources, tags;

    function resetNew(){
        author = '';
        citation = '';
        contributors = [];
        works = '';
        annotation = '';
        sources = '';
        tags = [];
    }

    resetNew();

    function normalise(rec){
        for(let k of ['works', 'sources']){
            if(Array.isArray(rec[k])) rec[k] = rec[k].map(w => w.trim()).filter(w => w && w != '<br>');
        }
        return rec;
    }

    // Only on create. On update the empty keys must survive, or clearing a field
    // silently leaves the old value in the database.
    function stripEmpty(rec){
        let out = {};
        for(let [k, v] of Object.entries(rec)){
            if(v && !(Array.isArray(v) && v.length == 0)) out[k] = v;
        }
        return out;
    }

    $params.editItem = (d) =>{
        author = d.author;
        citation = d.citation;
        contributors = d.contributors || [];
        works = d.works || [];
        annotation = d.annotation || '';
        sources = d.sources || [];
        tags = d.tags || [];
        $params.editRecord = d.record;
    }

    $params.deleteItem = (d) => {
        if(!confirm('Are you sure you want to delete this item?')) return;
        deleteItem(d);

    }

    async function deleteItem(d){
        try{
            let orig = await pb.collection('borrowing').getFirstListItem(`record=${d.record}`);
            await pb.collection('borrowing').update(orig.id, {deleted: true});
            $data = $data.map(r => r.record == d.record ? {...r, deleted: true} : r);
            $params.editRecord = '';
            result = 'Record deleted';
            setTimeout(() => {result = ''}, 2000);
        }catch(e){
            console.log("Error deleting record!", e);
            result = `Error: ${e}`
        }
        
    }

    async function addOrUpdateItem(){
        let rec = {
            author,
            citation,
            contributors,
            works,
            annotation,
            sources,
            tags
        };    
    
        rec = normalise(rec);

        try{
            if($params.editRecord == 'new'){
                rec.record = nextRecord;
                let created = await pb.collection('borrowing').create(stripEmpty(rec));
                rec.record = created.record;
                if(!$data.some(d => d.record == rec.record)) $data = [...$data, rec];
                result = 'Record added';
                if($data.length) nextRecord = Math.max(...$data.map(d => d.record)) + 1;
            }else if($params.editRecord){
                rec.record = $params.editRecord;
                let orig = await pb.collection('borrowing').getFirstListItem(`record=${rec.record}`);
                await pb.collection('borrowing').update(orig.id, rec);
                $data = [...$data.filter(d => d.record != rec.record), rec];
                result = 'Record updated';
            }else{
                console.log(`Shouldn't be able to do this!`)
            }
            $params.editRecord = '';
            setTimeout(() => {result = ''}, 2000);
            resetNew();
        }catch(e){
            console.log("Error creating/updating record!", e);
            result = `Error: ${e}`
        }
        
    }

    console.log($contribList)

    let result = ''

    let icons = {
        login: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5v3H3v4h7v3Zm2 3h7V4h-7V2h9v20h-9v-2Z"/></svg>',
        save: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h12l2 2v16H5V3Zm2 2v14h10V7.8L14.2 5H13v5H8V5H7Zm3 0v3h1V5h-1Zm-1 9h6v4H9v-4Z"/></svg>',
        plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5Z"/></svg>',
        edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 17.3V20h2.7L17.8 8.9l-2.7-2.7L4 17.3ZM19.7 7a1 1 0 0 0 0-1.4l-1.3-1.3a1 1 0 0 0-1.4 0l-1 1L18.7 8l1-1Z"/></svg>',
        trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 21c-1.1 0-2-.9-2-2V8h14v11c0 1.1-.9 2-2 2H7ZM9 4h6l1 2h4v2H4V6h4l1-2Zm0 6v8h2v-8H9Zm4 0v8h2v-8h-2Z"/></svg>'
    }

    onMount(() => {
        try{
            pb.collection('borrowing').subscribe('*', (e) => {
                console.log('db update', e);
                if(e.action == 'create'){
                    let rec = $data.find(d => d.record == e.record.record);
                    if(!rec) $data = [...$data, {...e.record}];
                }else if(e.action == 'update'){
                    let rec = $data.find(d => d.record == e.record.record);
                    $data = [...$data.filter(d => d.record != e.record.record), e.record];
                    /*if(rec){
                        rec = {...e.record};
                    }
                    $data = $data;*/
                }else if(e.action == 'delete'){
                    let rec = $data.find(d => d.record == e.record.record);
                    $data = $data.filter(d => d.record != e.record.record)
                }
                if($data.length) nextRecord = Math.max(...$data.map(d => d.record)) + 1;
            })
        }catch(e){
            console.log("Error subscribing", e);
        }
    })

</script>
<div class="admin">
    <div class="admin_badge"><span class="admin_dot"></span>Admin mode</div>
    {#if result}<div class="admin_result">{result}</div>{/if}
</div>
{#if !$params.logged_in}
        <Dialog name="Log in" showHandle={true}>
            <form class="admin_form login_form" on:submit|preventDefault={logMeIn}>
                <div class="form_intro">Log in to access editing tools.</div>
                <label>
                    <span>Username</span>
                    <input type="text" bind:value={user} />
                </label>
                <label>
                    <span>Password</span>
                    <input type="password" bind:value={pwd} />
                </label>
                <div class="dialog_actions">
                    <button class="admin_button primary" disabled={logging_in}>
                        <span class="icon">{@html icons.login}</span>
                        {logging_in ? 'Logging in...' : 'Log in'}
                    </button>
                    {#if error}<div class="form_error">{error}</div>{/if}
                </div>
            </form>
        </Dialog>
{:else if $params.editRecord}
    <Dialog name={$params.editRecord == 'new' ? 'Add entry' : 'Edit entry'} showHandle={true} showClose={true} on:close={e => {$params.editRecord = '';}}>
        <form class="admin_form edit_form" on:submit|preventDefault={addOrUpdateItem}>
            <div class="edit_scroll">
                <div class="field_group">
                    <span>Author <small>surname, forename</small></span>
                    <div contenteditable bind:innerHTML={author}></div>
                </div>
                <div class="field_group">
                    <span>Citation</span>
                    <div contenteditable bind:innerHTML={citation}></div>
                </div>
                <div class="field_group">
                    <span>Annotation</span>
                    <div class="annotation_edit" contenteditable bind:innerHTML={annotation}></div>
                </div>
                <div class="field_group">
                    <span>Works <small>type ';' to add a new one</small></span>
                    <ListEdit bind:value={works} />
                </div>
                <div class="field_group">
                    <span>Sources <small>type ';' to add a new one</small></span>
                    <ListEdit bind:value={sources} />
                </div>
                <div class="field_group">
                    <span>Contributors</span>
                    <MultiSelect allowUserOptions createOptionMsg={"Add contributor..."} closeDropdownOnSelect={"retain-focus"} style="background-color: white; color: black;" bind:selected={contributors} options={$contribList} />
                </div>
                <div class="field_group">
                    <span>Tags</span>
                    <MultiSelect closeDropdownOnSelect={true} style="background-color: white; color: black;" bind:selected={tags} options={tagsList} />
                </div>
            </div>
            
            <!--{#if $params.editRecord == 'new'}
                <div>
                    Record number (autogenerated): {nextRecord}
                </div>
            {/if}-->
            <div class="dialog_actions">
                <button class="admin_button primary" disabled={!author || !citation}>
                    <span class="icon">{@html $params.editRecord == 'new' ? icons.plus : icons.save}</span>
                    {$params.editRecord == 'new' ? 'Add to database' : 'Update in database'}
                </button>
            </div>
        </form>
        
    </Dialog> 
{/if}

<style>
    .admin {
        position: absolute;
        top: 0.55rem;
        left: 0.55rem;
        z-index: 40;
        display: flex;
        align-items: center;
        gap: 0.45rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .admin_badge,
    .admin_result {
        display: inline-flex;
        align-items: center;
        min-height: 1.75rem;
        border: 1px solid #d8c8b2;
        border-radius: 999px;
        background: rgba(255, 252, 245, 0.94);
        color: #6c3526;
        font-size: 0.74rem;
        font-weight: 800;
        padding: 0.18rem 0.55rem;
        box-shadow: 0 4px 12px rgba(63, 43, 27, 0.08);
    }

    .admin_dot {
        width: 0.45rem;
        height: 0.45rem;
        margin-right: 0.35rem;
        border-radius: 999px;
        background: #b13b2f;
    }

    .admin_result {
        color: #294a2a;
    }

    .admin_form {
        width: min(100%, 820px);
        color: #fffaf1;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    .login_form {
        width: min(24rem, 100%);
    }

    .form_intro {
        margin-bottom: 0.8rem;
        font-weight: 700;
    }

    .admin_form label,
    .field_group {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        margin-bottom: 0.75rem;
        font-size: 0.82rem;
        font-weight: 800;
    }

    .admin_form small {
        color: rgba(255, 250, 241, 0.72);
        font-weight: 600;
    }

    .admin_form input {
        min-height: 2.15rem;
        border: 1px solid #d8c8b2;
        border-radius: 6px;
        padding: 0.35rem 0.5rem;
    }

    .edit_scroll {
        max-height: 60vh;
        overflow-y: auto;
        padding-right: 0.35rem;
    }

    div[contenteditable] {
        min-width: 20em;
        min-height: 1.5em;
        border: 1px solid #d8c8b2;
        border-radius: 6px;
        background-color: #fffdf8;
        color: #2d2924;
        font-family: serif;
        display: block;
        padding: 0.42rem 0.5rem;
        white-space: pre-wrap;
    }

    .annotation_edit {
        min-height: 10em;
        vertical-align: top;
    }

    .dialog_actions {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.65rem;
        width: 100%;
        margin-top: 0.8rem;
    }

    .admin_button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 0.42rem;
        border: 1px solid #d9c5ad;
        border-radius: 999px;
        min-height: 2.25rem;
        padding: 0.35rem 0.8rem;
        font-size: 0.9rem;
        font-weight: 800;
    }

    .admin_button.primary {
        background: #6c3526;
        color: #fffaf1;
    }

    .icon {
        display: inline-flex;
        width: 1rem;
        height: 1rem;
    }

    .icon :global(svg),
    :global(.admin_action svg) {
        width: 1rem;
        height: 1rem;
        fill: currentColor;
    }

    .form_error {
        color: #ffd4cf;
        font-size: 0.82rem;
        font-weight: 700;
    }

    @media (max-width: 720px) {
        .admin {
            position: static;
            margin: 0.35rem 0;
        }

        .admin_form {
            width: 100%;
        }
    }

</style>
