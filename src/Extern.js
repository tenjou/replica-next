import Scope from "./Scope"
import PrimitiveType from "./PrimitiveType"

const declareClass = (module, name, members) => {
    const moduleScope = module.scope
    const scope = new Scope(moduleScope)
    const node = {
        type: "ClassDeclaration",
        scope
    }
    moduleScope.vars[name] = node

    for(let key in members) {
        const member = members[key]
        scope.vars[key] = member
    }
}

const declareType = (module, type, primitive) => {
    module.scope.vars[type] = {
        type,
        primitive
    }
}

const createFunc = (paramTypes, returnType = PrimitiveType.Unknown) => {
    const params = createParams(paramTypes)
    return {
        primitive: PrimitiveType.Function,
        init: {
            params,
            parsed: true,
            returnType
        }
    }
}

const createParams = (params) => {
    const result = new Array(params.length)
    for(let n = 0; n < params.length; n++) {
        result[n] = {
            primitive: params[n]
        }
    }
    return result
}

const declareStd = (module) => {
    declareType(module, "Number", PrimitiveType.Number)
    declareType(module, "Boolean", PrimitiveType.Boolean)
    declareType(module, "String", PrimitiveType.String)
    declareType(module, "Function", PrimitiveType.Function)
    declareType(module, "Object", PrimitiveType.Object)

    declareClass(module, "console", {
        log: createFunc([ PrimitiveType.String ])
    })

    declareClass(module, "Math", {
        PI: {
            type: "Literal",
            primitive: PrimitiveType.Number,
            value: 3.141592653589793,
            isStatic: true
        },
        sqrt: createFunc([ PrimitiveType.Number ], PrimitiveType.Number),
        min: createFunc([ PrimitiveType.Number, PrimitiveType.Number ], PrimitiveType.Number),
        max: createFunc([ PrimitiveType.Number, PrimitiveType.Number ], PrimitiveType.Number)
    })
}

export { declareStd }