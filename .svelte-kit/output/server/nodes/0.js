import * as universal from '../entries/pages/_layout.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.nvy7FF_7.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DEURiG5u.js","_app/immutable/chunks/DtobFnlt.js"];
export const stylesheets = [];
export const fonts = [];
