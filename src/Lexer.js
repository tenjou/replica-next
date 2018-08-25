import Scope from "./Scope"
import PrimitiveType from "./PrimitiveType"

const PrimitiveTypeKey = Object.keys(PrimitiveType)

let fetchMethod = null
let rootModule = null
let module = null
let scope = null

const run = (nextRootModule, nextModule, node) => {
    rootModule = nextRootModule
    module = nextModule    
    return parseImports(node.body)
        .then(() => {
            rootModule = nextRootModule
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

const parseBlockStatement = (node) => {
    parseBody(node.body)
}

const parseReturnStatement = (node) => {
    parse[node.argument.type](node.argument)
    node.primitive = node.argument.primitive
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
    const varNode = scope.getVar(node.name)
    if(!varNode) {
        throw `ReferenceError: ${node.name} is not defined`
    }
    return varNode
}

const parseLiteral = (node) => {
    switch(typeof node.value) {
        case "number":
            node.primitive = PrimitiveType.Number
            break
        case "boolean":
            node.primitive = PrimitiveType.Boolean
            break
        case "string":
            node.primitive = PrimitiveType.String
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
    node.primitive = node.varNode.primitive
    scope.vars[node.id.name] = node
    scope.funcs.push(node)
}

const parseAssignmentExpression = (node) => {
    const left = parse[node.left.type](node.left)
    const right = parse[node.right.type](node.right)
    if(left.primitive === PrimitiveType.Unknown) {
        left.primitive = right.primitive
    }
    else if(left.primitive !== right.primitive) {
        throw `TypeMismatch: Expected type "${PrimitiveTypeKey[right.primitive]}" but instead got "${PrimitiveTypeKey[left.primitive]}"`
    }    
}

const parseUnaryExpression = (node) => {
    parse[node.argument.type](node.argument)
    return node
}

const parseBinaryExpression = (node) => {
    const leftType = parse[node.left.type](node.left).primitive
    const rightType = parse[node.right.type](node.right).primitive
    if(leftType === PrimitiveType.Unknown) {
        node.primitive = rightType
    }
    else {
        node.primitive = leftType
    }
    return node
}

const parseCallExpression = (node) => {
    const varNode = scope.getVar(node.callee.name)
    if(!varNode) {
        const name = createName(node.callee)
        throw `ReferenceError: ${name} is not defined`
    }
    if(varNode.primitive !== PrimitiveType.Function) {
        const name = createName(varNode)
        throw `InvalidCall: ${name} not a function`
    }

    const funcNode = varNode.init
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

    parseArgs(funcNode.params, node.arguments)
}

const parseMemberExpression = (node) => {
    const objNode = parse[node.object.type](node.object)
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
    return node
}

const parseArrowFunctionExpression = (node) => {
    const prevScope = scope
    node.primitive = PrimitiveType.Function
    node.scope = new Scope(scope)
    scope = node.scope

    parseParams(node.params)
    node.parsed = false
    
    scope = prevScope
    return node
}

const parseObjectExpression = (node) => {
    console.log(node)
}

const parseNewExpression = (node) => {
    console.log(node)
}

const parseClassDeclaration = (node) => {
    console.log(node)
}

const parseExportDefaultDeclaration = (node) => {
    console.log(node)
}

const parseExportNamedDeclaration = (node) => {
    console.log(node)
}

const parseParams = (params) => {
    for(let n = 0; n < params.length; n++) {
        parseParam(params[n])
    }
}

const parseParam = (param) => {
    param.primitive = PrimitiveType.Unknown
    scope.vars[param.name] = param
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
    const argType = parse[arg.type](arg).primitive
    if(param.primitive === PrimitiveType.Unknown) {
        param.primitive = argType
    }
    else if(param.primitive !== argType) {
        throw `TypeMismatch: Expected type "${PrimitiveTypeKey[param.primitive]}" but instead got "${PrimitiveTypeKey[argType]}"`
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
}

const setFetchMethod = (func) => {
    fetchMethod = func
}

export { run, setFetchMethod }