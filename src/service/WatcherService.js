import fs from "fs"

let funcListener = null

const watchFile = (file) => {
	fs.watch(file.fullPath, { encoding: "utf8" }, (eventType, filename) => {
		if(filename) {
			handleWatcherEvent(eventType, file)
		}
	})
}

const unwatchFile = (file) => {
	fs.unwatch(file.fullPath)
}

const watchModule = (module) => {
	fs.watch(module.path, { encoding: "utf8" }, (eventType, filename) => {
		if(filename) {
			handleWatcherEvent(eventType, module)
		}
	})
}

const unwatchModule = (module) => {
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