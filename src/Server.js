import http from "http"
import url from "url"
import path from "path"
import fs from "fs"
import ws from "ws"
import LoggerService from "./service/LoggerService.js"
import mime from "./Mime.js"

let httpServer = null
let httpServerPort = -1
let wsServer = null
let wsServerPort = -1
let indexFilename = "index.html"

const start = async (httpPort, wsPort) => {
	await startHttpServer(httpPort)
	await tryStartWsServer(wsPort)
	LoggerService.logMagenta("Server", `http://127.0.0.1:${httpServerPort}`)
}

const respond404 = (response) => {
	response.writeHeader(404, { "Content-Type": "text/plain" })
	response.write("404 Not Found\n")
	response.end()
}

const startHttpServer = (port) => {
	httpServer = http.createServer((request, response) => {
		const uri = url.parse(request.url).pathname
		let filename = path.join(process.cwd(), uri)

		fs.exists(filename, (exists) => {
			if(!exists) {
				respond404(response)
				return
			}

			if(fs.statSync(filename).isDirectory()) {
				filename = path.join(filename, indexFilename)
			}

			fs.readFile(filename, "binary", (error, file) => {
				if(error) {
					response.writeHeader(500, { "Content-Type": "text/plain" })
					response.write(error + "\n")
					response.end()
					return
				}

				response.writeHead(200, { "Content-Type": mime(filename) })
				response.write(file, "binary")
				response.end()
			})
		})
	})

	const promise = new Promise((resolve, reject) => {
		httpServer.on("listening", () => {
			httpServerPort = httpServer.address().port
			resolve()
		})	
	})

	httpServer.listen(port || 0)
	return promise
}

const tryStartWsServer = async (port) => {
	if(!port) {
		port = await getRandomPort()
	}
	await startWsServer(port)
}

const startWsServer = (port) => {
	wsServerPort = port
	wsServer = new ws.Server({ port })

	const promise = new Promise((resolve, reject) => {
		wsServer.on("listening", () => {
			resolve()
		})
	})

	return promise
}

const reload = () => {
	wsServer.clients.forEach((client) => {
		client.send(JSON.stringify({ type: "reload" }))
	})
}

const getHttpPort = () => {
	return httpServerPort
}

const getWsPort = () => {
	return wsServerPort
}

const setIndexFilename = (filename) => {
	indexFilename = filename
}

const getRandomPort = async () => {
	const tempServer = http.createServer()

	const promise = new Promise((resolve, reject) => {
		tempServer.on("listening", () => {
			const port = tempServer.address().port
			tempServer.close()
			resolve(port)
		})
	})
	tempServer.listen(0)

	return promise
}

export default {
	start, reload, getHttpPort, getWsPort, setIndexFilename
}
