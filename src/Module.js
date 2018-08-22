import State from "./State"

class Module {
	constructor(path, node) {
		this.path = path
		this.node = node
		this.state = new State()
	}
}

export default Module