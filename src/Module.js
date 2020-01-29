import Scope from "./Scope.js"

class Module {
	constructor(path, name, ext = null, index = -1) {
		this.path = path
		this.name = name
		this.ext = ext
		this.index = index
		this.data = null
		this.importedModules = []
		this.scope = new Scope()
	}
}

export default Module