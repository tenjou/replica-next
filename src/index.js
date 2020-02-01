import fs from "fs"
import path from "path"
import CppCompiler from "./compiler/CppCompiler.js"
import JsCompiler from "./compiler/JsCompiler.js"
import CliService from "./service/CliService.js"
import LoggerService from "./service/LoggerService.js"
import WatcherService from "./service/WatcherService.js"
import ModuleService from "./service/ModuleService.js"
import Module from "./Module.js"
import StaticAnalyser from "./StaticAnalyser.js"
import Optimizer from "./Optimizer.js"
import Extern from "./Extern.js"
import IndexFile from "./IndexFile.js"
import Utils from "./Utils"

const packageData = JSON.parse(fs.readFileSync("./package.json"))
const modulesChanged = {}
const indexFiles = {}
const indexChanged = {}
let needUpdateModules = false
let needUpdateIndex = false

// Extern.declareStd(rootModule)

const compile = (inputFile, options = {}) => {
	const module = ModuleService.fetchModule(inputFile)
	ModuleService.setEntryModule(module)
	StaticAnalyser.run(module)

	switch(options.compiler) {
		case "cpp":
			CppCompiler.run(module)
			break
		case "js":
		default:
			JsCompiler.run(module)
			break
	}
}

const run = (file) => {
	compile(file, {
		output: "js",
		custom: true
	})

	const buildPath = "./build"
	if(!fs.existsSync(buildPath)) {
		fs.mkdirSync(buildPath)
	}

	const modulesBuffer = ModuleService.getModulesBuffer()
	for(let n = 0; n < modulesBuffer.length; n++) {
		const fileModule = modulesBuffer[n]
		fs.writeFileSync(`${buildPath}/${fileModule.name}.${fileModule.index}${fileModule.ext}`, fileModule.output, "utf8")
	}

	for(let fullPath in indexFiles) {
		const file = indexFiles[fullPath]
		file.updateScripts()
		WatcherService.watchFile(file)
	}
	WatcherService.setListener(handleWatcherChange)

	setInterval(update, 100)
}

const update = () => {
	if(needUpdateIndex) {
		for(let fullPath in indexChanged) {
			const file = indexChanged[fullPath]
			file.update()
			LoggerService.logYellow("Update", file.fullPath)
		}
		needUpdateIndex = false
	}

	if(needUpdateModules) {
		for(let fullPath in modulesChanged) {
			const module = modulesChanged[fullPath]
			ModuleService.updateModule(module)
			StaticAnalyser.run(module)
			LoggerService.logYellow("Update", module.path)
		}
		for(let fullPath in indexFiles) {
			const file = indexFiles[fullPath]
			file.updateScripts()
		}
		needUpdateModules = false
	}
}

const handleWatcherChange = (eventType, instance) => {
	switch(eventType) {
		case "change": {
			if(instance instanceof Module) {
				modulesChanged[instance.path] = instance
				needUpdateModules = true
			}
			else if(instance instanceof IndexFile) {
				indexChanged[instance.fullPath] = instance
				needUpdateIndex = true
			}
		} break
	}
} 

const addIndex = (srcPath, targetPath = null) => {
	const fileExist = fs.existsSync(srcPath)
	if(!fileExist) {
		return console.warn("\x1b[91m", "No such index file found at: " + srcPath, "\x1b[0m");
	}

	srcPath = path.resolve(srcPath)
	if(!targetPath) {
		targetPath = srcPath
	}
	else {
		targetPath = path.resolve(targetPath)
	}

	const indexFile = new IndexFile(srcPath, targetPath)
	indexFiles[srcPath] = indexFile

	LoggerService.logGreen("IndexFile", srcPath)
}

const setBuildDir = (path) => {

}

const addModule = (modulePath, moduleName = null) => {
	ModuleService.addCustomModule(modulePath, moduleName)
}

const makeProject = (dir, template) => {
	template = template || "default"

	const exists = fs.existsSync(dir)
	if(exists) {
		return utils.logError("Make", `Directory is not empty: ${dir}`)
	}

	const templatePath = path.normalize(`${__dirname}/../templates/${template}`)
	const templateExists = fs.existsSync(templatePath)
	if(!templateExists) {
		return utils.logError("Make", `Requested template does not exists: ${template}`)
	}

	fs.mkdirSync(dir)

	Utils.copyFiles(dir, templatePath, () => {
		console.log("Installing dependencies...\n")
		exec(`cd ${dir} && npm i`, (error, stdout, stderr) => {
			if(error) {
				console.error(error)
			}
			else {
				console.log(stdout)
				utils.logGreen("Ready")
			}
		})
	})
}

const printVersion = () => {
	console.log(`${packageData.name} ${packageData.version}v`)
}

try {
	// process.argv = [ '',
	// 	'',
	// 	'../meta-cms/src/index.js',
	// 	'-i', '../meta-cms/index.html', '../meta-cms/index2.html', 
	// 	"-m", "../../libs/wabi",
	// 	"-u"
	// ]	

	CliService.setName(packageData.name)
		.setVersion(packageData.version)
		.setDescription(packageData.description)
		.addOption("-i, --index <src> [target]", "Add output index file", addIndex)
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
	console.log(error)
}

process.on("unhandledRejection", error => {
	console.log(error)
})
process.on("uncaughtException", error => {
	console.log(error)
})
