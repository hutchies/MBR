<script>
    // @ts-nocheck

    import Dialog from "./Dialog.svelte";
    import MultiSelect from 'svelte-multiselect';
    import { login, loginOTP, pb } from "./pb";
    import { data, tags as tagsList, contributors as contribList, params} from "./shared.svelte";
    import { onMount } from "svelte";
    import ListEdit from "./ListEdit.svelte";
    //import { data } from "./data";

    let nextRecord = Math.max(...$data.map(d => d.record)) + 1;

    let error = '';

    let user = '';
    let pwd = '';
    
    let working = false;
    
    async function logMeIn(){
        try{
            working = true;
            //await login(user, pwd);
            await loginOTP(loginRequest.req, pwd);
            $params.logged_in = true;
        }catch(e){
            error = e.toString();
        }
        working = false;
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

    function cleanupItem(rec){
        if(rec.works){
            rec.works = rec.works.map(w => w.trim()).filter(w => w && w != '<br>');
        }
        if(rec.sources){
            rec.sources = rec.sources.map(w => w.trim()).filter(w => w && w != '<br>');
        }
        let toDelete = [];

        for(let k of Object.keys(rec)){
            if(!rec[k] || Array.isArray(rec[k]) && rec[k].length == 0) toDelete.push(k);
        }
        for(let k of toDelete){
            delete rec[k];
        }

        return rec;
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
            orig.deleted = true;
            await pb.collection('borrowing').update(orig.id, orig);
            d.deleted = true;
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
    
        rec = cleanupItem(rec);

        try{
            if($params.editRecord == 'new'){
                rec.record = nextRecord;
                await pb.collection('borrowing').create(rec);
                if(!$data.some(d => d.record == rec.record)) $data = [...$data, rec];
                // Add itself, trusting that the update mechanism will successfully ignore otherwise
                result = 'Record added';
                nextRecord = Math.max(...$data.map(d => d.record)) + 1;
            }else if($params.editRecord){
                rec.record = $params.editRecord;
                let orig = await pb.collection('borrowing').getFirstListItem(`record=${rec.record}`);
                await pb.collection('borrowing').update(orig.id, rec);
                let d = $data.find(d => d.record == rec.record);
                if(d){
                    $data = $data.filter(d => d.record != rec.record);
                    $data = [...$data, d];
                }else{
                    console.log('Hmm, record not found... odd! Adding', rec);
                    $data = [...$data, rec];
                }
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
    let loginRequest = {
        email: false,
        req: false
    }

    async function sendRequest(email){
        
        loginRequest.email = email;
        working = true;
        loginRequest.req = await pb.collection('mbr_users').requestOTP(email);
        working = false;
    }

    onMount(() => {
        try{
            pb.collection('borrowing').subscribe('*', (e) => {
                console.log('db update', e);
                if(e.action == 'create'){
                    let rec = $data.find(d => d.record == e.record.record);
                    if(!rec) $data = [...data, {...e.record}];
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
                nextRecord = Math.max(...$data.map(d => d.record)) + 1;
            })
        }catch(e){
            console.log("Error subscribing", e);
        }
    })

    function next(){
        if(OTPsent(user)){
            logMeIn();
        }else{
            sendRequest(user);
        }
    }

    function OTPsent(email){
        if(user == loginRequest.email && loginRequest.req) return true;
        return false;
    }

</script>
<div class="admin">
    <div>Admin mode</div>
    <div>{result}</div>
</div>
{#if !$params.logged_in}
        <Dialog name="Log in" showHandle={true}>
            {#if !OTPsent(user, loginRequest)}
                <b>You must log in to access editing tools.</b>
                Enter a registered email address and you will receive a one-time password by email.
            {:else}
                Enter the password 
            {/if}
            <form on:submit|preventDefault={next}>
                <table>
                    <tbody>
                        <tr>
                            <td>Email address:</td>
                            <td><input type="text" bind:value={user} /></td>
                        </tr>
                        {#if OTPsent(user, loginRequest)}
                            <tr>
                                <td>
                                    Password:
                                </td>
                                <td>
                                    <input type="password" bind:value={pwd} />
                                </td>
                            </tr>
                        {/if}
                    </tbody>
                </table>
                <div style="width: 100%; text-align: center;">
                    <button disabled={working || OTPsent(user, loginRequest) && !pwd}>
                        {#if OTPsent(user, loginRequest)}
                            {working ? 'Logging in...' : 'Log in'}
                        {:else}
                            Send new password to email address
                        {/if}
                    </button>
                    {#if error}<div>{error}</div>{/if}
                </div>
            </form>
        </Dialog>
{:else if $params.editRecord}
    <Dialog name={$params.editRecord == 'new' ? 'Add entry' : 'Edit entry'} showHandle={true} showClose={true} on:close={e => {$params.editRecord = '';}}>
        <form style="width: 60vw;" on:submit|preventDefault={addOrUpdateItem}>
            <div style="max-height: 70vh; overflow-y: auto;">
                <div>
                    Author (surname, forename): <div contenteditable bind:innerHTML={author}></div>
                </div><div>
                    Citation: <div contenteditable bind:innerHTML={citation}></div>
                </div><div>
                    Annotation: <div style="min-height: 10em; vertical-align: top;" contenteditable bind:innerHTML={annotation}></div>
                </div><div>
                    Work(s) – type ';' to add a new one: <ListEdit bind:value={works} />
                </div><div>
                    Source(s) – type ';' to add a new one: <ListEdit bind:value={sources} />
                </div><div>
                    Contributor(s):<MultiSelect allowUserOptions createOptionMsg={"Add contributor..."} closeDropdownOnSelect={"retain-focus"} style="background-color: white; color: black;" bind:selected={contributors} options={$contribList} />
                </div><div>
                    Tag(s): <MultiSelect closeDropdownOnSelect={true} style="background-color: white; color: black;" bind:selected={tags} options={tagsList} />
                </div>
            </div>
            
            <!--{#if $params.editRecord == 'new'}
                <div>
                    Record number (autogenerated): {nextRecord}
                </div>
            {/if}-->
            <div style="width: 100%; text-align: center;">
                <button style="font-size: 1.2em;" disabled={!author || !citation} >{$params.editRecord == 'new' ? 'Add to database' : 'Update in database'}</button>
            </div>
        </form>
        
    </Dialog> 
{/if}

<style>
    .admin {
        position: absolute;
        top: 5px;
        left: 5px;
        font-weight: bold;
        font-family: sans-serif;
        color: red;
    }

    hr {
        width: 100%;
    }

    div[contenteditable] {
        min-width: 20em;
        min-height: 1.5em;
        background-color: ivory;
        color: black;
        font-family: serif;
        display: block;
        padding-left: 5px;
        padding-right: 5px;
        padding-top: 5px;
        white-space: pre-wrap;
    }

    table,tr,td,th {
        border: none;
    }

</style>