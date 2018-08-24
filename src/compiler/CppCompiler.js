import PrimitiveType from "../PrimitiveType"

let scope = null
let tabs = ""
let outerOutput = ""

const run = (module) => {
    scope = module.scope
    let output = "\nint main() {\n"
    incTabs()
    output += parseBody(module.data.body)
    decTabs()
    output += "}\n"
    return outerOutput + output
}


const parseBody = (buffer) => {
    if(buffer.length === 0) {
        return ""
    }
    let output = ""
    let node = buffer[0]
    let nodeOutput = parse[node.type](node)
    if(nodeOutput) {
        output = `${tabs}${nodeOutput}\n`
    }
    for(let n = 1; n < buffer.length; n++) {
        node = buffer[n]
        nodeOutput = parse[node.type](node)
        if(nodeOutput) {
            output += `${tabs}${nodeOutput}\n`
        }
    }
    return output
}

const parseBlockStatement = (node) => {
    incTabs()
    const output = parseBody(node.body)
    decTabs()
    return output
}

const parseReturnStatement = (node) => {
    return `return ${parse[node.argument.type](node.argument)};`
}

const parseExpressionStatement = (node) => {
    return parse[node.expression.type](node.expression)
}

const parseIfStatement = (node) => {
    console.log(node)
}

const parseArrayExpression = (node) => {
    console.log(node)
}

const parseIdentifier = (node) => {
    return node.name
}

const parseLiteral = (node) => {
    return node.value
}

const parseVariableDeclaration = (node) => {
    let output = ""
    const decls = node.declarations
    for(let n = 0; n < decls.length; n++) {
        const nodeOutput = parseVariableDeclarator(decls[n])
        if(nodeOutput) {
            output += nodeOutput
        }
    }
    return output
}

const parseVariableDeclarator = (node) => {
    let output = `${getType(node.init)} ${node.id.name}`
    if(node.primitive === PrimitiveType.Function) {
        let prevTabs = tabs
        tabs = ""
        output += parse[node.init.type](node.init)
        tabs = prevTabs
        outerOutput += output + "\n"
        output = null
    }
    return output
}

const parseBinaryExpression = (node) => {
    return `${parse[node.left.type](node.left)} ${node.operator} ${parse[node.right.type](node.right)}` 
}

const parseMemberExpression = (node) => {
    const connection = node.property.isStatic ? "::" : "."
    return parse[node.object.type](node.object) + connection + parse[node.property.type](node.property)
}

const parseCallExpression = (node) => {
    const params = parseArgs(node.arguments)
    const output = createName(node.callee) + `(${params});`
    return output
}

const parseNewExpression = (node) => {
    console.log(node)
}

const parseFunctionExpression = (node) => {
    const paramsOutput = parseParams(node.params)
    let output = `(${paramsOutput}) {\n`
    output += parse[node.body.type](node.body)
    output += `}`
    return output
}

const parseArrowFunctionExpression = (node) => {
    const paramsOutput = parseParams(node.params)
    let output = `(${paramsOutput}) {\n`
    output += parse[node.body.type](node.body)
    output += `}`
    return output
}

const parseObjectExpression = (node) => {
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
    if(node.module.ext === "js") {
        parseBody(node.module.data.body)
    }
}

const parseParams = (params) => {
    if(params.length === 0) {
        return ""
    }

    let output = parseParam(params[0])
    for(let n = 1; n < params.length; n++) {
        output += `, ${parseParam(params[n])}`
    }
    return output
}

const parseParam = (param) => {
    return `${getPrimitive(param.primitive)} ${param.name}`
}

const parseArgs = (args) => {
    if(args.length === 0) {
        return ""
    }

    let output = parseArg(args[0])
    for(let n = 1; n < args.length; n++) {
        output += `, ${parseArg(args[n])}`
    }
    return output
}

const parseArg = (arg) => {
    return parse[arg.type](arg)
}

const getType = (node) => {
    switch(node.type) {
        case "ArrowFunctionExpression":
            return getPrimitive(node.returnPrimitive)
    }
    return getPrimitive(node.primitive)
}

const getPrimitive = (primitive) => {
    switch(primitive) {
        case PrimitiveType.Number:
            return "double"
    }
    return "void"
}

const createName = (node) => {
    return node.name
}

const incTabs = () => {
    tabs += "\t"
}

const decTabs = () => {
    tabs = tabs.slice(0, -1)
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
    ImportDeclaration: parseImportDeclaration
}

export { run }