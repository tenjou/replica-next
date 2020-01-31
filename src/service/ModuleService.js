import fs from "fs"
import path from "path"
import acorn from "acorn"
import Module from "../Module.js"

const modules = {}
const modulesLoaded = {}
const modulesBuffer = []
const rootModule = new Module("", null)
let nextModuleIndex = 0
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
		return scriptModule
	}

	if(!fs.existsSync(fullPath)) {
		console.log(`FileNotFound: ${fullPath}`)
	}
	const text = fs.readFileSync(fullPath, "utf8")
	const baseName = path.basename(fullPath)
	scriptModule = new Module(fullPath, baseName, extName)
	scriptModule.scope.parent = parentModule.scope
	scriptModule.importedModules.push(parentModule)
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

	scriptModule.index = nextModuleIndex++

	modulesBuffer.push(scriptModule)
	needModuleSort = true

	return scriptModule
}

const getModulesBuffer = () => {
	if(needModuleSort) {
		modulesBuffer.sort(sortModules)
		needModuleSort = false
	}
	return modulesBuffer
}

export default {
	add, compile, fetchModule, getModulesBuffer
}