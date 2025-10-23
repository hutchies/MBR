import * as universal from '../entries/pages/_layout.js';

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export { universal };
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.C-P6AguX.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/BIDFqpyO.js","_app/immutable/chunks/DXy813XA.js"];
export const stylesheets = [];
export const fonts = [];
