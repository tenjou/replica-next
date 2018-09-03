import Matrix4 from "./math/Matrix4"

let matrixProjection = new Matrix4()
let matrixModelView = new Matrix4()
let canvas = null
let gl = null

const create = () => {
	canvas = document.createElement("canvas")
	gl = canvas.getContext("webgl")
	if(!gl) {
		console.error("Unable to initialize WebGL. Your browser or machine may not support it.")
		return
	}

	setupWebGL()
}

const setupWebGL = () => {
	gl.clearColor(0.0, 0.0, 0.0, 1.0)
	gl.clearDepth(1.0)
	gl.enable(gl.DEPTH_TEST)
	gl.depthFunc(gl.LEQUAL)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
}

create()