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
		client: {start:"_app/immutable/entry/start.CucLx3r6.js",app:"_app/immutable/entry/app.BuWG_Uop.js",imports:["_app/immutable/entry/start.CucLx3r6.js","_app/immutable/chunks/B--GYT6Q.js","_app/immutable/chunks/S50Y3G3F.js","_app/immutable/chunks/DEURiG5u.js","_app/immutable/entry/app.BuWG_Uop.js","_app/immutable/chunks/DEURiG5u.js","_app/immutable/chunks/S50Y3G3F.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DFqnXQ7K.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
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
