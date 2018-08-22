import acorn from "../lib/acorn.es"
import Lexer from "./Lexer"
import Optimizer from "./Optimizer"
import CppCompiler from "./compiler/CppCompiler"
import Module from "./Module"

const modulesLoaded = {}

const fetchMethod = (rootModule, path) => {
	let module = null
	let node = null

	const { fullPath, ext } = resolvePath(rootModule.path, path)
	module = modules[fullPath]
	if(module) {
		return Promise.resolve(module)
	}

	return fetch(fullPath)
		.then(response => response.text())
		.then(text => {
			module = new Module(fullPath, ext, text)
			modulesLoaded[fullPath] = module

			switch(ext) {
				case "js":
					node = acorn.parse(text, { sourceType: "module" })
					return Promise.resolve()
						.then(() => { return Lexer.run(rootModule, module, node); })
						.then(() => { Optimizer.run(node) })
			}
		})
}

const resolvePath = (base, relative) => {
	const stack = base.split("/")
	const parts = relative.split("/")
	stack.pop()

	let ext = getExt(parts[parts.length - 1])
	if(!ext) {
		ext = "js"
		parts[parts.length - 1] += ".js"
	}

	for(let n = 0; n < parts.length; n++) {
		if(parts[n] === ".") {
			continue
		}
		if(parts[n] === "..") {
			stack.pop()
		}
		else {
			stack.push(parts[n])
		}
	}
	return { fullPath: stack.join("/"), ext }
}

const getExt = (filename) => {
	const index = filename.lastIndexOf(".")
	if(index === -1) { 
		return null
	}
	return filename.slice(index + 1)
}

export default function main() {
	const rootModule = new Module("", null)
	Lexer.setFetchMethod(fetchMethod)
	fetchMethod(rootModule, "data/index.js", (module) => {
		CppCompiler.run(module)
	})
}