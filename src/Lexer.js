import Scope from "./Scope"
import PrimitiveType from "./PrimitiveType"

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
}

const parseExpressionStatement = (node) => {
    console.log(node)
}

const parseIfStatement = (node) => {
    console.log(node)
}

const parseArrayExpression = (node) => {
    console.log(node)
}

const parseIdentifier = (node) => {
    const varNode = scope.getVar(node.name)
    if(!varNode) {
        throw `Uncaught ReferenceError: ${node.name} is not defined`
    }
    return varNode
}

const parseLiteral = (node) => {
    const type = typeof node
    switch(type) {
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
    parse[node.init.type](node.init)

    node.primitive = node.init.primitive
    scope.vars[node.id.name] = node
    scope.funcs[node.id.name] = node
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
    
}

const parseMemberExpression = (node) => {
    const objNode = parse[node.object.type](node.object)
    const propertyNode = objNode.scope.vars[node.property.name]
    if(!propertyNode) {
        const memberName = createMemberName(node)
        throw `Uncaught ReferenceError: ${memberName} is not defined`
    }
    return propertyNode
}

const parseArrowFunctionExpression = (node) => {
    const prevScope = scope
    node.primitive = PrimitiveType.Function
    node.scope = new Scope(scope)
    scope = node.scope

    parseParams(node.params)
    parse[node.body.type](node.body)
    
    scope = prevScope
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

const parseImportDeclaration = (node) => {
    return fetchMethod(module, node.source.value)
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

const createMemberName = (node) => {
    const name = `${node.object.name}.${node.property.name}`
    return name
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
    BinaryExpression: parseBinaryExpression,
    MemberExpression: parseMemberExpression,
    CallExpression: parseCallExpression,
    NewExpression: parseNewExpression,
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