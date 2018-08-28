import Scope from "./Scope"
import PrimitiveType from "./PrimitiveType"

const PrimitiveTypeKey = Object.keys(PrimitiveType)

let fetchMethod = null
let rootModule = null
let rootScope = null
let module = null
let scope = null

const run = (nextRootModule, nextModule, node) => {
    rootModule = nextRootModule
    module = nextModule    
    return parseImports(node.body)
        .then(() => {
            rootModule = nextRootModule
            rootScope = rootModule.scope
            module = nextModule
            scope = module.scope
            parseBody(node.body)
        })
}

const parseImports = (nodes) => {
    const promises = []
    for(let n = 0; n < nodes.length; n++) {
        const node = nodes[n]
        if(node.type !== "ImportDeclaration") { break }
        promises.push(parseImportDeclaration(node))
    }
    return Promise.all(promises)
}

const parseImportDeclaration = (node) => {
    return fetchMethod(module, node.source.value)
        .then((module) => {
            node.module = module 
        })
}

const parseBody = (nodes) => {
    for(let n = 0; n < nodes.length; n++) {
        const node = nodes[n]
        parse[node.type](node)
    }
}

const parseClassBody = (node) => {
    parseBody(node.body)
}

const parseBlockStatement = (node) => {
    parseBody(node.body)
}

const parseReturnStatement = (node) => {
    node.primitive = parse[node.argument.type](node.argument).primitive
    scope.returns.push(node)
}

const parseExpressionStatement = (node) => {
    parse[node.expression.type](node.expression)
}

const parseIfStatement = (node) => {
    parse[node.test.type](node.test)
    parse[node.consequent.type](node.consequent)
    if(node.alternate) {
        parse[node.alternate.type](node.alternate)
    }
    return node
}

const parseArrayExpression = (node) => {
    console.log(node)
}

const parseIdentifier = (node) => {
    node.primitive = PrimitiveType.Unknown
    node.varNode = scope.getVar(node.name)
    if(!node.varNode) {
        throw `ReferenceError: ${node.name} is not defined`
    }
    return node.varNode
}

const parseLiteral = (node) => {
    switch(typeof node.value) {
        case "number":
            node.varType = rootScope.vars.Number
            break
        case "boolean":
            node.varType = rootScope.vars.Boolean
            break
        case "string":
            node.varType = rootScope.vars.String
            break      
        default:
            node.varType = null
            break      
    }
    return node
}

const parseVariableDeclaration = (node) => {
    const decls = node.declarations
    for(let n = 0; n < decls.length; n++) {
        parseVariableDeclarator(decls[n])
    }
}

const parseVariableDeclarator = (node) => {
    node.varNode = parse[node.init.type](node.init)
    scope.vars[node.id.name] = node
    scope.funcs.push(node)
}

const parseAssignmentExpression = (node) => {
    const leftType = parse[node.left.type](node.left)
    const rightType = parse[node.right.type](node.right)
    if(leftType === PrimitiveType.Unknown) {
        node.left.primitive = rightType.primitive
    }
    else if(leftType !== rightType) {
        throw `TypeMismatch: Expected type "${PrimitiveTypeKey[rightType]}" but instead got "${PrimitiveTypeKey[leftType]}"`
    }    
}

const parseUnaryExpression = (node) => {
    parse[node.argument.type](node.argument)
    node.primitive = node.argument.primitive
    return node.primitive
}

const parseBinaryExpression = (node) => {
    const leftType = parse[node.left.type](node.left)
    const rightType = parse[node.right.type](node.right)
    if(leftType === PrimitiveType.Unknown) {
        node.primitive = rightType
    }
    else {
        node.primitive = leftType
    }
    return node.primitive
}

const parseCallExpression = (node) => {
    const varNode = parse[node.callee.type](node.callee)
    if(!varNode) {
        const name = createName(node.callee)
        throw `ReferenceError: ${name} is not defined`
    }
    if(varNode.primitive !== PrimitiveType.Function) {
        const name = createName(varNode)
        throw `InvalidCall: ${name} not a function`
    }

    const funcNode = varNode.init
    parseArgs(funcNode.params, node.arguments)

    if(!funcNode.parsed) {
        funcNode.parsed = true

        const prevScope = scope
        scope = funcNode.scope
        parse[funcNode.body.type](funcNode.body)
        
        const returns = scope.returns
        let returnType = PrimitiveType.Unknown
        for(let n = 0; n < returns.length; n++) {
            const itemType = returns[n].primitive
            if(returnType === PrimitiveType.Unknown) {
                returnType = itemType
            }
            else if(returnType !== itemType) {
                throw `TypeMismatch: Expected type "${PrimitiveTypeKey[funcType]}" but instead got "${PrimitiveTypeKey[itemType]}"`
            }
        }
        funcNode.returnPrimitive = returnType
        scope = prevScope
    }
}

const parseMemberExpression = (node) => {
    parse[node.object.type](node.object)
    const objNode = node.object.varNode
    const propertyNode = objNode.scope.vars[node.property.name]
    if(!propertyNode) {
        const name = createName(node)
        throw `ReferenceError: ${name} is not defined`
    }
    return propertyNode
}

const parseFunctionExpression = (node) => {
    const prevScope = scope
    node.primitive = PrimitiveType.Function
    node.scope = new Scope(scope)
    scope = node.scope

    parseParams(node.params)
    node.parsed = false
    
    scope = prevScope  
    return PrimitiveType.Function
}

const parseArrowFunctionExpression = (node) => {
    const prevScope = scope
    node.primitive = PrimitiveType.Function
    node.scope = new Scope(scope)
    scope = node.scope

    parseParams(node.params)
    node.parsed = false
    
    scope = prevScope
    return PrimitiveType.Function
}

const parseObjectExpression = (node) => {
    node.scope = scope.createScope()
    node.primitive = PrimitiveType.Object

    const prevScope = scope
    scope = node.scope
    parseProps(node.properties)
    scope = prevScope
    return node.primitive
}

const parseNewExpression = (node) => {
    console.log(node)
}

const parseClassDeclaration = (node) => {
    parse[node.body.type](node.body)
}

const parseExportDefaultDeclaration = (node) => {
    console.log(node)
}

const parseExportNamedDeclaration = (node) => {
    console.log(node)
}

const parseMethodDefinition = (node) => {
    node.varType = rootScope.vars.Function
}

const parseParams = (params) => {
    for(let n = 0; n < params.length; n++) {
        const param = params[n]
        param.primitive = PrimitiveType.Unknown
        scope.vars[param.name] = param 
    }
}

const parseArgs = (params, args) => {
    if(params.length !== args.length) {
        throw `ArgumentCountMismatch: Expected to have${params.length} arguments but instead got: ${args.length}`
    }
    for(let n = 0; n < args.length; n++) {
        parseArg(params[n], args[n])
    }
}

const parseArg = (param, arg) => {
    const argType = parse[arg.type](arg)
    if(param.primitive === PrimitiveType.Unknown) {
        param.primitive = argType
    }
    else if(param.primitive !== argType) {
        throw `TypeMismatch: Expected type "${PrimitiveTypeKey[param.primitive]}" but instead got "${PrimitiveTypeKey[argType]}"`
    }
}

const parseProps = (props) => {
    for(let n = 0; n < props.length; n++) {
        const prop = props[n]
        const key = prop.key.name
        const node = parse[prop.value.type](prop.value)
        if(scope.vars[key]) {
            throw `SyntaxError: Identifier '${key}' has already been declared`
        }
        scope.vars[key] = node
    }
}

const createName = (node) => {
    switch(node.type) {
        case "Identifier":
            return node.name
        case "VariableDeclarator":
            return createName(node.id)
        case "MemberExpression":
            return `${node.object.name}.${node.property.name}`            
    }
    throw "NotImplemented"
}

const parse = {
    Body: parseBody,
    ClassBody: parseClassBody,
    BlockStatement: parseBlockStatement,
    ReturnStatement: parseReturnStatement,
    ExpressionStatement: parseExpressionStatement,
    IfStatement: parseIfStatement,
    ArrayExpression: parseArrayExpression,
    Identifier: parseIdentifier,
    Literal: parseLiteral,
    VariableDeclaration: parseVariableDeclaration,
    VariableDeclarator: parseVariableDeclarator,
    AssignmentExpression: parseAssignmentExpression,
    UnaryExpression: parseUnaryExpression,
    BinaryExpression: parseBinaryExpression,
    MemberExpression: parseMemberExpression,
    CallExpression: parseCallExpression,
    NewExpression: parseNewExpression,
    FunctionExpression: parseFunctionExpression,
    ArrowFunctionExpression: parseArrowFunctionExpression,
    ObjectExpression: parseObjectExpression,
    ClassDeclaration: parseClassDeclaration,
    ExportDefaultDeclaration: parseExportDefaultDeclaration,
    ExportNamedDeclaration: parseExportNamedDeclaration,
    ImportDeclaration: (node) => {},
    MethodDefinition: parseMethodDefinition
}

const setFetchMethod = (func) => {
    fetchMethod = func
}

export { run, setFetchMethod }