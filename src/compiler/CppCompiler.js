import PrimitiveType from "../PrimitiveType"

let scope = null

const run = (module) => {
    console.log("compile-cpp")
    scope = module.scope
    parseBody(module.data.body)

    let output = "int main() {\n"
    output += "\treturn 1;\n"
    output += "}\n"
    return output
}

const parseBody = (buffer) => {
    for(let n = 0; n < buffer.length; n++) {
        const node = buffer[n]
        parse[node.type](node)
    }
}

const parseBlockStatement = (node) => {
    console.log(node)
}

const parseReturnStatement = (node) => {
    console.log(node)
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
    console.log(node)
}

const parseLiteral = (node) => {
    console.log(node)
}

const parseVariableDeclaration = (node) => {
    const decls = node.declarations
    for(let n = 0; n < decls.length; n++) {
        parseVariableDeclarator(decls[n])
    }
}

const parseVariableDeclarator = (node) => {
    let output = `${getType(node)} ${node.id.name}`
    if(node.primitive === PrimitiveType.Function) {
        output += parse[node.init.type](node.init)
    }
    console.log(output)
}

const parseBinaryExpression = (node) => {
    console.log(node)
}

const parseMemberExpression = (node) => {
    console.log(node)
}

const parseCallExpression = (node) => {
    console.log(node)
}

const parseNewExpression = (node) => {
    console.log(node)
}

const parseArrowFunctionExpression = (node) => {
    const paramsOutput = parseParams(node.params)
    const output = `(${paramsOutput}) {}`
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
    return `${getType(param)} ${param.name}`
}

const getType = (node) => {
    switch(node.primitive) {
        case PrimitiveType.Number:
            return "double"
    }
    return "void"
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