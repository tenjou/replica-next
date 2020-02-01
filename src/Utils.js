
const escapeLiteral = (str) => {
	return str.replace(/\n/g, "\\n")
		.replace(/\t/g, "\\t")
		.replace(/\"/g, "\\\"") 
		.replace(/\'/g, "\\\"")    
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

	exec(cmd, (error, stdout, stderr) => {
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

export default { 
	escapeLiteral, copyFiles
}