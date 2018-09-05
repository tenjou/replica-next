import acorn from "../lib/acorn.es"
import StaticAnalyser from "./StaticAnalyser"
import Optimizer from "./Optimizer"
import CppCompiler from "./compiler/CppCompiler"
import Module from "./Module"
import Extern from "./Extern"

const modulesLoaded = {}

const fetchMethod = (rootModule, parentModule, path, isMain) => {
	let module = null
	let node = null

	const { fullPath, ext } = resolvePath(parentModule.path, path)
	module = modules[fullPath]
	if(module) {
		return Promise.resolve(module)
	}

	return fetch(fullPath)
		.then(response => response.text())
		.then(text => {
			module = new Module(fullPath, ext)
			module.scope.parent = parentModule.scope
			module.importedModules.push(parentModule)
			modulesLoaded[fullPath] = module

			switch(ext) {
				case "js":
					node = acorn.parse(text, { sourceType: "module" })
					module.data = node
					return Promise.resolve()
						.then(() => { return StaticAnalyser.run(rootModule, module, node); })
						.then(() => { Optimizer.run(node) })
				default:
					module.data = text
					break
			}
		})
		.then(() => {
			return module
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
	Extern.declareStd(rootModule)
	StaticAnalyser.setFetchMethod(fetchMethod)
	fetchMethod(rootModule, rootModule, "data/index3.js")
	.then((module) => {
		const output = CppCompiler.run(module, rootModule.scope)
		console.log(output)
	})
}