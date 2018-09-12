const program = 10
const programInfo = {
    program,
    attribs: {
        position: "position"
    },
    uniforms: {
        matrixProjection: "matrixProjection",
        matrixModelView: "matrixModelView",
    }
}
console.log(programInfo.uniforms.matrixModelView)