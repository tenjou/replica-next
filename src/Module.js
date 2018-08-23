import Scope from "./Scope"

class Module {
	constructor(path, ext) {
		this.path = path
		this.ext = ext
		this.data = null
		this.importedModules = []
		this.scope = new Scope()
	}
}

export default Module