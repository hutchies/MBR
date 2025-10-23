import {data as localData} from './data.js';
import { derived, get, writable } from 'svelte/store';

export let tags = ['General','Monophony to 1300','Polyphony to 1300','1300s','1400s','1500s','1600s','1700s','1800s','1900s','2000s','Jazz','Popular','Film']
//export let data = $state([...localData]);
export let data = writable([...localData]);
export let params = writable({
    logged_in: false,
    editRecord: false,
    admin: false
});
export let contributors = derived(data, (data) => Array.from(new Set(data.filter(d => d.contributors).flatMap(d => d.contributors))));