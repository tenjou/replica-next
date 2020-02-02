import fs from "fs"
import path from "path"
import os from "os"
import child_process from "child_process"

const escapeLiteral = (str) => {
	return str.replace(/\n/g, "\\n")
		.replace(/\t/g, "\\t")
		.replace(/\"/g, "\\\"") 
		.replace(/\'/g, "\\\"")    
}

const removeDir = (folderPath) => {
	if(!fs.existsSync(folderPath)) {
		return
	}

	fs.readdirSync(folderPath).forEach(
		(file, index) => {
			const currPath = folderPath + "/" + file
			if(fs.lstatSync(currPath).isDirectory()) { 
				removeDir(currPath)
			} 
			else {
				fs.unlinkSync(currPath)
			}
		})

	fs.rmdirSync(folderPath)
}

const copyFiles = (targetDir, srcDir, onDone, silent) => {
	const absoluteTargetDir = path.resolve(targetDir)
	const absoluteSrcDir = path.resolve(srcDir)

	let cmd
	switch(os.platform()) {
		case "win32":
			cmd = `xcopy "${absoluteSrcDir}" "${absoluteTargetDir}" /s /e`
			break
		case "darwin":
		case "linux":
			cmd = `cp -r "${absoluteSrcDir}" "${absoluteTargetDir}/*"`
			break	
	}

	child_process.exec(cmd, (error, stdout, stderr) => {
		if(error) {
			console.error(error)
		}
		else {
			if(!silent) {
				console.log(stdout)
			}
			if(onDone) {
				onDone()
			}
		}
	})
}

const createRelativeDir = (src) => {
	const slash = path.normalize("/")
	const relativeSrc = path.relative("./", src)
	const relativeBuffer = relativeSrc.split(slash)

	let currSrc = ""
	for(let n = 0; n < relativeBuffer.length; n++) {
		currSrc += relativeBuffer[n] + slash
		if(!fs.existsSync(currSrc)) {
			fs.mkdirSync(currSrc)

			for(n++; n < relativeBuffer.length; n++) {
				currSrc += relativeBuffer[n] + slash
				fs.mkdirSync(currSrc)
			}
		}
	}	
}

export default { 
	escapeLiteral, removeDir, copyFiles, createRelativeDir
}