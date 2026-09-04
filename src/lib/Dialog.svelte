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
        <div style="display: flex; flex-direction: column; gap: 10px; max-height: 80vh; padding-bottom: 0.5rem;">
                <div style="display: flex; gap: 0.5rem; justify-content: space-between;">
                    {#if showClose}<button class="close" type="button" aria-label="Close dialog" on:click={e => {dispatch('close')}}><img src="/close.svg" alt="" /></button>{/if}
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
        width: 2rem;
        height: 2rem;
        margin-left: 0.35rem;
        margin-bottom: 0.35rem;
        padding: 0;
        border: 0;
        border-radius: 999px;
        background: transparent;
        cursor: pointer;
    }

    .close img {
        width: 100%;
        height: 100%;
        filter: invert(0.9);
    }

    .handle {
        width: 100%;
        background-color: white;
        min-height: 2rem;
        padding: 0.25rem 0.5rem;
        display: flex;
        color: black;
        align-items: center;
        justify-content: center;
        border-radius: 0.4rem;
    }

    .dialog_outer {
        font-family: sans-serif;
        position: fixed;
        left: 50%;
        top: 50%;
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        z-index: 300;
        max-width: 80vw;
        max-height: 80vh;
        transform: translate(-50%, -50%);
        justify-content: space-evenly;
        pointer-events: none;
    }

    .dialog_inner {

        padding: 1rem;
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

    @media (max-width: 720px) {
        .dialog_outer {
            max-width: 96vw;
            max-height: 92vh;
        }

        .dialog_inner {
            min-width: 0;
            width: 92vw;
            max-height: 88vh;
            border-radius: 16px;
        }
    }

</style>
