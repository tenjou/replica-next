import Scope from "./Scope"
import PrimitiveType from "./PrimitiveType"
import TypeFlag from "./TypeFlag"

let fetchMethod = null
let rootModule = null
let topScope = null
let module = null
let scope = null

const run = (rootModule_, module_, node) => {
    rootModule = rootModule_
    module = module_
    return parseImports(node.body, module_.scope)
        .then(() => {
            rootModule = rootModule_
            topScope = rootModule_.scope
            module = module_
            scope = module.scope
            parseBody(node.body)
        })
}

const parseImports = (nodes, scope) => {
    const promises = []
    for(let n = 0; n < nodes.length; n++) {
        const node = nodes[n]
        if(node.type !== "ImportDeclaration") { break }
        promises.push(parseImportDeclaration(node, scope))
    }
    return Promise.all(promises)
}

const parseImportDeclaration = (node, scope) => {
    return fetchMethod(rootModule, module, node.source.value)
        .then((module) => {
            node.module = module 
            const specifiers = node.specifiers
            for(let n = 0; n < specifiers.length; n++) {
                parseImportDefaultSpecifier(specifiers[n], scope)
            }
        })
}

const parseImportDefaultSpecifier = (node, requestScope) => {
    const name = node.local.name
    if(!scope.vars[name]) {
        throw `ReferenceError: ${node.name} is not defined inside imported module`
    }
    requestScope.vars[name] = scope.vars[name]
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
    node.varType = parse[node.argument.type](node.argument)
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
    const varNode = parse[node.left.type](node.left)
    scope.vars[node.left.name] = varNode
    return varNode
}

const parseIdentifier = (node) => {
    const varNode = getVar(node, scope)
    if(!varNode) {
        throw `ReferenceError: ${node.name} is not defined`
    }
    return varNode.varType
}

const parseLiteral = (node) => {
    switch(typeof node.value) {
        case "number":
            node.varType = topScope.vars.Number
            break
        case "boolean":
            node.varType = topScope.vars.Boolean
            break
        case "string":
            node.varType = topScope.vars.String
            break
        default:
            node.varType = topScope.vars.Unknown
            break
    }
    return node.varType
}

const parseVariableDeclaration = (node) => {
    const decls = node.declarations
    for(let n = 0; n < decls.length; n++) {
        parseVariableDeclarator(decls[n])
    }
}

const parseVariableDeclarator = (node) => {
    const varType = parse[node.init.type](node.init)
    node.init.varType = varType
    scope.vars[node.id.name] = node.init
}

const parseAssignmentExpression = (node) => {
    const leftVar = getVar(node.left, scope)
    const leftType = leftVar.varType
    const rightType = parse[node.right.type](node.right)
    if(node.left.computed) {
        if(rightType.primitive !== PrimitiveType.Number) {
            throw `UnsupportedType: [] property access only supported for Number type`
        }
    }
    else {
        if(leftType.primitive === PrimitiveType.Unknown) {
            leftVar.varType = rightType
            return rightType
        }
        else if(leftType !== rightType) {
            throw `TypeMismatch: Expected type "${PrimitiveTypeKey[rightType]}" but instead got "${PrimitiveTypeKey[leftType]}"`
        }          
    }
    return leftType
}

const parseUnaryExpression = (node) => {
    parse[node.argument.type](node.argument)
    node.primitive = node.argument.primitive
    return node.primitive
}

const parseBinaryExpression = (node) => {
    const leftType = parse[node.left.type](node.left)
    const rightType = parse[node.right.type](node.right)
    if(leftType.primitive === PrimitiveType.Unknown) {
        node.varNode = rightType
    }

    node.varNode = leftType
    return node.varNode
}

const parseCallExpression = (node) => {
    const funcNode = getVar(node.callee, scope)
    if(!funcNode) {
        const name = createName(node.callee)
        throw `ReferenceError: ${name} is not defined`
    }
    if(funcNode.varType.primitive !== PrimitiveType.Function) {
        const name = createName(node.callee)
        throw `InvalidCall: ${name} not a function`
    }
    parseArgs(funcNode.signatures, node.arguments)
    parseFunctionBody(funcNode)
}

const parseMemberExpression = (node) => {
    let varNode
    if(node.object.type === "ThisExpression") {
        const parentScope = scope.parent
        varNode = parentScope.vars[node.property.name]
        if(!varNode) {
            varNode = node.property
            varNode.varType = topScope.vars.Unknown
            parentScope.vars[node.property.name] = varNode
        }
    }
    else {
        const objNode = parse[node.object.type](node.object)
        varNode = objNode.scope.vars[node.property.name]
        if(!varNode) {
            const name = createName(node)
            throw `ReferenceError: ${name} is not defined`
        }        
    }
    return varNode.varType
}

const parseFunctionExpression = (node) => {
    const prevScope = scope
    node.varType = topScope.vars.Function
    node.scope = new Scope(scope)
    scope = node.scope

    node.signatures = parseParams(node.params)
    node.parsed = false
    
    scope = prevScope
    return node.varType
}

const parseArrowFunctionExpression = (node) => {
    return parseFunctionExpression(node)
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

const parseThisExpression = (node) => {
    console.log(node)
}

const parseAssignmentPattern = (node) => {
    console.log(node)
}

const parseNewExpression = (node) => {
    const varNode = parse[node.callee.type](node.callee)
    if(!varNode.isType && varNode.primitive !== PrimitiveType.Class) {
        throw `InvalidType: ${node.varNode.id.name} is not typeof Class`
    }
    const constructorFunc = varNode.scope.vars.constructor
    if(constructorFunc) {
        parseArgs(constructorFunc.signatures, node.arguments)
        parseFunctionBody(constructorFunc)
    }
    else if(node.arguments.length > 0) {
        throw `ArgumentCountMismatch: Expected to have${constructorFunc.params.length} arguments but instead got: 0`
    }
    return varNode
}

const parseClassDeclaration = (node) => {
    node.isType = true
    node.primitive = PrimitiveType.Class
    node.varType = node
    node.scope = scope.createScope(true)
    scope.vars[node.id.name] = node

    const prevScope = scope
    scope = node.scope
    parse[node.body.type](node.body)
    scope = prevScope
}

const parseExportDefaultDeclaration = (node) => {
    const varNode = getVar(node.declaration, scope)
    scope.exported[node.declaration.name] = varNode
}

const parseExportNamedDeclaration = (node) => {
    console.log(node)
}

const parseMethodDefinition = (node) => {
    node.value.varType = topScope.vars.Function
    node.value.scope = scope.createScope()
    node.value.parsed = false

    const prevScope = scope
    scope = node.value.scope
    node.value.signatures = parseParams(node.value.params)
    scope = prevScope

    scope.vars[node.key.name] = node.value
}

const parseParams = (params) => {
    let paramsRequired = 0
    for(let n = 0; n < params.length; n++) {
        const param = params[n]
        param.varNode = null
        param.varType = topScope.vars.Unknown

        if(param.type !== "AssignmentPattern") {
            scope.vars[param.name] = param            
            paramsRequired++
        }
        else {
            param.varNode = null
            param.varType = topScope.vars.Unknown
            scope.vars[param.left.name] = param
        }
    }
    return [{
        params,
        paramsRequired
    }]
}

const parseArgs = (signatures, args) => {
    for(let n = 0; n < signatures.length; n++) {
        const signature = signatures[n]
        if(signature.paramsRequired !== args.length) {
            continue
        }
        const params = signature.params
        for(let n = 0; n < args.length; n++) {
            parseArg(params[n], args[n])
        }
        return
    }
    throw `SignatureNotFound: Could not find suitable signature`
}

const parseArg = (param, arg) => {
    const argType = parse[arg.type](arg)
    if(param.varType.primitive === PrimitiveType.Unknown) {
        param.varType = argType
    }
    else if(param.varType !== argType) {
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

const parseFunctionBody = (node) => {
    if(node.parsed) { return }
    node.parsed = true

    const prevScope = scope
    scope = node.scope
    parse[node.body.type](node.body)
    
    const returns = scope.returns
    let returnType = topScope.vars.Unknown
    for(let n = 0; n < returns.length; n++) {
        const itemType = returns[n].varType
        if(returnType.primitive === PrimitiveType.Unknown) {
            returnType = itemType
        }
        else if(returnType !== itemType) {
            throw `TypeMismatch: Expected type "${returnType.name}" but instead got "${itemType.name}"`
        }
    }
    node.returnType = returnType
    scope = prevScope 
}

const getVar = (node, varScope) => {
    switch(node.type) {
        case "MemberExpression":
            if(node.object.type === "ThisExpression") {
                const rootScope = varScope.getRoot()
                let varNode = getVar(node.property, rootScope)
                if(!varNode) {
                    varNode = node.property
                    varNode.varType = topScope.vars.Unknown
                    rootScope.vars[varNode.name] = varNode
                }
                return varNode
            }
            else {
                const leftNode = getVar(node.object, varScope)
                if(node.computed) {
                    if(leftNode.varType.flags & TypeFlag.Array) {
                        return leftNode
                    }
                    else {
                        throw `NoArrayAccess: "${createName(node)}" does not have an array property access"`
                    }
                }
            }
            break

        case "Identifier":
            const name = node.name
            let scope = varScope
            while(scope) {
                const node = scope.vars[name]
                if(node) {
                    return node
                }
                scope = scope.parent
            }
    }
    return null
}

const createName = (node) => {
    switch(node.type) {
        case "Identifier":
            return node.name
        case "VariableDeclarator":
            return createName(node.id)
        case "MemberExpression":
            const objectName = createName(node.object)
            if(node.computed) {
                return objectName
            }
            return `${objectName}.${createName(node.property)}`   
        case "ThisExpression":
            return "this"     
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
    ThisExpression: parseThisExpression,
    AssignmentPattern: parseAssignmentPattern,
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