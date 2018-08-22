import Scope from "./Scope"

let fetchMethod = null
let rootModule = null
let module = null
let scope = null

const PrimitiveType = {
    Unknown: 0,
    Number: 1,
    Boolean: 2,
    String: 3,
    Function: 4,
    Object: 5
}

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
}

const parseIdentifier = (node) => {
    node.type = PrimitiveType.Unknown
    scope.vars[node.name] = node.type
}

const parseLiteral = (node) => {
    const type = typeof node
    switch(type) {
        case "number":
            node.type = PrimitiveType.Number
            break
        case "boolean":
            node.type = PrimitiveType.Boolean
            break
        case "string":
            node.type = PrimitiveType.String
            break            
    }
}

const parseVariableDeclaration = (node) => {
    const decls = node.declarations
    for(let n = 0; n < decls.length; n++) {
        parseVariableDeclarator(decls[n])
    }
}

const parseVariableDeclarator = (node) => {
    parse[node.id.type](node.id)
    parse[node.init.type](node.init)

    node.type = node.init.type
    scope.vars[node.id.name] = node
    scope.funcs[node.id.name] = node
}

const parseBinaryExpression = (node) => {
    const leftType = parse[node.left.type](node.left)
    const rightType = parse[node.right.type](node.right)
    console.log(node)
}

const parseArrowFunctionExpression = (node) => {
    const prevScope = scope
    node.type = PrimitiveType.Function
    node.scope = new Scope(scope)
    scope = node.scope

    parse[node.body.type](node.body)
    parseParams(node.params)

    scope = prevScope
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
        const param = params[n]
        parse[param.type](param)
    }
}

const parse = {
    Body: parseBody,
    BlockStatement: parseBlockStatement,
    ReturnStatement: parseReturnStatement,
    Identifier: parseIdentifier,
    Literal: parseLiteral,
    VariableDeclaration: parseVariableDeclaration,
    VariableDeclarator: parseVariableDeclarator,
    BinaryExpression: parseBinaryExpression,
    ArrowFunctionExpression: parseArrowFunctionExpression,
    ClassDeclaration: parseClassDeclaration,
    ExportDefaultDeclaration: parseExportDefaultDeclaration,
    ExportNamedDeclaration: parseExportNamedDeclaration,
    ImportDeclaration: (node) => {},
}

const setFetchMethod = (func) => {
    fetchMethod = func
}

export { run, setFetchMethod }