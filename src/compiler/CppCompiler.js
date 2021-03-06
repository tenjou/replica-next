import PrimitiveType from "../PrimitiveType"
import TypeFlag from "../TypeFlag";

let scope = null
let rootScope = null
let insideClass = null
let tabs = ""
let contentOutput = ""
let declarationsOutput = ""
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

	let result = includes + contentOutput + declarationsOutput
	if(globalVars) {
		result += globalVars + "\n"
	}
	result += outerOutput
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
	const elements = node.elements
	if(elements.length === 0) {
		return `${parseType(node.varType)} {}`
	}

	let element = elements[0]
	let output = `{ ${parse[element.type](element)}`
	for(let n = 1; n < elements.length; n++) {
		element = elements[n]
		output += `, ${parse[element.type](element)}`
	}
	output += " }"
	return `${parseType(node.varType)} ${output}`
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
		return `${parseType(initNode.varType)} ${node.id.name};\n`
	}

	switch(initNode.varType.primitive) {
		case PrimitiveType.Function:
			if(!initNode.parsed) { return null }

			const prevTabs = tabs
			tabs = ""
			const head = `${parseType(initNode.returnType)} ${node.id.name}`
			declarationsOutput += `${head}(${parseParams(initNode.params, false)});\n\n`
			outerOutput += `${head}${parse[initNode.type](initNode)}\n`
			tabs = prevTabs
			break

		default:
			if(scope.parent === rootScope) {
				const type = (initNode.type === "Literal") ? parseType(initNode.varType) : "auto"
				globalVars += `${type} ${node.id.name} = ${parse[initNode.type](initNode)};\n`
				return null
			}
			return `${parseType(initNode.varType)} ${node.id.name} = ${parse[initNode.type](initNode)};`
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
	return `(${parse[node.left.type](node.left)} ${node.operator} ${parse[node.right.type](node.right)})` 
}

const parseMemberExpression = (node) => {
	if(node.computed) {
		const output = `${parse[node.object.type](node.object)}->$subscript(${parse[node.property.type](node.property)})`
		return output
	}

	let connection
	if(node.property.varType.flags & TypeFlag.Static) {
		connection = "::"
	}
	else {
		if(node.varType.flags & TypeFlag.Inline) {
			connection = "."
		}
		else {
			connection = "->"
		}
	}

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

	const output = `(${paramsOutput}) ${parse[node.body.type](node.body)}\n`

	scope = prevScope
	return output
}

const parseArrowFunctionExpression = (node) => {
	return parseFunctionExpression(node)
}

const parseObjectExpression = (node, parseInit = true) => {
	const prevScope = scope
	scope = node.scope

	let output
	if(parseInit) {
		const prevTabs = tabs
		tabs = ""

		declarationsOutput += `struct ${parseType(node, false)} {\n${parseProperties(node.properties)}${tabs}};\n\n`
		output = `new ${parseType(node, false)} ${parsePropertiesValues(node.properties)}`

		tabs = prevTabs
	}
	else {
		output = `struct {\n${parseProperties(node.properties)}${tabs}}`
	}

	scope = prevScope
	return output
}

const parseProperties = (properties, node) => {
	incTabs()

	let output = ""
	for(let n = 0; n < properties.length; n++) {
		const property = properties[n]
		if(property.value.varType.primitive === PrimitiveType.Object) {
			output += `${tabs}${parseObjectExpression(property.value, false)} ${property.key.name};\n`
		}
		else {
			output += `${tabs}${parseType(property.value.varType)} ${property.key.name};\n`
		}
	}

	decTabs()
	return output
}

const parsePropertiesValues = (properties) => {
	if(properties.length === 0) {
		return
	}
	let output = "{ "
	let property = properties[0]
	output += parse[property.value.type](property.value)	
	for(let n = 1; n < properties.length; n++) {
		property = properties[n]
		if(property.value.varType.primitive === PrimitiveType.Object) {
			output += `, ${parsePropertiesValues(property.value.properties)}`
		}
		else {
			output += `, ${parse[property.value.type](property.value)}`
		}
	}
	output += " }"
	return output
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
	declarationsOutput += `struct ${node.id.name} ${parse[node.body.type](node.body)};\n\n`
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
			output = `${parseType(node.value.returnType)} ${node.key.name}${parseFunctionExpression(node.value)}`
			break
	}
	return output
}

const parseParams = (params, needName = true) => {
	if(params.length === 0) {
		return ""
	}

	let output = parseParam(params[0], needName)
	for(let n = 1; n < params.length; n++) {
		output += `, ${parseParam(params[n], needName)}`
	}
	return output
}

const parseParam = (param, needName) => {
	return needName ? `${parseType(param.varType)} ${param.name}` : parseType(param.varType)
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

const parseType = (type, pointer = true) => {
	switch(type.primitive) {
		case PrimitiveType.None:
			return "void"
		case PrimitiveType.Number:
			return "double"
		case PrimitiveType.Boolean:
			return "bool"
		case PrimitiveType.String:
			return "std::string"
		case PrimitiveType.Array:
			const templateOutput = `<${parseType(type.templateType)}>`
			return `Array${templateOutput}`	
		case PrimitiveType.Object:
			return pointer ? `__object${type.index}*` : `__object${type.index}`
		case PrimitiveType.Class:
			return pointer ? `${type.id.name}*` : `${type.id.name}`
		case PrimitiveType.Unknown:
			return "void*"
	}
	return `${type.name}`
}

const parseVars = (vars) => {
	let output = ""
	for(let key in vars) {
		const node = vars[key]
		switch(node.varType.primitive) {
			case PrimitiveType.Function:
				break
			case PrimitiveType.Class:
				output += tabs + `${parseType(node.varType)} ${key} = nullptr;\n`
				break
			default:
				output += tabs + `${parseType(node.varType)} ${key} = ${parseDefaultValue(node.varType)};\n`
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
	contentOutput += `std::string ${specifier.local.name} = R"(${content})";\n\n`
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