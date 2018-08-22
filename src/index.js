import acorn from "../lib/acorn.es"
import Lexer from "./Lexer"
import Optimizer from "./Optimizer"
import CppCompiler from "./compiler/CppCompiler"
import Module from "./Module"

const modulesLoaded = {}

const fetchMethod = (rootModule, path, callback) => {
	fetch(path)
	.then(response => response.text())
	.then(text => {
		const node = acorn.parse(text, {
			sourceType: "module"
		})
		const module = new Module(path, node)
		modulesLoaded[path] = module

		Lexer.run(rootModule, module, node)
		Optimizer.run(node)
		callback(module)
	})
}

export default function main() {
	const rootModule = new Module()
	Lexer.setFetchMethod(fetchMethod)
	fetchMethod(rootModule, "data/index.js", (module) => {
		CppCompiler.run(module)
	})
}