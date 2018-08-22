
let scope = null

const run = (module) => {
    console.log("compile-cpp")
    scope = module.scope

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
    console.log(node)
}

const parseVariableDeclarator = (node) => {
    console.log(node)
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
    console.log(node)
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
    console.log(node)
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