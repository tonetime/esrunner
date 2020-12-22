#!/usr/bin/env node

const { build } = require("esbuild")
const chokidar = require("chokidar")
const liveServer = require("live-server")

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const argv = yargs(hideBin(process.argv)).argv


PRODUCTION = argv['_'][0]=='build'
ENTRY_POINTS = PRODUCTION==true ? [argv['_'][1]] : [argv['_'][0]]
ROOT=argv.root || 'public'
PORT = argv.port ||  8080

console.log("Starting. Production Mode:", PRODUCTION, " Entry points:", ENTRY_POINTS, " RootDir:", ROOT);

;(async () => {
	const buildArgs = {
		bundle: true,
		define: { "process.env.NODE_ENV": JSON.stringify(PRODUCTION || "development") },
		entryPoints: ENTRY_POINTS,
		incremental: true,
		minify: PRODUCTION,
		outfile: `${ROOT}/index.js`,		
		sourcemap:true
	}
	if (PRODUCTION==false) {
		buildArgs['treeShaking'] = 'ignore-annotations'
	}
	const builder = await build(buildArgs)

	chokidar
		.watch(["**/*.{js,jsx}"], {
			ignored: path => ["node_modules", ".git", ROOT, ".cache"].some(s => path.includes(s)),
			interval: 1000, // No delay
			ignoreInitial:true,
		})
		.on("all", (event,path) => {
			let s = Date.now()
			builder.rebuild().then(() => {
				console.log("Rebuilding because of:",event,path, " in ", (Date.now() -s ), "ms")
			})
		})
	liveServer.start({
		open: true,
		port: +PORT,
		root: ROOT,
		open:false,
		file:'index.html',
		logLevel: 0
	})
	console.log(`Opening server at http://localhost:${PORT}`);
})()