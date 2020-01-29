import fs from "fs"

const watchModule = (module) => {
	fs.watch(module.path, { encoding: "utf8" }, (eventType, filename) => {
		console.log(eventType, filename)
		if(filename) {
			console.log(filename)
		}
	})
}

const unwatchModule = (module) => {
	fs.unwatch(module.path)
}

export default {
	watchModule, unwatchModule
}