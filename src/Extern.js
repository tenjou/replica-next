import Scope from "./Scope"
import PrimitiveType from "./PrimitiveType"
import TypeFlag from "./TypeFlag"

let unknownType
let numberType
let booleanType
let stringType
let functionType
let objectType
let arrayType

const declareClass = (module, name, members, flags = 0) => {
	const moduleScope = module.scope
	const scope = new Scope(moduleScope)
	const node = {
		id: {
			name
		},
		type: "ClassDeclaration",
		scope,
		flags,
		primitive: PrimitiveType.Class,
		isType: true
	}
	if(flags & TypeFlag.Array) {
		node.arrayType = numberType
	}	
	node.varType = node
	moduleScope.vars[name] = node

	for(let key in members) {
		const member = members[key]
		scope.vars[key] = member
	}
	return node
}

const declareType = (module, type, primitive, flags = 0) => {
	const typeNode = {
		name: type,
		primitive,
		flags,
		isType: true
	}
	if(flags & TypeFlag.Array) {
		typeNode.arrayType = numberType
	}
	module.scope.vars[type] = typeNode
	return typeNode
}

const createVar = (type) => {
	return {
		type: "Literal",
		varType: type,
		isStatic: true
	}
}

const createFunc = (params, returnType = unknownType) => {
	const signatures = createParams(params)
	return {
		signatures,
		parsed: true,
		varType: functionType,
		returnType
	}
}

const createParams = (params) => {
	const signatures = []
	for(let n = 0; n < params.length; n++) {
		const srcBuffer = params[n]
		const buffer = new Array(srcBuffer.length)
		for(let m = 0; m < srcBuffer.length; m++) {
			buffer[m] = {
				varType: srcBuffer[m]
			}
		}
		signatures.push({
			params: buffer,
			paramsRequired: srcBuffer.length
		})
	}
	return signatures
}

const declareStd = (module) => {
	unknownType = declareType(module, "Unknown", PrimitiveType.Unknown)
	numberType = declareType(module, "Number", PrimitiveType.Number)
	booleanType = declareType(module, "Boolean", PrimitiveType.Boolean)
	stringType = declareType(module, "String", PrimitiveType.String)
	functionType = declareType(module, "Function", PrimitiveType.Function)
	objectType = declareType(module, "Object", PrimitiveType.Object)
	arrayType = declareType(module, "Array", PrimitiveType.Array, TypeFlag.Array)

	const float32ArrayType = declareClass(module, "Float32Array", {
		constructor: createFunc([
			[],
			[ numberType ],
			[ arrayType ]
		])
	}, TypeFlag.Array)

	const webglShader = declareClass(module, "WebGLShader", {})
	
	const webglRenderingContext = declareClass(module, "WebGLRenderingContext", {})

	const webglContext = declareClass(module, "WebGLRenderingContext", {
		clear: createFunc([[ numberType ]]),
		clearColor: createFunc([[ numberType, numberType, numberType, numberType ]]),
		clearDepth: createFunc([[ numberType ]]),
		enable: createFunc([[ numberType ]]),
		disable: createFunc([[ numberType ]]),
		depthFunc: createFunc([[ numberType ]]),
		viewport: createFunc([[ numberType, numberType, numberType, numberType ]]),
		useProgram: createFunc([[ numberType ]]),
		bindBuffer: createFunc([[ numberType, float32ArrayType ]]),
		vertexAttribPointer: createFunc([[ numberType, numberType, numberType, booleanType, numberType, numberType ]]),
		enableVertexAttribArray: createFunc([[ numberType ]]),
		drawArrays: createFunc([[ numberType, numberType, numberType ]]),
		createShader: createFunc([[ numberType ]], webglShader),
		shaderSource: createFunc([[ webglShader, stringType ]], webglShader),
		compileShader: createFunc([[ webglShader ]]),
		deleteShader: createFunc([[ webglShader ]]),
		createProgram: createFunc([[]], webglRenderingContext),
		attachShader: createFunc([[ webglRenderingContext, webglShader ]]),
		linkProgram: createFunc([[ webglRenderingContext ]]),
		getShaderParameter: createFunc([[ webglShader, numberType ]]),
		getShaderInfoLog: createFunc([[ webglShader ]], stringType),
		FLOAT: createVar(numberType),
		DEPTH_TEST: createVar(numberType),
		LEQUAL: createVar(numberType),
		COLOR_BUFFER_BIT: createVar(numberType),
		DEPTH_BUFFER_BIT: createVar(numberType),
		ARRAY_BUFFER: createVar(numberType),
		TRIANGLE_STRIP: createVar(numberType),
		VERTEX_SHADER: createVar(numberType),
		FRAGMENT_SHADER: createVar(numberType),
		COMPILE_STATUS: createVar(numberType),
	})

	const htmlCanvas = declareClass(module, "HTMLCanvasElement", {
		getContext: createFunc([[ stringType ]], webglContext),
		clientWidth: createVar(numberType),
		clientHeight: createVar(numberType)
	})

	declareClass(module, "document", {
		createElement: createFunc([[ stringType ]], htmlCanvas),
	})

	declareClass(module, "console", {
		log: createFunc([[ stringType ]]),
		error: createFunc([[ stringType ]])
	})

	declareClass(module, "Math", {
		PI: createVar(numberType),
		sqrt: createFunc([[ numberType ]], numberType),
		min: createFunc([[ numberType, numberType ]], numberType),
		max: createFunc([[ numberType, numberType ]], numberType)
	})
}

export { declareStd }