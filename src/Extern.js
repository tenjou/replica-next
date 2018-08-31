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

const getVarType = (primitive) => {
    switch(primitive) {
        case PrimitiveType.Number:
            return numberType
        case PrimitiveType.Boolean:
            return booleanType
        case PrimitiveType.String:
            return stringType
        case PrimitiveType.Function:
            return functionType
        case PrimitiveType.Object:
            return objectType
        case PrimitiveType.Array:
            return arrayType                                                            
    }
    return unknownType
}

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
        isType: true
    }
    node.varType = node
    moduleScope.vars[name] = node

    for(let key in members) {
        const member = members[key]
        scope.vars[key] = member
    }
}

const declareType = (module, type, primitive, flags = 0) => {
    const typeNode = {
        name: type,
        primitive,
        flags,
        isType: true
    }
    module.scope.vars[type] = typeNode
    return typeNode
}

const createFunc = (params, returnType = PrimitiveType.Unknown) => {
    const signatures = createParams(params)
    return {
        signatures,
        parsed: true,
        varNode: functionType,
        returnType: getVarType(returnType)
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

    declareClass(module, "console", {
        log: createFunc([ stringType ])
    })

    declareClass(module, "Math", {
        PI: {
            type: "Literal",
            varNode: numberType,
            value: 3.141592653589793,
            isStatic: true
        },
        sqrt: createFunc([ numberType ], numberType),
        min: createFunc([ numberType, numberType ], numberType),
        max: createFunc([ numberType, numberType ], numberType)
    })

    declareClass(module, "Float32Array", {
        constructor: createFunc([
            [],
            [ numberType ],
            [ arrayType ]
        ])
    }, TypeFlag.Array)
}

export { declareStd }