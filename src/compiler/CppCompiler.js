import PrimitiveType from "../PrimitiveType"

let scope = null
let tabs = ""
let outerOutput = ""

const run = (module) => {
    scope = module.scope
    const includes = `#include "replica.cpp"\n\n`
    let output = "int main() {\n"
    incTabs()
    output += parseBody(module.data.body)
    output += `\n${tabs}return 0;\n`
    decTabs()
    output += "}\n"
    return includes + outerOutput + output
}

const parseBody = (buffer) => {
    if(buffer.length === 0) {
        return ""
    }
    let output = ""
    for(let n = 0; n < buffer.length; n++) {
        const node = buffer[n]
        let nodeOutput = parse[node.type](node)
        if(nodeOutput) {
            nodeOutput = `${tabs}${nodeOutput}`
            switch(node.type) {
                case "IfStatement":
                    output += `${nodeOutput}\n`
                    break
                default:
                    output += `${nodeOutput};\n`
                    break
            }
        }
    }
    return output
}

const parseBlockStatement = (node) => {
    incTabs()
    let output = `{\n${parseBody(node.body)}`
    decTabs()
    output += tabs + "}"
    return output
}

const parseReturnStatement = (node) => {
    return `return ${parse[node.argument.type](node.argument)}`
}

const parseExpressionStatement = (node) => {
    return parse[node.expression.type](node.expression)
}

const parseIfStatement = (node, head = true) => {
    let output = `if(${parse[node.test.type](node.test)}) `
    output += parse[node.consequent.type](node.consequent)
    if(node.alternate) {
        output += `\n${tabs}else ${parse[node.alternate.type](node.alternate, false)}`
    }
    return output
}

const parseArrayExpression = (node) => {
    console.log(node)
}

const parseIdentifier = (node) => {
    return node.name
}

const parseLiteral = (node) => {
    return node.raw
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
    let output
    if(node.primitive === PrimitiveType.Function) {
        if(node.parsed) {
            let prevTabs = tabs
            tabs = ""
            output = parse[node.init.type](node.init)
            output += parse[node.init.type](node.init)
            tabs = prevTabs
            outerOutput += output + "\n"
        }
        return null
    }
    else if(node.primitive === PrimitiveType.Object) {
        let prevTabs = tabs
        tabs = ""        
        outerOutput += `struct ${node.id.name} ${parse[node.init.type](node.init)}`
        tabs = prevTabs
        return null
    }
    else {
        output += `${getType(node.varNode)} ${node.id.name} = ${parse[node.init.type](node.init)}`
    }
    return output
}

const parseAssignmentExpression = (node) => {
    const output = `${parse[node.left.type](node.left)} = ${parse[node.right.type](node.right)}`
    return output
}

const parseUnaryExpression = (node) => {
    const output = `${node.operator}${parse[node.argument.type](node.argument)}`
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
    const output = createName(node.callee) + `(${params})`
    return output
}

const parseNewExpression = (node) => {
    console.log(node)
}

const parseFunctionExpression = (node) => {
    const paramsOutput = parseParams(node.params)
    let output = `(${paramsOutput}) `
    output += parse[node.body.type](node.body) + "\n"
    return output
}

const parseArrowFunctionExpression = (node) => {
    const paramsOutput = parseParams(node.params)
    let output = `(${paramsOutput}) `
    output += parse[node.body.type](node.body) + "\n"
    return output
}

const parseObjectExpression = (node) => {
    let output = ""
    let staticOutput = ""
    incTabs()
    const props = node.properties
    for(let n = 0; n < props.length; n++) {
        const prop = props[n]
        const baseOutput = `static const ${getType(prop.value)} ${prop.key.name}`
        output += `${tabs}${baseOutput};\n`
        staticOutput += `${baseOutput} = ${parse[prop.value.type](prop.value)};\n`
    }
    decTabs()
    return `{\n${output}${tabs}};\n\n${staticOutput}\n`
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
        case PrimitiveType.Boolean:
            return "bool"
        case PrimitiveType.String:
            return "std::string"
    }
    return "void"
}

const parseProps = (props) => {
    let output = ""
    for(let n = 0; n < props.length; n++) {
        output += parseProp(props[n])
    }
    return output
}

const parseProp = (prop) => {
    
}

const createName = (node) => {
    switch(node.type) {
        case "MemberExpression":
            return `${createName(node.object)}::${createName(node.property)}`
    }
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
    AssignmentExpression: parseAssignmentExpression,
    UnaryExpression: parseUnaryExpression,
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