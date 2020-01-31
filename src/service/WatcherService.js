import fs from "fs"

const filesWatching = {}
const modulesWatching = {}
let funcListener = null

const watchFile = (file) => {
	if(filesWatching[file.fullPath]) {
		return
	}
	fs.watch(file.fullPath, { encoding: "utf8" }, (eventType, filename) => {
		if(filename) {
			handleWatcherEvent(eventType, file)
		}
	})
	filesWatching[file.fullPath] = true
}

const unwatchFile = (file) => {
	if(!filesWatching[file.fullPath]) {
		return
	}
	fs.unwatch(file.fullPath)
}

const watchModule = (module) => {
	if(modulesWatching[module.path]) {
		return
	}
	fs.watch(module.path, { encoding: "utf8" }, (eventType, filename) => {
		if(filename) {
			handleWatcherEvent(eventType, module)
		}
	})
	modulesWatching[module.path] = true
}

const unwatchModule = (module) => {
	if(!modulesWatching[module.path]) {
		return
	}
	fs.unwatch(module.path)
}

const handleWatcherEvent = (eventType, file) => {
	if(funcListener) {
		funcListener(eventType, file)
	}
}

const setListener = (func) => {
	funcListener = func
}

export default {
	watchFile, unwatchFile, watchModule, unwatchModule,
	setListener
}