import fs from "fs"
import path from "path"
import acorn from "acorn"
import Module from "../Module.js"
import WatcherService from "./WatcherService.js"

const modules = {}
const modulesLoaded = {}
const rootModule = new Module("", null)
let entryModule = null
let modulesImported = []
let modulesImportedPrev = []
let tNeedImportUpdate = 0
let tNeedImportUpdatePrev = -1

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

	tNeedImportUpdate = Date.now()

	let scriptModule = modulesLoaded[fullPath]
	if(scriptModule) {
		parentModule.importedModules.push(scriptModule)
		return scriptModule
	}

	if(!fs.existsSync(fullPath)) {
		console.log(`FileNotFound: ${fullPath}`)
	}

	const baseName = path.basename(fullPath)
	scriptModule = new Module(fullPath, baseName, extName)
	scriptModule.scope.parent = parentModule.scope
	parentModule.importedModules.push(scriptModule)
	modulesLoaded[fullPath] = scriptModule

	updateModule(scriptModule)

	WatcherService.watchModule(scriptModule)

	return scriptModule
}

const updateModule = (module) => {
	const text = fs.readFileSync(module.path, "utf8")
	switch(module.ext) {
		case ".js": {
			const node = acorn.parse(text, { sourceType: "module" })
			module.data = node
			module.output = null
		} break

		default:
			module.data = null
			module.output = text
			break
	}
}

const indexImports = (module, lastIndex = 0) => {
	for(let n = 0; n < module.importedModules.length; n++) {
		const importedModule = module.importedModules[n]
		if(importedModule.tImported !== tNeedImportUpdate) {
			lastIndex = indexImports(importedModule, lastIndex)
		}
	}

	module.index = lastIndex++
	module.tImported = tNeedImportUpdate
	modulesImported.push(module)

	return lastIndex
}

const getModulesBuffer = () => {
	if(tNeedImportUpdate !== tNeedImportUpdatePrev) {
		tNeedImportUpdatePrev = tNeedImportUpdate

		let tmpBuffer = modulesImported
		modulesImported = modulesImportedPrev
		modulesImported.length = 0
		modulesImportedPrev = tmpBuffer
	
		indexImports(entryModule)
	}

	return modulesImported
}

const setEntryModule = (module) => {
	entryModule = module
}

export default {
	add, fetchModule, updateModule, getModulesBuffer, setEntryModule
}