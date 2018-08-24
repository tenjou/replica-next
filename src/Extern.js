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

const declareStd = (module) => {
    declareClass(module, "Math", {
        PI: {
            type: "Literal",
            primitive: PrimitiveType.Number,
            value: 3.141592653589793,
            isStatic: true
        },
        sqrt: {

        },
        min: {

        },
        max: {
            
        }
    })
}

export { declareStd }