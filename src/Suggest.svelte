<script>
    // @ts-nocheck
    import { pb } from './lib/pb.js';

    let author = '';
    let citation = '';
    let annotation = '';
    let notes = '';
    let submitterName = '';
    let submitterEmail = '';
    // Hidden from people; bots that fill every field give themselves away.
    let website = '';

    let sending = false;
    let sent = false;
    let error = '';

    async function submit(){
        error = '';
        if(website){
            sent = true;
            return;
        }
        sending = true;
        try{
            await pb.collection('suggestions').create({
                author: author.trim(),
                citation: citation.trim(),
                annotation: annotation.trim(),
                notes: notes.trim(),
                submitter_name: submitterName.trim(),
                submitter_email: submitterEmail.trim(),
                status: 'new'
            });
            sent = true;
        }catch(e){
            console.log('Error sending suggestion', e);
            error = 'Sorry, the suggestion could not be sent. Please try again, or email it to burkhold@indiana.edu.';
        }
        sending = false;
    }

    function another(){
        author = citation = annotation = notes = '';
        sent = false;
    }
</script>

<div id="content" class="suggest">
    <h2>Suggest an item</h2>
    {#if sent}
        <div class="thanks" role="status">
            <p><strong>Thank you.</strong> Your suggestion has been sent to the editors, who will review it before it is added to the bibliography.</p>
            <button type="button" on:click={another}>Suggest another item</button>
        </div>
    {:else}
        <p>Know of a book, article, thesis or other publication about musical borrowing or reworking that is missing from the bibliography? Send us the citation. Suggestions are reviewed by the editors before they appear.</p>
        <form on:submit|preventDefault={submit}>
            <label>
                <span>Author(s) <small>surname, forename</small></span>
                <input bind:value={author} required maxlength="500" placeholder="Burkholder, J. Peter" />
            </label>
            <label>
                <span>Citation <small>title and publication details</small></span>
                <textarea bind:value={citation} required rows="3" maxlength="4000" placeholder={'"The Uses of Existing Music: Musical Borrowing as a Field." Notes 50 (March 1994): 851-70.'}></textarea>
            </label>
            <label>
                <span>Annotation <small>optional: a summary of what it says about borrowing</small></span>
                <textarea bind:value={annotation} rows="5" maxlength="20000"></textarea>
            </label>
            <label>
                <span>Notes for the editors <small>optional: works and sources discussed, why it belongs</small></span>
                <textarea bind:value={notes} rows="3" maxlength="4000"></textarea>
            </label>
            <div class="pair">
                <label>
                    <span>Your name <small>optional</small></span>
                    <input bind:value={submitterName} maxlength="200" autocomplete="name" />
                </label>
                <label>
                    <span>Your email <small>optional, only used if we have questions</small></span>
                    <input type="email" bind:value={submitterEmail} autocomplete="email" />
                </label>
            </div>
            <label class="trap" aria-hidden="true">
                Website
                <input bind:value={website} tabindex="-1" autocomplete="off" />
            </label>
            <div class="actions">
                <button type="submit" disabled={sending || !author.trim() || !citation.trim()}>
                    {sending ? 'Sending...' : 'Send suggestion'}
                </button>
                {#if error}<span class="error" role="alert">{error}</span>{/if}
            </div>
        </form>
    {/if}
</div>

<style>
    form {
        display: flex;
        flex-direction: column;
        gap: 0.9rem;
        max-width: 44rem;
    }

    label {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        color: #4b2519;
    }

    small {
        font-weight: 400;
        color: #6f6357;
    }

    input,
    textarea {
        width: 100%;
        border: 1px solid #d4c8b8;
        border-radius: 6px;
        background: #fffdf8;
        color: #2d2924;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 1rem;
        padding: 0.45rem 0.55rem;
    }

    input:focus,
    textarea:focus {
        outline: 2px solid #b58b6e;
        outline-offset: 1px;
    }

    .pair {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.9rem;
    }

    .trap {
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.8rem;
    }

    .error {
        color: #9b2a1d;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 0.85rem;
    }

    .thanks {
        max-width: 44rem;
        border: 1px solid #c3d3b6;
        border-radius: 8px;
        background: #eef4e8;
        padding: 0.4rem 1rem 1rem;
    }

    @media (max-width: 720px){
        .pair {
            grid-template-columns: 1fr;
        }
    }
</style>
