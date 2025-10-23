<script>
    import { createEventDispatcher } from "svelte";
    import { draggable } from 'svelte-drag';

    export let name;
    export let showHandle = false;
    export let showClose = false;

    let prefs = {
        handle: '.handle'
    };

    const dispatch = createEventDispatcher();

</script>

<div class="dialog_outer" >
    <div use:draggable={prefs} class="dialog_inner" style="flex: 1; justify-content: space-evenly;">
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 80vh; padding-bottom: 1vmin;">
                <div style="display: flex; gap: 1vmin; justify-content: space-between;">
                    {#if showClose}<img class="close" on:click={e => {dispatch('close')}} src="close.svg" />{/if}
                    {#if showHandle}
                    <div class="handle">
                        {@html name}
                    </div> 
                {/if} 
                </div>
                
                <slot />
        </div>
    </div>
</div>
<style>
    .close {
        max-width: 3vmin;
        max-height: 3vmin;
        margin-left: 0.5vmin;
        margin-bottom: 0.5vmin;
        filter: invert(0.9);
    }

    .hidden {
        display: none;
    }

    .handle {
        width: 100%;
        background-color: white;
        height: 3vmin;
        display: flex;
        color: black;
        align-items: center;
        justify-content: center;
        border-radius: 1vmin;
    }

    .dialog_outer {
        font-family: sans-serif;
        position: fixed;
        left: 50%;
        top: 50%;
        display: flex;
        flex-direction: column;
        gap: 5vmin;
        z-index: 300;
        max-width: 80vw;
        max-height: 80vh;
        transform: translate(-50%, -50%);
        justify-content: space-evenly;
        pointer-events: none;
    }

    .dialog_inner {

        padding: 2vmin;
        /* padding-bottom: 1vmin; */
        height: fit-content;
        width: fit-content;
        max-height: 90vh;
        max-width: 90vw;
        min-width: 20vw;
        backdrop-filter: blur(5px);
        -webkit-backdrop-filter: blur(5px);
        color: white;
        background-color: rgba(2,2,2,0.7);
        border: unset;
        border-radius: 30px;
        box-shadow: 0 0 10px 5px white;
        color: white;
        display: block;
        pointer-events: all;
        flex-wrap: nowrap; 
        justify-content: space-between;
        gap: 10px;
    }



</style>