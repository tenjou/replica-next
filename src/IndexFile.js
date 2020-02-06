import fs from "fs"
import path from "path"
import ModuleService from "./service/ModuleService.js"
import ProjectService from "./service/ProjectService.js"
import CliService from "./service/CliService.js"
import Server from "./Server.js"

const prefixStart = "<!-- REPLICA_START -->"
const prefixEnd = "<!-- REPLICA_END -->"

class IndexFile {
	constructor(fullPath, targetPath) {
		this.contentStart = null
		this.contentEnd = null
		this._content = null
		this.updating = false
		this.loaded = false

		this.fullPath = fullPath
		this.targetPath = targetPath
		this.targetDir = path.dirname(targetPath)
		this.timestamp = ""

		this.update()
	}

	update() {
		this.content = fs.readFileSync(this.fullPath, "utf8")
	}

	updateScripts() {
		if(!this.loaded) {
			return
		}

		const buildPath = path.relative(this.targetDir, ProjectService.getBuildPath()) + path.normalize("/")
		let content = this.contentStart

		if(CliService.flags.server) {
			content += `<script>window.REPLICA_SERVER_PORT = ${Server.getWsPort()}</script>\n`
		}

		if(CliService.flags.concat) {
			const buildFilePath = path.relative(this.targetPath, ProjectService.getBuildFilePath())
			
			if(CliService.flags.timestamp) {
				content += `<script src="${buildFilePath}?${Date.now()}"></script>\n`
			}
			else {
				content += `<script src="${buildFilePath}"></script>\n`
			}
		}
		else {
			const modules = ModuleService.getModulesBuffer()

			content += `<script src="${buildPath}replica.js"></script>\n`
			
			if(CliService.flags.timestamp) {
				for(let n = 0; n < modules.length; n++) {
					const module = modules[n]
					if(!module.output) { 
						continue 
					}
					content += `<script src="${buildPath}${module.name}.${module.index}.js?${Date.now()}"></script>\n`
				}
			}
			else {
				for(let n = 0; n < modules.length; n++) {
					const module = modules[n]
					if(!module.output) { 
						continue 
					}
					content += `<script src="${buildPath}${module.name}.${module.index}.js"></script>\n`
				}
			}

			if(CliService.flags.server) {
				content += `<script src="${buildPath}replica_server.js"></script>\n`
			}			
		}

		content += this.contentEnd
		this.updating = true

		fs.writeFileSync(this.targetPath, content, "utf8")
	}

	set content(content) {
		this.loaded = false

		const headEndIndex = content.indexOf("</head>")
		if(headEndIndex === -1) {
			return console.error("IndexFile: Could not find <head> ending.")
		}

		let index = content.indexOf(prefixStart)
		if(index === -1) {
			this.contentStart = content.slice(0, headEndIndex)
			let newlineIndex = this.contentStart.lastIndexOf("\n")
			let spaces = this.contentStart.slice(newlineIndex)
			this.contentStart = this.contentStart.slice(0, newlineIndex + 1)
			this.contentStart += `${prefixStart}\n`
			this.contentEnd = prefixEnd + spaces
			this.contentEnd += content.slice(headEndIndex)
		}
		else {
			this.contentStart = content.slice(0, index + prefixStart.length) + "\n"

			index = content.indexOf(prefixEnd)
			if(index === -1) {
				let newlineIndex = this.contentStart.lastIndexOf("\n")
				let spaces = this.contentStart.slice(newlineIndex)
				this.contentEnd = prefixEnd + spaces
				this.contentEnd += content.slice(headEndIndex)
			}
			else {
				this.contentEnd = content.slice(index)
			}
		}

		this.loaded = true
	}

	get content() {
		return this._content
	}
}

export default IndexFile