import acorn from "acorn"
import fs from "fs"
import path from "path"
import Module from "./Module.js"
import StaticAnalyser from "./StaticAnalyser.js"
import Optimizer from "./Optimizer.js"
import Extern from "./Extern.js"
import CppCompiler from "./compiler/CppCompiler.js"
import JsCompiler from "./compiler/JsCompiler.js"
import CliService from "./services/CliService.js"
import WatcherService from "./services/WatcherService.js"

const packageData = JSON.parse(fs.readFileSync("./package.json"))
const modules = {}
const modulesLoaded = {}
let nextModuleIndex = 0

const rootModule = new Module("", null)
// Extern.declareStd(rootModule)

const fetchMethod = (rootModule, parentModule, importPath) => {
	let fullPath = null
	let isLocal = (importPath.charAt(0) === ".")
	let extName = path.extname(importPath)
	
	if(!isLocal && !extName) {
		fullPath = modules[importPath]
		if(!fullPath) {
			console.log(`ModuleNotFound: ${importPath}`)
			return null
		}
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
	const baseName = path.basename(importPath)
	scriptModule = new Module(fullPath, baseName, extName, nextModuleIndex++)
	scriptModule.scope.parent = parentModule.scope
	scriptModule.importedModules.push(parentModule)
	modulesLoaded[fullPath] = scriptModule

	switch(extName) {
		case ".js": {
			const node = acorn.parse(text, { sourceType: "module" })
			scriptModule.data = node
			StaticAnalyser.run(rootModule, scriptModule, node) 
			Optimizer.run(node) 
		} break

		default:
			scriptModule.data = null
			scriptModule.output = text
			break
	}

	return scriptModule
}

const compile = (inputFile, options = {}) => {
	StaticAnalyser.setFetchMethod(fetchMethod)

	const module = fetchMethod(rootModule, rootModule, inputFile)
	switch(options.compiler) {
		case "cpp":
			return CppCompiler.run(module, rootModule.scope)
		case "js":
		default:
			return JsCompiler.run(module, rootModule.scope)
	}	
}

const run = (file) => {
	compile(file, {
		output: "js"
	})

	const buildPath = "./build"
	if(!fs.existsSync(buildPath)) {
		fs.mkdirSync(buildPath)
	}
	for(let moduleId in modulesLoaded) {
		const fileModule = modulesLoaded[moduleId]
		fs.writeFileSync(`${buildPath}/${fileModule.index}.${fileModule.name}`, fileModule.output, "utf8")
		WatcherService.watchModule(fileModule)
	}
}

const addIndex = (src) => {
	console.log(src)
}

const setBuildDir = (path) => {

}

const addModule = (modulePath, moduleName = null) => {
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

const makeProject = (dir, template) => {

}

const printVersion = () => {
	console.log(`${packageData.name} ${packageData.version}v`)
}

try {
	process.argv = [ 'C:\\Program Files\\nodejs\\node.exe',
		'C:\\workspace\\projects\\meta\\replica\\src\\replica.js',
		'../meta-cms/src/index.js',
		'-i', 'data/index.html', 
		"-m", "../../libs/wabi",
		"-u"
	]	

	const cli = CliService.create()
	cli.setName(packageData.name)
		.setVersion(packageData.version)
		.setDescription(packageData.description)
		.addOption("-i, --index <file>", "Add output index file", addIndex)
		.addOption("-t, --timestamp", "Add timestamps to output files")
		.addOption("-w, --watch", "Look after file changes in set input folders")
		.addOption("-u, --uglify", "Specify that concatenated file should be minified, activates --concat")
		.addOption("-c, --concat [file]", "Concat all files into one")
		.addOption("-s, --server [httpPort] [wsPort]", "Launch development server, activates --watch")
		.addOption("-b, --build <dir>", "Specify build directory", setBuildDir)
		.addOption("-m, --module <dir> [name]", "Add custom module", addModule)
		.addOption("-si, --silent", "Silent mode")
		.addCommand("make <dir> [template]", "Create and prepare an empty project", makeProject)
		.addCommand("v", "\t\tPrints current version", printVersion)
		.parse(process.argv, run)
}
catch(error) {

}

process.on("unhandledRejection", error => {
	console.log(error)
})
process.on("uncaughtException", error => {
	console.log(error)
})
