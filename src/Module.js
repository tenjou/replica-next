import Scope from "./Scope"

class Module {
	constructor(path, ext, node) {
		this.path = path
		this.ext = ext
		this.node = node
		this.importedModules = []
		this.scope = new Scope()
	}
}

export default Module