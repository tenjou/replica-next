import Scope from "./Scope.js"

class Module {
	constructor(path, name, ext = null) {
		this.path = path
		this.name = name
		this.ext = ext
		this.data = null
		this.importedModules = []
		this.analysed = false
		this.tNeedImportUpdate = -1
		this.index = -1
		this.scope = new Scope()
		this.watcher = null
	}
}

export default Module