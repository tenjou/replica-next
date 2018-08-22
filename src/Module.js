import State from "./State"

class Module {
	constructor(path, ext, node) {
		this.path = path
		this.ext = ext
		this.node = node
		this.state = new State()
	}
}

export default Module