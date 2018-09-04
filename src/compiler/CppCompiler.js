import PrimitiveType from "../PrimitiveType"

let scope = null
let rootScope = null
let insideClass = null
let tabs = ""
let outerOutput = ""
let globalVars = ""

const run = (module, rootScope_) => {
	scope = module.scope
	rootScope = rootScope_

	const includes = `#include "replica.cpp"\n\n`
	let output = "int main() {\n"
	incTabs()
	output += parseBody(module.data.body)
	output += `\n${tabs}return 0;\n`
	decTabs()
	output += "}\n"

	let result = includes + outerOutput
	if(globalVars) {
		result += globalVars + "\n"
	}
	result += output
	return result
}

const parseBody = (buffer) => {
	if(buffer.length === 0) {
		return ""
	}

	const parseLater = []

	let output = ""
	for(let n = 0; n < buffer.length; n++) {
		const node = buffer[n]
		if(node.type === "ClassDeclaration") {
			parseLater.push(node)
			continue
		}
		let nodeOutput = parse[node.type](node)
		if(nodeOutput) {
			nodeOutput = `${tabs}${nodeOutput}`
			switch(node.type) {
				case "IfStatement":
				case "MethodDefinition":
				case "VariableDeclaration":
					output += `${nodeOutput}\n`
					break
				default:
					output += `${nodeOutput};\n`
					break
			}
		}
	}

	for(let n = 0; n < parseLater.length; n++) {
		const node = parseLater[n]
		parse[node.type](node)
	}

	return output
}

const parseClassBody = (node) => {
	incTabs()
	const varsOutput = parseVars(scope.vars)
	const bodyOutput = parseBody(node.body)
	let output = `{\n${varsOutput}\n${bodyOutput}`
	decTabs()
	output += tabs + "}"
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
	if(node.argument) {
		return `return ${parse[node.argument.type](node.argument)}`
	}
	return "return"
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
	return (node.value === null) ? "nullptr" : node.raw
}

const parseTemplateLiteral = (node) => {
	const quasis = node.quasis
	if(quasis.length === 0) {
		return ""
	}

	let output = `"${quasis[0].value.cooked}"`
	for(let n = 1; n < quasis.length; n++) {
		const quasisNode = quasis[n]
		const expressionNode = node.expressions[n - 1]
		output += ` + ${parse[expressionNode.type](expressionNode)}`
		if(quasisNode.value.raw.length > 0) {
			output += ` + "${quasisNode.value.cooked}"`
		}
	}
	return output
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
	const initNode = node.init
	if(initNode.type === "Empty") {
		return `${parseType(initNode.varType)}${node.id.name};\n`
	}

	switch(initNode.varType.primitive) {
		case PrimitiveType.Function:
			if(initNode.parsed) {
				const prevTabs = tabs
				tabs = ""
				outerOutput += parseType(initNode.returnType) + node.id.name + parse[initNode.type](initNode) + "\n"
				tabs = prevTabs
			}
			break

		case PrimitiveType.Object:
			const prevTabs = tabs
			tabs = ""        
			outerOutput += `struct ${node.id.name} ${parse[initNode.type](initNode)}`
			tabs = prevTabs
			break

		default:
			if(scope.parent === rootScope) {
				globalVars += parseType(initNode.varType) + node.id.name + ` = ${parse[initNode.type](initNode)};\n`
				return null
			}
			return `auto ${node.id.name} = ${parse[initNode.type](initNode)}`
	}

	return null
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
	if(node.computed) {
		const output = `${parse[node.object.type](node.object)}[${parse[node.property.type](node.property)}]`
		return output
	}
	const connection = node.property.isStatic ? "::" : "->"
	const output = parse[node.object.type](node.object) + connection + parse[node.property.type](node.property) 
	return output
}

const parseCallExpression = (node) => {
	const params = parseArgs(node.arguments)
	const output = parse[node.callee.type](node.callee) + `(${params})`
	return output
}

const parseNewExpression = (node) => {
	const args = parseArgs(node.arguments)
	const output = `new ${parse[node.callee.type](node.callee)}(${args})`
	return output
}

const parseThisExpression = (node) => {
	return "this"
}

const parseFunctionExpression = (node) => {
	const paramsOutput = parseParams(node.params)
	const prevScope = scope
	scope = node.scope

	let output = `(${paramsOutput}) `
	output += parse[node.body.type](node.body) + "\n"

	scope = prevScope
	return output
}

const parseArrowFunctionExpression = (node) => {
	return parseFunctionExpression(node)
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

const parseFunctionDeclaration = (node) => {
	const paramsOutput = parseParams(node.params)
	const prevScope = scope
	const prevTabs = tabs
	scope = node.scope
	tabs = ""

	let output = `auto ${node.id.name}(${paramsOutput}) `
	output += parse[node.body.type](node.body) + "\n\n"
	outerOutput += output

	scope = prevScope
	tabs = prevTabs
	return null
}

const parseClassDeclaration = (node) => {
	const prevScope = scope
	const prevTabs = tabs
	scope = node.scope
	tabs = ""
	insideClass = node
	outerOutput += `struct ${node.id.name} ${parse[node.body.type](node.body)};\n\n`
	insideClass = null
	tabs = prevTabs
	scope = prevScope
	return null
}

const parseExportDefaultDeclaration = (node) => {}

const parseExportNamedDeclaration = (node) => {}

const parseImportDeclaration = (node) => {
	if(node.module.ext === "js") {
		parseBody(node.module.data.body)
	}
	else {
		parseContent(node.specifiers[0], node.module.data)
	}
}

const parseMethodDefinition = (node) => {
	if(!node.value.parsed) { 
		return null 
	}

	let output
	switch(node.kind) {
		case "constructor":
			output = createName(insideClass.id) + parseFunctionExpression(node.value)
			break
		default:
			output = parseType(node.value.returnType) + node.key.name + parseFunctionExpression(node.value)
			break
	}
	return output
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
	return parseType(param.varType) + param.name
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

const parseType = (type) => {
	switch(type.primitive) {
		case PrimitiveType.Number:
			return "double "
		case PrimitiveType.Boolean:
			return "bool "
		case PrimitiveType.String:
			return "std::string "
		case PrimitiveType.Class:
			return `${type.id.name}* `
		case PrimitiveType.Unknown:
			return "void "
	}
	return `${type.name} `
}

const parseVars = (vars) => {
	let output = ""
	for(let key in vars) {
		const node = vars[key]
		switch(node.varType.primitive) {
			case PrimitiveType.Function:
				break
			case PrimitiveType.Class:
				output += tabs + parseType(node.varType) + key + " = nullptr;\n"
				break
			default:
				output += tabs + parseType(node.varType) + key + "= ${parseDefaultValue(node.varType)};\n"
				break
		}
	}
	return output
}

const parseDefaultValue = (type) => {
	switch(type.primitive) {
		case PrimitiveType.Number:
			return "0"
		case PrimitiveType.Boolean:
			return false
	}
	return "nullptr"
}

const parseContent = (specifier, content) => {
	outerOutput += `std::string ${specifier.local.name} = R"(${content})";\n\n`
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
	ThisExpression: parseThisExpression,
	ArrowFunctionExpression: parseArrowFunctionExpression,
	ObjectExpression: parseObjectExpression,
	FunctionDeclaration: parseFunctionDeclaration,
	ClassDeclaration: parseClassDeclaration,
	ExportDefaultDeclaration: parseExportDefaultDeclaration,
	ExportNamedDeclaration: parseExportNamedDeclaration,
	ImportDeclaration: parseImportDeclaration,
	MethodDefinition: parseMethodDefinition
}

export { run }