import fs from "fs"
import path from "path"
import acorn from "acorn"
import Module from "../Module.js"
import WatcherService from "./WatcherService.js"

const modules = {}
const modulesLoaded = {}
const modulesBuffer = []
const rootModule = new Module("", null)
let needModuleSort = false

const sortModules = (a, b) => {
	return a.index - b.index
}

const add = (modulePath, moduleName) => {
	const fullPath = path.resolve("", modulePath)
	if(!fs.existsSync(fullPath)) {
		console.log("ModuleNotFound")
	}
	const packagePath = path.resolve("", `${modulePath}/package.json`)
	if(!moduleName) {
		moduleName = path.basename(modulePath)
	}
	const modulePackageData = JSON.parse(fs.readFileSync(packagePath, "utf8"))
	const moduleFilePath = `${fullPath}/${modulePackageData.main}`

	modules[moduleName] = moduleFilePath
}

const compile = (module) => {

}

const fetchModule = (importPath, parentModule = null) => {
	if(!parentModule) {
		parentModule = rootModule
	}

	let fullPath = null
	let isLocal = (importPath.charAt(0) === ".")
	let extName = path.extname(importPath)
	
	if(!isLocal && !extName) {
		fullPath = modules[importPath]
		if(!fullPath) {
			console.log(`ModuleNotFound: ${importPath}`)
			return null
		}
		extName = ".js"
	}
	else {
		if(!extName) {
			extName = ".js"
			importPath += extName
		}
		const parentFolderPath = path.dirname(parentModule.path)
		fullPath = path.resolve(parentFolderPath, importPath)	
	}

	let scriptModule = modulesLoaded[fullPath]
	if(scriptModule) {
		parentModule.importedModules.push(scriptModule)
		return scriptModule
	}

	if(!fs.existsSync(fullPath)) {
		console.log(`FileNotFound: ${fullPath}`)
	}
	const text = fs.readFileSync(fullPath, "utf8")
	const baseName = path.basename(fullPath)
	scriptModule = new Module(fullPath, baseName, extName)
	scriptModule.scope.parent = parentModule.scope
	parentModule.importedModules.push(scriptModule)
	modulesLoaded[fullPath] = scriptModule

	switch(extName) {
		case ".js": {
			const node = acorn.parse(text, { sourceType: "module" })
			scriptModule.data = node
			scriptModule.output = null
		} break

		default:
			scriptModule.data = null
			scriptModule.output = text
			break
	}

	modulesBuffer.push(scriptModule)
	WatcherService.watchModule(scriptModule)
	needModuleSort = true

	return scriptModule
}

const indexImports = (module, moduleIndex) => {
	for(let n = 0; n < module.importedModules.length; n++) {
		const importedModule = module.importedModules[n]
		if(importedModule.index === -1) {
			moduleIndex = indexImports(importedModule, moduleIndex)
		}
	}
	module.index = moduleIndex++
	return moduleIndex
}

const getModulesBuffer = () => {
	if(needModuleSort) {
		for(let n = 0; n < modulesBuffer.length; n++) {
			const module = modulesBuffer[n]
			module.index = -1
		}

		const entryModule = modulesBuffer[0]
		indexImports(entryModule, 0)

		modulesBuffer.sort(sortModules)
		needModuleSort = false
	}
	return modulesBuffer
}

export default {
	add, compile, fetchModule, getModulesBuffer
}