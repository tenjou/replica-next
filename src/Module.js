import Scope from "./Scope.js"

class Module {
	constructor(path, name, ext = null) {
		this.path = path
		this.name = name
		this.ext = ext
		this.data = null
		this.text = null
		this.importedModules = []
		this.analysed = false
		this.tImported = -1
		this.index = -1
		this.scope = new Scope()
		this.watcher = null
	}
}

export default Module