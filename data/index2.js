import Matrix4 from "./math/Matrix4"
import basicVS from "./shaders/sprite.vertex.glsl"
import basicFS from "./shaders/sprite.fragment.glsl"

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

const render = () => {
	matrixProjection.identity()
	matrixProjection.ortho(0, canvas.clientWidth, canvas.clientHeight, 0, -1.0, 1.0)

	matrixModelView.identity()
	matrixModelView.translate(0, 0, 0)

	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
	// gl.useProgram(programInfo.program)

	// gl.bindBuffer(gl.ARRAY_BUFFER, positions)
	// gl.vertexAttribPointer(programInfo.attribs.position, 2, gl.FLOAT, false, 0, 0)
	// gl.enableVertexAttribArray(programInfo.attribs.position)

	// gl.uniformMatrix4fv(programInfo.uniforms.matrixProjection, false, matrixProjection.m)
	// gl.uniformMatrix4fv(programInfo.uniforms.matrixModelView, false, matrixModelView.m)

	gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)

	// requestAnimationFrame(render)
}

create()
render()