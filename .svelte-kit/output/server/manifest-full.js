export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([".DS_Store","robots.txt"]),
	mimeTypes: {".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.C4G9iivQ.js",app:"_app/immutable/entry/app.Dn5onI59.js",imports:["_app/immutable/entry/start.C4G9iivQ.js","_app/immutable/chunks/ClcCd8zn.js","_app/immutable/chunks/CWsyDGSb.js","_app/immutable/chunks/BIDFqpyO.js","_app/immutable/entry/app.Dn5onI59.js","_app/immutable/chunks/BIDFqpyO.js","_app/immutable/chunks/CWsyDGSb.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/CJl73vZf.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/admin",
				pattern: /^\/admin\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
