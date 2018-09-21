attribute vec4 position;

uniform mat4 matrixProjection;
uniform mat4 matrixModelView;

void main() {
	gl_Position = matrixProjection * matrixModelView * position;
}