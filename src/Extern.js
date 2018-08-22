import Scope from "./Scope"
import PrimitiveType from "./PrimitiveType"

const declareClass = (module, name, members) => {
    const moduleScope = module.scope
    const scope = new Scope(moduleScope)
    moduleScope.classes[name] = {
        type: "ClassDeclaration",
        scope
    }
    for(let key in members) {
        const member = members[key]
        scope.vars[key] = member
    }
}

const declareMath = (module) => {
    declareClass(module, "Math", {
        PI: {
            type: "Number",
            primitive: PrimitiveType.Number,
            value: 3.141592653589793
        }
    })
}

const declareStd = (module) => {
    declareMath(module)
}

export { declareStd }