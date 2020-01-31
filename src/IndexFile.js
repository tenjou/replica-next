import fs from "fs"
import path from "path"
import ModuleService from "./service/ModuleService.js"
import CliService from "./service/CliService.js"

const prefixStart = "<!-- REPLICA_START -->"
const prefixEnd = "<!-- REPLICA_END -->"

class IndexFile {
	constructor(fullPath) {
		this.contentStart = null
		this.contentEnd = null
		this._content = null
		this.updating = false
		this.loaded = false

		this.fullPath = fullPath
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

		let content = this.contentStart

		if(CliService.flags.concat) {
			let timestamp = ""
			if(cli.flags.timestamp) {
				timestamp = "?" + Date.now()
			}

			const src = path.relative(this.fullPath + "/", packageSrc)
			content += `<script src="${src}${timestamp}"></script>\n`

			if(cli.flags.server) {
				const src = path.relative(this.fullPath, buildSrc) + path.normalize("/")
				// content += `<script>window.REPLICA_SERVER_PORT = ${server.getHttpPort()};</script>\n`
				content += `<script src="${src}replica.js"></script>\n`
			}
		}
		else {
			const modules = ModuleService.getModulesBuffer()
			const buildSrc = "./build"
			const src = path.relative(this.fullPath, buildSrc) + path.normalize("/")

			if(CliService.flags.timestamp) {
				let timestamp
				for(let n = 0; n < modules.length; n++) {
					const file = modules[n]
					if(!file.blockNode) { 
						continue 
					}

					timestamp = "?" + Date.now()
					content += `<script src="${src}${file.filename}.${file.id}.js${timestamp}"></script>\n`
				}
			}
			else {
				for(let n = 0; n < modules.length; n++) {
					const module = modules[n]
					if(!module.data) { 
						continue 
					}
					content += `<script src="${src}${module.name}.${module.index}.js"></script>\n`
				}
			}

			if(CliService.flags.server) {
				content += `<script>window.REPLICA_SERVER_PORT = ${server.getWsPort()};</script>\n`
				content += `<script src="${src}replica.js"></script>\n`
			}
		}

		content += this.contentEnd
		this.updating = true

		fs.writeFileSync(this.fullPath, content, "utf8")
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