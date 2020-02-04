import fs from "fs"
import path from "path"
import url from "url"
import child_process from "child_process"
import CppCompiler from "./compiler/CppCompiler.js"
import JsCompiler from "./compiler/JsCompiler.js"
import CliService from "./service/CliService.js"
import LoggerService from "./service/LoggerService.js"
import WatcherService from "./service/WatcherService.js"
import ModuleService from "./service/ModuleService.js"
import ProjectService from "./service/ProjectService.js"
import Module from "./Module.js"
import StaticAnalyser from "./StaticAnalyser.js"
import Optimizer from "./Optimizer.js"
import Extern from "./Extern.js"
import IndexFile from "./IndexFile.js"
import Server from "./Server.js"
import Utils from "./Utils.js"

const __filename = url.fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const packagePath = path.resolve(__dirname, "../package.json")
const packageData = JSON.parse(fs.readFileSync(packagePath))

let modulesChanged = {}
const indexFiles = {}
const indexChanged = {}
let needUpdateModules = false
let needUpdateIndex = true
let compiler = null

// Extern.declareStd(rootModule)

const compile = (inputFile) => {
	ModuleService.setHandler((type, module) => {
		switch(type) {
			case "load": {
				if(CliService.flags.watch) {
					WatcherService.watchModule(module)
				}
				LoggerService.logGreen("Load", module.path)
			} break

			case "unload": {
				if(CliService.flags.watch) {
					WatcherService.unwatchModule(module)
				}
				LoggerService.logGreen("Unload", module.path)
			} break
		}
	})

	const module = ModuleService.fetchModule(inputFile)
	ModuleService.setEntryModule(module)
	StaticAnalyser.run(module)
	ModuleService.updateImports()
	compiler.run(module)

	if(CliService.flags.concat) {
		ProjectService.concatFiles()
	}
	else {
		const buildPath = ProjectService.getBuildPath()
		const modules = ModuleService.getModulesBuffer()
		for(let n = 0; n < modules.length; n++) {
			const module = modules[n]
			const filePath = `${buildPath}/${module.name}.${module.index}.js`
			fs.writeFileSync(filePath, module.output, "utf8")
		}
	}
}

const run = async (inputFile) => {
	if(CliService.flags.uglify) {
		CliService.flags.concat = {}
	}

	ProjectService.resolve(__dirname)

	const options = {
		output: "js"
	}

	switch(options.compiler) {
		case "cpp":
			compiler = CppCompiler
			break
		case "js":
		default:
			compiler = JsCompiler
			break
	}

	compile(inputFile)

	if(CliService.flags.server) {
		CliService.flags.watch = CliService.flags.watch || {}
		await Server.start(CliService.flags.server.httpPort, CliService.flags.server.wsPort)
		start()
	}
	else {
		start()
	}
}

const start = () => {
	if(CliService.flags.watch) {
		for(let fullPath in indexFiles) {
			const file = indexFiles[fullPath]
			WatcherService.watchFile(file)
		}

		WatcherService.setListener(handleWatcherChange)
	}

	if(CliService.flags.watch) {
		setInterval(update, 100)
	}
	else {
		update()
	}
}

const update = () => {
	const contentUpdated = (needUpdateIndex || needUpdateModules)

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

		ModuleService.updateImports()

		if(CliService.flags.concat) {
			for(let fullPath in modulesChanged) {
				const module = modulesChanged[fullPath]
				compiler.run(module)
			}

			ProjectService.concatFiles()
		}
		else {		
			const buildPath = ProjectService.getBuildPath()
			for(let fullPath in modulesChanged) {
				const module = modulesChanged[fullPath]
				compiler.run(module)
				fs.writeFileSync(`${buildPath}/${module.name}.${module.index}.js`, module.output, "utf8")
			}
		}

		modulesChanged = {}
		needUpdateModules = false
	}

	if(contentUpdated) {
		for(let fullPath in indexFiles) {
			const file = indexFiles[fullPath]
			file.updateScripts()
		}
		if(CliService.flags.server) {
			Server.reload()
		}
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
		throw `No such index file found at: ${srcPath}`
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
	buildPath = path
}

const addModule = (modulePath, moduleName = null) => {
	ModuleService.addCustomModule(modulePath, moduleName)
}

const makeProject = (dir, template) => {
	template = template || "default"

	const exists = fs.existsSync(dir)
	if(exists) {
		return LoggerService.logError("Make", `Directory is not empty: ${dir}`)
	}

	const templatePath = path.resolve(__dirname, `../template/${template}`)
	const templateExists = fs.existsSync(templatePath)
	if(!templateExists) {
		return LoggerService.logError("Make", `Requested template does not exists: ${template}`)
	}

	fs.mkdirSync(dir)

	Utils.copyFiles(dir, templatePath, () => {
		console.log("Installing dependencies...\n")
		child_process.exec(`cd ${dir} && npm i`, (error, stdout, stderr) => {
			if(error) {
				console.error(error)
			}
			else {
				console.log(stdout)
				LoggerService.logGreen("Ready")
			}
		})
	})
}

const setConcatFile = (filename) => {
	ProjectService.setBuildFilename(filename)
}

const printVersion = () => {
	console.log(`${packageData.name} ${packageData.version}v`)
}

try {
	CliService.setName(packageData.name)
		.setVersion(packageData.version)
		.setDescription(packageData.description)
		.addOption("-i, --index <src> [target]", "Add output index file", addIndex)
		.addOption("-t, --timestamp", "Add timestamps to output files")
		.addOption("-w, --watch", "Look after file changes in set input folders")
		.addOption("-u, --uglify", "Specify that concatenated file should be minified, activates --concat")
		.addOption("-c, --concat [file]", "Concat all files into one", setConcatFile)
		.addOption("-s, --server [httpPort] [wsPort]", "Launch development server, activates --watch")
		.addOption("-b, --build <dir>", "Specify build directory", setBuildDir)
		.addOption("-m, --module <dir> [name]", "Add custom module", addModule)
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
