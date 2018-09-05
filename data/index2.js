import Matrix4 from "./math/Matrix4"
import basicVS from "./shaders/sprite.vertex.glsl"
import basicFS from "./shaders/sprite.fragment.glsl"

let matrixProjection = new Matrix4()
let matrixModelView = new Matrix4()
let canvas = null
let gl = null
let programInfo = null

const create = () => {
	canvas = document.createElement("canvas")
	gl = canvas.getContext("webgl")
	if(!gl) {
		console.error("Unable to initialize WebGL. Your browser or machine may not support it.")
		return
	}

	setupWebGL()
	initShaderProgram(basicVS, basicFS)
}

const setupWebGL = () => {
	gl.clearColor(0.0, 0.0, 0.0, 1.0)
	gl.clearDepth(1.0)
	gl.enable(gl.DEPTH_TEST)
	gl.depthFunc(gl.LEQUAL)
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.viewport(0, 0, canvas.clientWidth, canvas.clientHeight)
}

const initShaderProgram = (vsSource, fsSource) => {
	const vertexShader = loadShader(gl.VERTEX_SHADER, vsSource)
	const fragmentShader = loadShader(gl.FRAGMENT_SHADER, fsSource)

	const program = gl.createProgram()
	gl.attachShader(program, vertexShader)
	gl.attachShader(program, fragmentShader)
	gl.linkProgram(program)

	programInfo = {
		program,
		attribs: {
			position: gl.getAttribLocation(program, "position")
		},
		uniforms: {
			matrixProjection: gl.getUniformLocation(program, "matrixProjection"),
			matrixModelView: gl.getUniformLocation(program, "matrixModelView"),
		}
	}	
}

const loadShader = (type, source) => {
	const shader = gl.createShader(type)
	gl.shaderSource(shader, source)
	gl.compileShader(shader)

	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`)
		gl.deleteShader(shader)
		return null
	}	

	return shader
}

const render = () => {
	matrixProjection.identity()
	matrixProjection.ortho(0, canvas.clientWidth, canvas.clientHeight, 0, -1.0, 1.0)

	matrixModelView.identity()
	matrixModelView.translate(0, 0, 0)

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	gl.useProgram(programInfo.program)

	// gl.bindBuffer(gl.ARRAY_BUFFER, positions)
	gl.vertexAttribPointer(programInfo.attribs.position, 2, gl.FLOAT, false, 0, 0)
	gl.enableVertexAttribArray(programInfo.attribs.position)

	gl.uniformMatrix4fv(programInfo.uniforms.matrixProjection, false, matrixProjection.m)
	gl.uniformMatrix4fv(programInfo.uniforms.matrixModelView, false, matrixModelView.m)

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

	// requestAnimationFrame(render)
}

create()
render()