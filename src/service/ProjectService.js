import fs from "fs"
import path from "path"
import UglifyJS from "uglify-es"
import CliService from "./CliService.js"
import ModuleService from "./ModuleService.js"
import LoggerService from "./LoggerService.js"
import Utils from "../Utils.js"

let buildFilename = "./build.js"
let defaultBuildPath = "build/"
let buildPath = defaultBuildPath
let buildFilePath = path.resolve("./", buildFilename)
let replicaLibPath = ""

const resolve = (__dirname) => {
	buildPath = path.resolve(defaultBuildPath) + path.normalize("/")
	buildFilePath = path.resolve("./", buildFilename)
	replicaLibPath = path.resolve(`${__dirname}/../lib/js/`)
	
	Utils.removeDir(buildPath)
	
	if(!CliService.flags.concat) {
		Utils.createRelativeDir(buildPath)
		fs.copyFileSync(`${replicaLibPath}/replica.js`, `${buildPath}/replica.js`)
		if(CliService.flags.server) {
			fs.copyFileSync(`${replicaLibPath}/replica_server.js`, `${buildPath}/replica_server.js`)
		}
	}
}

const concatFiles = () => {
	let output = fs.readFileSync(`${replicaLibPath}/replica.js`, "utf8")
	if(CliService.flags.server) {
		output += "\n" + fs.readFileSync(`${replicaLibPath}/replica_server.js`, "utf8") + "\n\n"
	}

	const modules = ModuleService.getModulesBuffer()
	for(let n = 0; n < modules.length; n++) {
		const module = modules[n]
		if(module.output) {
			output += `${module.output}\n\n`
		}
	}	

	if(CliService.flags.uglify) {
		LoggerService.logMagenta("Uglifing")
		try {
			const minifyResult = UglifyJS.minify(output, {
				warnings: true
			})
			fs.writeFileSync(buildFilePath, minifyResult.code, "utf8")
		}
		catch(error) {
			LoggerService.logError("Minify", error)
		}
	}
	else {
		fs.writeFileSync(buildFilePath, output, "utf8")
	}

	return output
}

const setBuildFilename = (filename = "build.js") => {
	buildFilename = filename
}

const getBuildPath = () => {
	return buildPath
}

const getBuildFilePath = () => {
	return buildFilePath
}

export default {
	resolve,
	concatFiles,
	setBuildFilename, getBuildPath, getBuildFilePath
}