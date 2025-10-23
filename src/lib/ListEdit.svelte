<script>
    import { afterUpdate, tick } from "svelte";




    export let value = [];

    $: if(value.length == 0) value = ['<br>'];

    function possiblySplitOrJoin(e, i){
        if(e.key == ";"){
            value = [...value.slice(0, i+1), '<br>', ...value.slice(i+1)];
            e.preventDefault();
            tick().then(() => {
                if(elements[i + 1]) elements[i + 1].focus();
            })
        }else if(e.key == 'Backspace' && elements[i] && elements[i].innerText.trim() == ''){
            value = [...value.slice(0, i), ...value.slice(i+1)];
            e.preventDefault();
            tick().then(() => {
                if(elements[i - 1]){
                    //elements[i - 1].focus();
                    const selection = window.getSelection();
                    selection.removeAllRanges();
                    const range = document.createRange();
                    console.log(elements[i - 1], range, selection);
                    range.selectNodeContents(elements[i - 1]);
                    //range.collapse();
                    selection.addRange(range);
                    range.collapse();
                    //
                    //elements[i - 1].setSelectionRange(elements[i - 1].innerText.length, elements[i - 1].innerText.length)
                }
            })
        }
    }

    let elements = [];

    //$: console.log(value);

</script>

<div style="display: flex; gap: 5px; flex-wrap: wrap;">
    {#each value as v, i (i)}
        <div bind:this={elements[i]} contenteditable bind:innerHTML={v} on:keydown={e => {possiblySplitOrJoin(e, i)}}></div>
    {/each}
    {#if elements[value.length - 1] && elements[value.length - 1].innerText.trim() != ''}
        <button on:click={e => {value = [...value, '']}}>+</button>
    {:else if elements.filter(e => e && e.innerText.trim() != '').length > 0}
        <button on:click={e => {value = value.slice(0, value.length - 1)}}>-</button>
    {/if}
</div>


<style>
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

    button {
        border-radius: 30%;
        font-weight: bold;
    }

</style>