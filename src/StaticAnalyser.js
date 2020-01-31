import ModuleService from "./service/ModuleService.js"
import Scope from "./Scope.js"
import Error from "./Error.js"
import PrimitiveType from "./PrimitiveType.js"
import TypeFlag from "./TypeFlag.js"

let currentModule = null
let topScope = null
let currentScope = null

const globalContext = {
	objectIndex: 0,
	objectInline: false
}

const run = (module) => {
	const modulePrev = currentModule
	const scopePrev = currentScope

	currentModule = module
	currentModule.importedModules.length = 0
	
	parseImports(module.data.body, currentModule.scope)

	currentModule = modulePrev
	currentScope = scopePrev
	// parseBody(node.body)
}

const parseImports = (nodes, scope) => {
	for(let n = 0; n < nodes.length; n++) {
		const node = nodes[n]
		switch(node.type) {
			case "ImportDeclaration":
				parseImportDeclaration(node, scope)
				break
			case "ExportNamedDeclaration":
				parseExportNamedDeclaration(node)
				break
		}
	}
}

const parseImportDeclaration = (node, scope) => {
	updateModule(node, node.source.value)
}

const parseImportDefaultSpecifier = (node, requestScope, importModule) => {
	const name = node.local.name
	if(importModule.ext === "glsl") {
		requestScope.vars[name] = {
			type: "Literal",
			raw: `"${importModule.data}"`,
			varType: rootModule.scope.vars.String
		}
	}
	else {
		if(!scope.vars[name]) {
			throw `ReferenceError: ${node.name} is not defined inside imported module`
		}
		requestScope.vars[name] = scope.vars[name]
	}
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
	if(node.argument) {
		node.varType = parse[node.argument.type](node.argument)
	}
	else {
		node.varType = topScope.vars.None
	}
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
	let varType = null
	const elements = node.elements
	for(let n = 0; n < elements.length; n++) {
		const element = elements[n]
		const currVarType = parse[element.type](element)
		if(!varType) {
			if(currVarType.primitive == PrimitiveType.Unknown) {
				Error.unknownType()
			}
			else {
				varType = currVarType
			}
		}
		if(currVarType != varType) {
			Error.typeMismatch(currVarType, gotType)
		}
	}

	node.varType = topScope.vars.Array
	if(!varType) {
		node.varType.templateType = topScope.vars.Unknown
	}
	else {
		node.varType.templateType = varType
	}
	return node.varType
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

const parseTemplateLiteral = (node) => {
	const expressions = node.expressions
	for(let n = 0; n < expressions.length; n++) {
		const expression = expressions[n]
		const varType = parse[expression.type](expression)
		if(varType.primitive !== PrimitiveType.String) {
			Error.typeMismatch(topScope.vars.String, varType)
		}
	}
	return topScope.vars.String
}

const parseVariableDeclaration = (node) => {
	const decls = node.declarations
	for(let n = 0; n < decls.length; n++) {
		parseVariableDeclarator(decls[n])
	}
}

const parseVariableDeclarator = (node) => {
	if(node.init) {
		const varType = parse[node.init.type](node.init)
		node.init.varType = varType
	}
	else {
		node.init = {
			type: "Empty",
			varType: topScope.vars.Unknown
		}
	}
	scope.vars[node.id.name] = node.init
}

const parseAssignmentExpression = (node) => {
	parse[node.left.type](node.left)
	const leftVar = getVar(node.left, scope)
	if(!leftVar) {
		const name = createName(node.left)
		Error.reference(name)
	}
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
			Error.typeMismatch(rightType, leftType)
		}          
	}
	return leftType
}

const parseUnaryExpression = (node) => {
	const varType = parse[node.argument.type](node.argument)
	return varType
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
	parse[node.callee.type](node.callee)
	const funcNode = getVar(node.callee, scope)
	if(!funcNode) {
		const name = createName(node.callee)
		Error.reference(name)
	}
	if(funcNode.varType.primitive !== PrimitiveType.Function) {
		const name = createName(node.callee)
		throw `InvalidCall: ${name} not a function`
	}
	parseArgs(funcNode.signatures, node.arguments)
	parseFunctionBody(funcNode)
	
	return funcNode.returnType
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
		node.varType = varNode.varType		
		node.property.varType = varNode.varType
	}
	else {
		const objNode = parse[node.object.type](node.object)
		node.varType = objNode.varType	
		if(node.computed) {
			return objNode.templateType
		}
		varNode = objNode.scope.vars[node.property.name]
		if(!varNode) {
			const name = createName(node)
			throw `ReferenceError: ${name} is not defined`
		}
		node.property.varType = varNode.varType    
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
	node.flags = globalContext.objectInline ? TypeFlag.Inline : 0
	node.scope = scope.createScope()
	node.primitive = PrimitiveType.Object
	node.index = globalContext.objectIndex++
	node.varType = node

	const prevScope = scope
	scope = node.scope

	if(!globalContext.objectInline) {
		globalContext.objectInline = true
		parseProps(node.properties)
		globalContext.objectInline = false
	}
	else {
		parseProps(node.properties)
	}

	scope = prevScope
	return node
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

const parseFunctionDeclaration = (node) => {
	defineVar(node.id.name, node)

	const prevScope = scope
	node.varType = topScope.vars.Function
	node.scope = scope.createScope()
	scope = node.scope

	node.signatures = parseParams(node.params)
	node.parsed = false
	
	scope = prevScope
	return node.varType    
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
	if(node.source) {
		updateModule(node, node.source.value)
	}
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
			const param = params[n]
			const arg = args[n]
			const argType = parse[arg.type](arg)
			if(param.varType.primitive === PrimitiveType.Unknown) {
				param.varType = argType
			}
			else if(param.varType !== argType) {
				continue
			}
		}
		return
	}
	throw `SignatureNotFound: Could not find suitable signature`
}

const parseArg = (param, arg) => {

}

const parseProps = (props) => {
	for(let n = 0; n < props.length; n++) {
		const prop = props[n]
		const key = prop.key.name
		const varType = parse[prop.value.type](prop.value)
		prop.value.varType = varType
		defineVar(key, prop.value)
	}
}

const parseFunctionBody = (node) => {
	if(node.parsed) { return }
	node.parsed = true

	const prevScope = scope
	scope = node.scope
	parse[node.body.type](node.body)
	
	const returns = scope.returns
	let returnType = topScope.vars.None
	for(let n = 0; n < returns.length; n++) {
		const itemType = returns[n].varType
		if(returnType.primitive === PrimitiveType.None || returnType.primitive === PrimitiveType.Unknown) {
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
				node.object.varType = leftNode

				if(node.computed) {
					if(leftNode.varType.flags & TypeFlag.Array) {
						return leftNode
					}
					else {
						throw `NoArrayAccess: "${createName(node)}" does not have an array property access"`
					}
				}
				else {
					const varNode = getVar(node.property, leftNode.varType.scope)
					return varNode
				}
			}
			break

		case "Identifier":
			const name = node.name
			let scope = varScope
			while(scope) {
				const varNode = scope.vars[name]
				if(varNode) {
					node.varType = varNode.varType
					return varNode
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

const defineVar = (name, node) => {
	if(scope.vars[name]) {
		Error.redefinition(name)
	}
	scope.vars[name] = node
}

const updateModule = (node, filePath) => {
	node.module = ModuleService.fetchModule(filePath, currentModule) 
	switch(node.module.ext) {
		case ".js":
			run(node.module) 
			break
	}
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
	TemplateLiteral: parseTemplateLiteral,
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
	FunctionDeclaration: parseFunctionDeclaration,
	ClassDeclaration: parseClassDeclaration,
	ExportDefaultDeclaration: parseExportDefaultDeclaration,
	ExportNamedDeclaration: parseExportNamedDeclaration,
	ImportDeclaration: (node) => {},
	MethodDefinition: parseMethodDefinition
}

export default { 
	run 
}